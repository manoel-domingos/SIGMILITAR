#!/usr/bin/env node
/**
 * suparchef-daemon.js — Daemon de execução de jobs do Suparchef na VPS
 *
 * Ele monitora a tabela 'suparchef_jobs' e executa qualquer tarefa em estado 'idle' (Aguardando).
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const path = require('path');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let isRunningJob = false;

function log(msg) {
  console.log(`[DAEMON] [${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
}

// Executa um job específico chamando o script suparchef-bot.js
function executeJob(jobId) {
  return new Promise((resolve) => {
    log(`Iniciando execução do Job ID: ${jobId}`);
    
    const botPath = path.join(__dirname, 'suparchef-bot.js');
    const child = spawn('node', [botPath, '--job', jobId], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    child.on('close', (code) => {
      log(`Job ID ${jobId} finalizado com código de saída: ${code}`);
      resolve();
    });
  });
}

// Verifica se existem jobs pendentes (status = 'idle') e os processa sequencialmente
async function pollPendingJobs() {
  if (isRunningJob) return;

  try {
    // Busca um job que esteja em estado 'idle' (Aguardando)
    const { data: jobs, error } = await supabase
      .from('suparchef_jobs')
      .select('id, label')
      .eq('status', 'idle')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      log(`Erro ao buscar jobs do Supabase: ${error.message}`);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return; // Nada para fazer
    }

    const targetJob = jobs[0];
    isRunningJob = true;

    log(`Job pendente detectado: "${targetJob.label}" (${targetJob.id})`);

    // Tenta obter o lock atômico mudando o status para 'running'
    // Se a linha já foi pega por outra instância do daemon, o update não afetará nenhuma linha.
    const { data: updatedJobs, error: lockError } = await supabase
      .from('suparchef_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', targetJob.id)
      .eq('status', 'idle')
      .select();

    if (lockError) {
      log(`Erro ao tentar travar o job: ${lockError.message}`);
      isRunningJob = false;
      return;
    }

    if (!updatedJobs || updatedJobs.length === 0) {
      log(`Job "${targetJob.label}" já foi iniciado por outro executor. Pulando...`);
      isRunningJob = false;
      return;
    }

    // Executa
    try {
      await executeJob(targetJob.id);
    } catch (execErr) {
      log(`Falha crítica na execução do Job: ${execErr.message}`);
      await supabase
        .from('suparchef_jobs')
        .update({ status: 'failed', error: execErr.message, finished_at: new Date().toISOString() })
        .eq('id', targetJob.id);
    } finally {
      isRunningJob = false;
      // Checa se há mais jobs pendentes imediatamente
      setTimeout(pollPendingJobs, 1000);
    }

  } catch (err) {
    log(`Erro genérico no loop do daemon: ${err.message}`);
    isRunningJob = false;
  }
}

// Inicia monitoramento
log('Daemon do Suparchef iniciado na VPS com sucesso!');
log(`Conectado ao Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

// Polling regular a cada 10 segundos
setInterval(pollPendingJobs, 10000);

// Executa imediatamente no início
pollPendingJobs();

// Escuta em tempo real se a tabela sofrer alterações
const subscription = supabase
  .channel('suparchef-jobs-changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suparchef_jobs' }, (payload) => {
    if (payload.new && payload.new.status === 'idle') {
      log('Novo job inserido em tempo real. Disparando verificação...');
      pollPendingJobs();
    }
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'suparchef_jobs' }, (payload) => {
    if (payload.new && payload.new.status === 'idle') {
      log('Job atualizado para idle em tempo real. Disparando verificação...');
      pollPendingJobs();
    }
  })
  .subscribe();

// Garante encerramento limpo
process.on('SIGTERM', () => {
  log('Sinal SIGTERM recebido. Encerrando daemon...');
  subscription.unsubscribe();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Sinal SIGINT recebido. Encerrando daemon...');
  subscription.unsubscribe();
  process.exit(0);
});
