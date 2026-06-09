#!/usr/bin/env node
/**
 * Ralph Loop — Agente de Atualização Diária
 *
 * Executa diariamente via cron para manter os MASTER.md de cada sub-agente
 * atualizados com os dados mais recentes do Supabase.
 *
 * Uso:
 *   node scripts/ralph-loop.js           → Executa ciclo completo
 *   node scripts/ralph-loop.js --init    → Inicializa todos os MASTER.md
 *   node scripts/ralph-loop.js --agent escolas  → Roda apenas um sub-agente
 *   node scripts/ralph-loop.js --dry-run → Simula sem escrever
 *
 * Cron (diário às 6h):
 *   0 6 * * * node /caminho/para/SIGMILITAR/scripts/ralph-loop.js >> /var/log/ralph-loop.log 2>&1
 */

const fs = require('fs');
const path = require('path');

// Load .env if present (local dev)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
async function getSupabase() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('  ⚠ Supabase env vars não configuradas — usando valores de fallback');
    return null;
  }
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const LOG_FILE = path.join(ROOT, 'agents', 'ralph-loop.log');

const AGENTS = ['escolas', 'alunos', 'disciplina', 'pedagogico', 'relatorios'];

const args = process.argv.slice(2);
const IS_INIT = args.includes('--init');
const IS_DRY_RUN = args.includes('--dry-run');
const SINGLE_AGENT = args.includes('--agent') ? args[args.indexOf('--agent') + 1] : null;

// ─── Utilities ────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Cuiaba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dateStamp() {
  const d = new Date();
  const tz = 'America/Cuiaba';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(d)
    .split('/')
    .reverse()
    .join('-');
}

function log(msg) {
  const line = `[${now()}] ${msg}`;
  console.log(line);
  if (!IS_DRY_RUN) {
    fs.appendFileSync(LOG_FILE, line + '\n');
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function readMaster(agent) {
  const masterPath = path.join(AGENTS_DIR, agent, 'MASTER.md');
  if (!fs.existsSync(masterPath)) return null;
  return fs.readFileSync(masterPath, 'utf8');
}

function writeMaster(agent, content) {
  const masterPath = path.join(AGENTS_DIR, agent, 'MASTER.md');
  if (IS_DRY_RUN) {
    console.log(`[DRY-RUN] Would write to: ${masterPath}`);
    console.log(content.slice(0, 300) + '...');
    return;
  }
  fs.writeFileSync(masterPath, content);
}

// ─── Per-Agent Data Collectors ────────────────────────────────────────────────

/**
 * Cada função tenta coletar métricas reais do sistema.
 * Em ambiente sem Supabase configurado, retorna métricas de exemplo.
 * Integre com @supabase/supabase-js para dados reais.
 */

async function collectEscolas() {
  const dataDir = path.join(AGENTS_DIR, 'escolas', 'data');
  const files = countFiles(dataDir);
  const alerts = [];
  const metrics = { 'Arquivos em data/': files };

  const sb = await getSupabase();
  if (sb) {
    const { data: schools } = await sb.from('schools').select('id, name, slug');
    metrics['Escolas ativas'] = schools ? schools.length : 'erro';

    const { data: settings } = await sb.from('school_settings')
      .select('school_id, google_access_token')
      .not('google_access_token', 'is', null);
    metrics['OAuth Google configurado'] = settings ? `${settings.length} escola(s)` : '0';

    if (schools && settings && settings.length < schools.length) {
      alerts.push(`${schools.length - settings.length} escola(s) sem OAuth Google configurado`);
    }
  } else {
    metrics['Escolas ativas'] = '3 (joaobatista, heliodoro, tangara)';
    metrics['OAuth Google configurado'] = 'Sem conexão Supabase';
  }

  return { summary: 'Configurações de tenant e OAuth', metrics, alerts };
}

async function collectAlunos() {
  const dataDir = path.join(AGENTS_DIR, 'alunos', 'data');
  const files = countFiles(dataDir);
  const alerts = [];
  const metrics = { 'Arquivos em data/': files };

  const sb = await getSupabase();
  if (sb) {
    const { count: ativos } = await sb.from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    metrics['Alunos ativos'] = ativos ?? 'erro';

    const { count: arquivados } = await sb.from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived');
    metrics['Alunos arquivados'] = arquivados ?? 'erro';

    const { count: semTurma } = await sb.from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('class_id', null);
    metrics['Alunos ativos sem turma'] = semTurma ?? 'erro';

    if (semTurma > 0) alerts.push(`${semTurma} aluno(s) ativo(s) sem turma atribuída`);
  } else {
    metrics['Alunos ativos'] = 'Sem conexão Supabase';
  }

  return { summary: 'Cadastro e gestão de estudantes', metrics, alerts };
}

async function collectDisciplina() {
  const dataDir = path.join(AGENTS_DIR, 'disciplina', 'data');
  const files = countFiles(dataDir);
  const alerts = [];
  const metrics = { 'Arquivos em data/': files };

  const sb = await getSupabase();
  if (sb) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: ocorrenciasMes } = await sb.from('occurrences')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());
    metrics['Ocorrências (mês atual)'] = ocorrenciasMes ?? 'erro';

    const { count: fichasPendentes } = await sb.from('notification_forms')
      .select('*', { count: 'exact', head: true })
      .eq('signed', false);
    metrics['Fichas aguardando assinatura'] = fichasPendentes ?? 'erro';

    const { count: elogiosMes } = await sb.from('praises')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());
    metrics['Elogios (mês atual)'] = elogiosMes ?? 'erro';

    if (fichasPendentes > 10) alerts.push(`${fichasPendentes} fichas aguardando assinatura`);
  } else {
    metrics['Ocorrências (mês atual)'] = 'Sem conexão Supabase';
  }

  return { summary: 'Ocorrências disciplinares e sanções', metrics, alerts };
}

async function collectPedagogico() {
  const dataDir = path.join(AGENTS_DIR, 'pedagogico', 'data');
  const files = countFiles(dataDir);
  const alerts = [];
  const metrics = { 'Arquivos em data/': files };

  const sb = await getSupabase();
  if (sb) {
    const { count: ficaiAtivos } = await sb.from('ficai_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    metrics['Alunos em acompanhamento FICAI'] = ficaiAtivos ?? 'erro';

    const { data: megData } = await sb.from('meg_evidence')
      .select('completed')
      .limit(1000);
    if (megData && megData.length > 0) {
      const done = megData.filter(r => r.completed).length;
      const pct = Math.round((done / megData.length) * 100);
      metrics['Progresso MEG médio'] = `${pct}% (${done}/${megData.length} critérios)`;
      if (pct < 50) alerts.push(`Progresso MEG abaixo de 50% (${pct}%)`);
    } else {
      metrics['Progresso MEG médio'] = 'Sem dados';
    }
  } else {
    metrics['Progresso MEG médio'] = 'Sem conexão Supabase';
  }

  return { summary: 'MEG e acompanhamento pedagógico', metrics, alerts };
}

async function collectRelatorios() {
  const dataDir = path.join(AGENTS_DIR, 'relatorios', 'data');
  const files = countFiles(dataDir);
  const alerts = [];
  const metrics = { 'Arquivos em data/': files };

  const sb = await getSupabase();
  if (sb) {
    const { count: fechamentosPendentes } = await sb.from('period_closures')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    metrics['Fechamentos de período pendentes'] = fechamentosPendentes ?? 'erro';

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: auditoria30d } = await sb.from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo);
    metrics['Ações auditadas (30d)'] = auditoria30d ?? 'erro';

    if (fechamentosPendentes > 0) alerts.push(`${fechamentosPendentes} fechamento(s) de período pendente(s)`);
  } else {
    metrics['Fechamentos pendentes'] = 'Sem conexão Supabase';
  }

  return { summary: 'Relatórios, DRE e análises', metrics, alerts };
}

const COLLECTORS = {
  escolas: collectEscolas,
  alunos: collectAlunos,
  disciplina: collectDisciplina,
  pedagogico: collectPedagogico,
  relatorios: collectRelatorios,
};

// ─── MASTER.md Generator ──────────────────────────────────────────────────────

function buildMasterMd(agent, data, prevMaster) {
  const date = dateStamp();
  const agentTitle = agent.charAt(0).toUpperCase() + agent.slice(1);

  // Preserve existing changelog entries
  const existingChangelog = prevMaster
    ? (prevMaster.match(/## Changelog\n([\s\S]*?)(?=\n---|\n## Estado|$)/) || ['', ''])[1].trim()
    : '';

  const metricsTable = Object.entries(data.metrics)
    .map(([k, v]) => `| ${k} | ${v} | ${date} |`)
    .join('\n');

  const alertsSection = data.alerts.length > 0
    ? data.alerts.map(a => `- ⚠️ ${a}`).join('\n')
    : '- Nenhum alerta ativo';

  const newEntry = `### ${date} — Ciclo Ralph Loop${IS_INIT ? ' (inicialização)' : ''}
**Trigger:** ${IS_INIT ? 'ralph-loop --init' : 'Cron diário automatizado'}
**Resumo:** ${data.summary}
**Métricas coletadas:** ${Object.keys(data.metrics).length} indicadores atualizados
**Alertas:** ${data.alerts.length === 0 ? 'Nenhum' : data.alerts.join('; ')}
**Status:** Concluído`;

  return `# MASTER.md — Sub-agente: ${agentTitle}

> Changelog automático. Atualizado pelo Ralph Loop e pelo Sub-agente após cada análise relevante.
> O Agente Orquestrador lê este arquivo para obter um resumo rápido do domínio sem precisar acionar o sub-agente completo.

---

## Resumo do Domínio

**Sub-agente:** ${agentTitle}
**Última atualização:** ${date} (Ralph Loop)
**Status geral:** ${data.alerts.length > 0 ? `⚠️ ${data.alerts.length} alerta(s) ativo(s)` : '✓ Normal'}

---

## Changelog

${newEntry}

${existingChangelog}

---

## Estado Atual

| Indicador | Valor | Atualizado em |
|-----------|-------|---------------|
${metricsTable}

---

## Alertas Ativos

${alertsSection}

---

## Instruções para o Orquestrador

Para análise superficial: este arquivo contém o resumo mais recente do domínio **${agentTitle}**.
Para análise profunda: acione o sub-agente lendo \`agents/${agent}/CLAUDE.md\` e os arquivos em \`agents/${agent}/data/\`.
`;
}

// ─── Main Loop ────────────────────────────────────────────────────────────────

async function runAgent(agent) {
  log(`→ Iniciando sub-agente: ${agent}`);

  const collector = COLLECTORS[agent];
  if (!collector) {
    log(`  ✗ Coletor não encontrado para: ${agent}`);
    return false;
  }

  try {
    const data = await collector();
    const prevMaster = readMaster(agent);
    const masterContent = buildMasterMd(agent, data, prevMaster);

    writeMaster(agent, masterContent);
    log(`  ✓ MASTER.md atualizado: ${agent} (${data.alerts.length} alertas)`);
    return true;
  } catch (err) {
    log(`  ✗ Erro no sub-agente ${agent}: ${err.message}`);
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════');
  log(`Ralph Loop iniciado — ${IS_INIT ? 'INIT' : 'ciclo diário'}${IS_DRY_RUN ? ' [DRY-RUN]' : ''}`);

  const agentsToRun = SINGLE_AGENT ? [SINGLE_AGENT] : AGENTS;

  let success = 0;
  let failed = 0;

  for (const agent of agentsToRun) {
    const ok = await runAgent(agent);
    ok ? success++ : failed++;
  }

  log(`─────────────────────────────────────`);
  log(`Ciclo concluído: ${success} OK, ${failed} falhas`);

  // Atualizar log de última execução no orquestrador
  if (!IS_DRY_RUN) {
    const statusLine = `\n<!-- ralph-loop: última execução ${now()} — ${success}/${agentsToRun.length} agentes OK -->`;
    const claudeMdPath = path.join(ROOT, 'CLAUDE.md');
    const claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
    const updated = claudeMd.replace(/\n<!-- ralph-loop:.*-->/, '') + statusLine;
    fs.writeFileSync(claudeMdPath, updated);
  }

  log('═══════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
