#!/usr/bin/env node
/**
 * suparchef-bot.js — Automação de votação via Playwright
 *
 * Uso:
 *   node scripts/suparchef-bot.js --job <uuid>
 *   node scripts/suparchef-bot.js --list
 *   node scripts/suparchef-bot.js --all          # executa todos com status idle
 *
 * Requer:
 *   npm install playwright
 *   npx playwright install chromium
 */

require('dotenv').config({ path: '.env.local' });

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const args = process.argv.slice(2);
const jobId = args[args.indexOf('--job') + 1];
const listMode = args.includes('--list');
const allMode = args.includes('--all');

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Automação de um único par (email, senha) ────────────────────────────────

async function automateAccount(job, account) {
  const browser = await chromium.launch({
    headless: false, // false = vê o browser abrindo (útil para debug)
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Cuiaba',
  });

  const page = await context.newPage();

  // Remove assinaturas de automação
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    log(`[${account.email}] Abrindo ${job.target_url}`);
    await page.goto(job.target_url, { waitUntil: 'networkidle', timeout: 30000 });

    // ── 1. Clicar em "Login com Google" ──────────────────────────────────────
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
          log(`[${account.email}] Clicando login Google: ${sel}`);
          await el.click();
          clickedLogin = true;
          break;
        }
      } catch { /* tenta próximo */ }
    }

    if (!clickedLogin) {
      throw new Error('Botão de login Google não encontrado. Verifique o site e ajuste os seletores.');
    }

    // ── 2. Aguardar página do Google ──────────────────────────────────────────
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
    log(`[${account.email}] Na página do Google`);

    // ── 3. E-mail ─────────────────────────────────────────────────────────────
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.locator('input[type="email"]').fill(account.email);
    await sleep(500);
    await page.keyboard.press('Enter');

    // ── 4. Senha ──────────────────────────────────────────────────────────────
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.locator('input[type="password"]').fill(account.password);
    await sleep(500);
    await page.keyboard.press('Enter');

    // ── 5. Aguardar redirect de volta (pode aparecer 2FA / tela de confirmação) ─
    log(`[${account.email}] Aguardando redirect pós-login…`);
    try {
      await page.waitForURL(url => !url.href.includes('accounts.google.com'), { timeout: 45000 });
    } catch {
      // Pode estar em tela de 2FA — aguarda mais
      log(`[${account.email}] ⚠️  Possível 2FA ou verificação extra. Aguardando 20s…`);
      await sleep(20000);
      const current = page.url();
      if (current.includes('accounts.google.com')) {
        throw new Error('Preso na tela do Google (2FA ou bloqueio). Verifique a conta manualmente.');
      }
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 });
    log(`[${account.email}] Logado. URL: ${page.url()}`);

    // ── 6. Clicar no elemento de voto ─────────────────────────────────────────
    log(`[${account.email}] Procurando seletor de voto: ${job.vote_selector}`);
    const voteEl = page.locator(job.vote_selector).first();
    await voteEl.waitFor({ state: 'visible', timeout: 15000 });
    await voteEl.scrollIntoViewIfNeeded();
    await sleep(500);
    await voteEl.click();
    log(`[${account.email}] ✅ Clicou no voto`);

    // Pequena espera para confirmar
    await sleep(3000);

    await browser.close();
    return { email: account.email, success: true, message: 'Voto registrado com sucesso' };
  } catch (err) {
    await browser.close();
    const msg = err instanceof Error ? err.message : String(err);
    log(`[${account.email}] ❌ ${msg}`);
    return { email: account.email, success: false, message: msg.slice(0, 300) };
  }
}

// ─── Executar job completo ────────────────────────────────────────────────────

async function runJob(job) {
  log(`Iniciando job "${job.label}" (${job.accounts.length} conta(s))`);

  await supabase
    .from('suparchef_jobs')
    .update({ status: 'running', started_at: new Date().toISOString(), error: null, results: null, updated_at: new Date().toISOString() })
    .eq('id', job.id);

  const results = [];
  for (const account of job.accounts) {
    const result = await automateAccount(job, account);
    results.push(result);
    if (job.accounts.indexOf(account) < job.accounts.length - 1) {
      // Pausa entre contas para evitar detecção de padrão
      log('Aguardando 5s antes da próxima conta…');
      await sleep(5000);
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

  log(`Job "${job.label}" finalizado. ${results.filter(r => r.success).length}/${results.length} votos OK.`);
  console.table(results);
  return results;
}

// ─── Listar jobs ──────────────────────────────────────────────────────────────

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

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente ausentes. Crie .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
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
      log('Nenhum job com status idle encontrado.');
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
  node scripts/suparchef-bot.js --job <uuid>    # executa um job específico
  node scripts/suparchef-bot.js --list          # lista todos os jobs
  node scripts/suparchef-bot.js --all           # executa todos os jobs idle

Pré-requisitos:
  npm install playwright
  npx playwright install chromium
`);
    process.exit(1);
  }

  const { data: job, error } = await supabase
    .from('suparchef_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !job) {
    console.error(`Job não encontrado: ${jobId}`);
    process.exit(1);
  }

  await runJob(job);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
