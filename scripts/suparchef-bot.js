#!/usr/bin/env node
/**
 * suparchef-bot.js — Automação de votação via Playwright
 *
 * Uso:
 *   node scripts/suparchef-bot.js --auth <email>   # Configura/loga uma conta manualmente e salva cookies
 *   node scripts/suparchef-bot.js --job <uuid>     # Executa um job específico
 *   node scripts/suparchef-bot.js --list           # Lista todos os jobs
 *   node scripts/suparchef-bot.js --all            # Executa todos com status idle
 */

require('dotenv').config({ path: '.env.local' });

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const args = process.argv.slice(2);
const authEmail = args.includes('--auth') ? args[args.indexOf('--auth') + 1] : null;
const jobId = args.includes('--job') ? args[args.indexOf('--job') + 1] : null;
const listMode = args.includes('--list');
const allMode = args.includes('--all');

// Helper de logs
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 1. Fluxo de Autenticação / Geração de Cookie (Manualmente na primeira vez) ───
async function runManualAuth(email) {
  if (!email) {
    console.error('❌ E-mail obrigatório. Uso: node scripts/suparchef-bot.js --auth seu-email@gmail.com');
    process.exit(1);
  }

  log(`Iniciando autenticação guiada para: ${email}`);
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Cuiaba',
  });

  const page = await context.newPage();

  // Remove webdriver para reduzir detecção
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  // Abre login do Google
  await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle' });

  console.log('\n================================================================');
  console.log(`👉 FAÇA O LOGIN MANUAL NO GOOGLE PARA A CONTA: ${email}`);
  console.log('👉 Resolva o CAPTCHA e a Verificação em Duas Etapas (2FA) se necessário.');
  console.log('👉 FECHE A JANELA DO NAVEGADOR ou aperte ENTER no terminal ao terminar.');
  console.log('================================================================\n');

  // Aguarda fechar ou apertar Enter
  const stdinListener = new Promise(resolve => {
    process.stdin.once('data', () => {
      resolve('enter');
    });
  });

  const browserCloseListener = new Promise(resolve => {
    browser.on('disconnected', () => {
      resolve('closed');
    });
  });

  const trigger = await Promise.race([stdinListener, browserCloseListener]);

  // Salva cookies se o browser ainda estiver conectado
  if (browser.isConnected()) {
    const sessionsDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const statePath = path.join(sessionsDir, `${email}.json`);
    await context.storageState({ path: statePath });
    log(`✅ Sessão e cookies salvos com sucesso em: ${statePath}`);
    await browser.close();
  } else {
    log(`⚠️ Navegador foi fechado. Certifique-se de que efetuou o login com sucesso.`);
  }

  process.exit(0);
}

// ─── 2. Automação de um único e-mail usando Sessão Salva ───
async function automateAccount(job, account) {
  const sessionsDir = path.join(process.cwd(), 'sessions');
  const sessionPath = path.join(sessionsDir, `${account.email}.json`);
  const hasSession = fs.existsSync(sessionPath);

  log(`[${account.email}] Iniciando processo de votação.`);

  const launchOptions = {
    headless: true, // Sempre headless no VPS/Background
    args: ['--disable-blink-features=AutomationControlled'],
  };

  const browser = await chromium.launch(launchOptions);
  let context;

  if (hasSession) {
    log(`[${account.email}] Carregando cookies salvos do arquivo de sessão...`);
    context = await browser.newContext({
      storageState: sessionPath,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Cuiaba',
    });
  } else {
    log(`[${account.email}] ⚠️ Sessão não encontrada. Tentando login automatizado clássico (frágil)...`);
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Cuiaba',
    });
  }

  const page = await context.newPage();

  // Remove webdriver flag
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    log(`[${account.email}] Acessando site: ${job.target_url}`);
    await page.goto(job.target_url, { waitUntil: 'networkidle', timeout: 45000 });

    // Se não tiver sessão ou se for necessário logar no site alvo
    const voteEl = page.locator(job.vote_selector).first();
    const isVoteVisible = await voteEl.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVoteVisible) {
      log(`[${account.email}] Botão de voto não visível de imediato. Tentando fluxo de login...`);
      
      const googleSelectors = [
        'button:has-text("Google")',
        'a:has-text("Google")',
        'button:has-text("Entrar com Google")',
        'a:has-text("Entrar com Google")',
        'button:has-text("Login com Google")',
        'a:has-text("Login com Google")',
        '[data-provider="google"]',
        '.google-login',
        '#google-login',
        '[href*="accounts.google.com"]',
        '[href*="oauth/google"]',
      ];

      let clickedLogin = false;
      for (const sel of googleSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            log(`[${account.email}] Clicando no login do Google do site: ${sel}`);
            await el.click();
            clickedLogin = true;
            break;
          }
        } catch { /* tenta próximo seletor */ }
      }

      if (!clickedLogin) {
        throw new Error('Botão de login Google não encontrado no site e o botão de voto está oculto.');
      }

      // Se já possui cookies da sessão do Google, deve fazer o redirect imediato sem pedir dados
      log(`[${account.email}] Aguardando login concluir via cookies...`);
      
      // Caso não tenha sessão salva e caia na página do Google, tenta preencher os campos
      if (page.url().includes('accounts.google.com')) {
        if (!hasSession) {
          log(`[${account.email}] Executando login por digitação (sem sessão)...`);
          // E-mail
          await page.waitForSelector('input[type="email"]', { timeout: 10000 });
          await page.locator('input[type="email"]').fill(account.email);
          await sleep(500);
          await page.keyboard.press('Enter');

          // Senha
          await page.waitForSelector('input[type="password"]', { timeout: 10000 });
          await page.locator('input[type="password"]').fill(account.password);
          await sleep(500);
          await page.keyboard.press('Enter');
        } else {
          throw new Error('Sessão expirou ou Google solicitou autenticação de segurança adicional (2FA/Captcha).');
        }
      }

      // Aguarda redirect de volta para o site alvo
      await page.waitForURL(url => !url.href.includes('accounts.google.com'), { timeout: 40000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }

    // Clicar no voto
    log(`[${account.email}] Procurando botão de voto pelo seletor CSS: ${job.vote_selector}`);
    await voteEl.waitFor({ state: 'visible', timeout: 15000 });
    await voteEl.scrollIntoViewIfNeeded();
    await sleep(1000);
    await voteEl.click();
    log(`[${account.email}] ✅ Clicou com sucesso no botão de voto!`);

    await sleep(3000); // Aguarda confirmação visual do voto na tela antes de sair

    await browser.close();
    return { email: account.email, success: true, message: 'Voto computado com sucesso' };
  } catch (err) {
    await browser.close();
    const msg = err instanceof Error ? err.message : String(err);
    log(`[${account.email}] ❌ Erro: ${msg}`);
    return { email: account.email, success: false, message: msg.slice(0, 300) };
  }
}

// ─── 3. Execução do Job completo ───
async function runJob(job) {
  log(`Iniciando job "${job.label}" com ${job.accounts.length} conta(s).`);

  await supabase
    .from('suparchef_jobs')
    .update({ 
      status: 'running', 
      started_at: new Date().toISOString(), 
      error: null, 
      results: null, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', job.id);

  const results = [];

  // Vota e-mail por e-mail, sequencialmente (1 por vez) para segurança
  for (const account of job.accounts) {
    const result = await automateAccount(job, account);
    results.push(result);

    // Salva resultado parcial no banco após cada voto para acompanhamento em tempo real
    await supabase
      .from('suparchef_jobs')
      .update({ results, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    if (job.accounts.indexOf(account) < job.accounts.length - 1) {
      log('Aguardando 10 segundos antes do próximo e-mail...');
      await sleep(10000);
    }
  }

  const allOk = results.every(r => r.success);
  await supabase
    .from('suparchef_jobs')
    .update({
      status: allOk ? 'done' : 'failed',
      results,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  log(`Job "${job.label}" finalizado. ${results.filter(r => r.success).length}/${results.length} votos com sucesso.`);
  return results;
}

// ─── 4. Comando List ───
async function listJobs() {
  const { data, error } = await supabase
    .from('suparchef_jobs')
    .select('id, label, status, target_url, accounts')
    .order('created_at', { ascending: false });

  if (error) { console.error(error.message); process.exit(1); }

  console.log('\n=== Suparchef Jobs ===\n');
  data.forEach(j => {
    console.log(`[${j.status.padEnd(7)}] ${j.id.slice(0, 8)}…  "${j.label}"  (${j.accounts.length} conta(s))`);
    console.log(`           URL: ${j.target_url}\n`);
  });
}

// ─── 5. Main Control Flow ───
async function main() {
  if (authEmail) {
    await runManualAuth(authEmail);
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente ausentes. Adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
  }

  if (listMode) {
    await listJobs();
    return;
  }

  if (allMode) {
    const { data: idleJobs } = await supabase
      .from('suparchef_jobs')
      .select('*')
      .eq('status', 'idle')
      .order('created_at', { ascending: true });

    if (!idleJobs || idleJobs.length === 0) {
      log('Nenhum job em estado "idle" (Aguardando) para executar.');
      return;
    }

    for (const job of idleJobs) {
      await runJob(job);
    }
    return;
  }

  if (!jobId) {
    console.log(`
Uso:
  node scripts/suparchef-bot.js --auth <email>    # Abre browser guiado para salvar cookies do Google
  node scripts/suparchef-bot.js --job <uuid>      # Executa um job específico por ID
  node scripts/suparchef-bot.js --list            # Lista todos os jobs salvos
  node scripts/suparchef-bot.js --all             # Executa todos os jobs pendentes (idle)
`);
    process.exit(1);
  }

  const { data: job, error } = await supabase
    .from('suparchef_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !job) {
    console.error(`❌ Job não encontrado com ID: ${jobId}`);
    process.exit(1);
  }

  await runJob(job);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
