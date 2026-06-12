#!/usr/bin/env node
/**
 * suparchef-daemon.js
 * Daemon VPS — polinga o Supabase a cada 10s por jobs com status='idle'
 * e executa o Playwright automaticamente.
 *
 * Uso:
 *   node scripts/suparchef-daemon.js
 *   pm2 start scripts/suparchef-daemon.js --name suparchef
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL       — URL do projeto Supabase
 *   SUPABASE_SERVICE_KEY — service_role key
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[suparchef] SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const POLL_INTERVAL = 10_000; // 10 segundos
const HEARTBEAT_INTERVAL = 30_000; // 30 segundos

let isProcessing = false;

// ─── Heartbeat ────────────────────────────────────────────────────────────────
async function sendHeartbeat() {
  try {
    await supabase.from('suparchef_config').upsert({
      key: 'daemon_heartbeat',
      value: { ts: new Date().toISOString(), host: require('os').hostname() },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  } catch (e) {
    // non-critical
  }
}

// ─── Log helper ───────────────────────────────────────────────────────────────
async function appendLog(jobId, entry) {
  try {
    const { data: row } = await supabase
      .from('suparchef_jobs')
      .select('logs')
      .eq('id', jobId)
      .maybeSingle();

    const existing = Array.isArray(row?.logs) ? row.logs : [];
    existing.push(entry);

    await supabase
      .from('suparchef_jobs')
      .update({ logs: existing, updated_at: new Date().toISOString() })
      .eq('id', jobId);
  } catch { /* non-critical */ }
}

function log(jobId, email, step, ok = true) {
  const entry = { ts: new Date().toISOString(), email, step, ok };
  console.log(`[${ok ? '✓' : '✗'}] ${email} — ${step}`);
  return appendLog(jobId, entry);
}

// ─── Playwright Automation ────────────────────────────────────────────────────
async function runJob(job) {
  let chromium;
  try {
    const playwright = require('playwright');
    chromium = playwright.chromium;
  } catch {
    throw new Error('Playwright não instalado. Execute: npm install playwright && npx playwright install chromium');
  }

  const results = [];

  for (const account of job.accounts) {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      // 1. Navegar para o site alvo
      await log(job.id, account.email, `Navegando para ${job.target_url}…`);
      await page.goto(job.target_url, { waitUntil: 'networkidle', timeout: 30_000 });

      // 2. Procurar botão Login com Google
      const googleSelectors = [
        'button:has-text("Google")',
        'a:has-text("Google")',
        '[data-provider="google"]',
        '.google-login',
        '#google-login',
        'button:has-text("Entrar com Google")',
        'a:has-text("Entrar com Google")',
        'button:has-text("Login com Google")',
        'button:has-text("Continuar com Google")',
        'a:has-text("Continuar com Google")',
      ];

      await log(job.id, account.email, 'Procurando botão de login Google…');
      let clickedLogin = false;
      for (const sel of googleSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            clickedLogin = true;
            break;
          }
        } catch { /* próximo */ }
      }

      if (!clickedLogin) {
        await log(job.id, account.email, 'Botão de login Google não encontrado', false);
        results.push({ email: account.email, success: false, message: 'Botão de login Google não encontrado' });
        await browser.close();
        continue;
      }

      // 3. Aguardar redirect para Google
      await log(job.id, account.email, 'Aguardando redirect para Google…');
      await page.waitForURL(/accounts\.google\.com/, { timeout: 15_000 });

      // 4. Preencher e-mail
      await log(job.id, account.email, 'Preenchendo e-mail…');
      await page.locator('input[type="email"]').fill(account.email);
      await page.locator('button:has-text("Próxima"), button:has-text("Next")').click();

      // 5. Aguardar e preencher senha
      await log(job.id, account.email, 'Preenchendo senha…');
      await page.waitForSelector('input[type="password"]', { timeout: 10_000 });
      await page.locator('input[type="password"]').fill(account.password);
      await page.locator('button:has-text("Próxima"), button:has-text("Next")').click();

      // 6. Aguardar retorno ao site
      await log(job.id, account.email, 'Aguardando retorno ao site…');
      await page.waitForURL(url => !url.includes('accounts.google.com'), { timeout: 30_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      await log(job.id, account.email, 'Login concluído. Procurando botão de voto…');

      // 7. Clicar no elemento de voto
      // O seletor pode ser múltiplo separado por vírgula
      const selectors = job.vote_selector.split(',').map(s => s.trim()).filter(Boolean);
      let voted = false;

      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          await el.waitFor({ state: 'visible', timeout: 8_000 });

          // Verifica se está desabilitado
          const isDisabled = await el.isDisabled();
          if (isDisabled) {
            await log(job.id, account.email, `Botão encontrado mas desabilitado (${sel}) — aguardando…`);
            // Aguarda até 10s ficar habilitado
            await page.waitForFunction(
              (s) => {
                const btn = document.querySelector(s);
                return btn && !btn.disabled;
              },
              sel,
              { timeout: 10_000 }
            ).catch(() => {});
          }

          await el.click();
          voted = true;
          break;
        } catch { /* tenta próximo seletor */ }
      }

      if (!voted) {
        await log(job.id, account.email, `Botão de voto não encontrado com seletor: ${job.vote_selector}`, false);
        results.push({ email: account.email, success: false, message: `Botão não encontrado: ${job.vote_selector}` });
        await browser.close();
        continue;
      }

      await page.waitForTimeout(2000);
      await log(job.id, account.email, 'Voto registrado com sucesso ✓');
      results.push({ email: account.email, success: true, message: 'Voto registrado com sucesso' });
    } catch (err) {
      const msg = err?.message || String(err);
      await log(job.id, account.email, `Erro: ${msg.slice(0, 200)}`, false);
      results.push({ email: account.email, success: false, message: msg.slice(0, 200) });
    } finally {
      await browser.close();
    }
  }

  return results;
}

// ─── Job processor ────────────────────────────────────────────────────────────
async function processNextJob() {
  if (isProcessing) return;

  const { data: jobs, error } = await supabase
    .from('suparchef_jobs')
    .select('id, target_url, vote_selector, accounts')
    .eq('status', 'idle')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[suparchef] Erro ao buscar jobs:', error.message);
    return;
  }

  if (!jobs || jobs.length === 0) return;

  const job = jobs[0];
  isProcessing = true;
  console.log(`[suparchef] Iniciando job ${job.id}…`);

  // Marcar como running
  await supabase
    .from('suparchef_jobs')
    .update({ status: 'running', started_at: new Date().toISOString(), logs: [], error: null, results: null, updated_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    const results = await runJob(job);
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
    console.log(`[suparchef] Job ${job.id} finalizado — ${allOk ? 'SUCESSO' : 'FALHA'}`);
  } catch (err) {
    const msg = err?.message || String(err);
    await supabase
      .from('suparchef_jobs')
      .update({ status: 'failed', error: msg, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', job.id);
    console.error(`[suparchef] Job ${job.id} falhou:`, msg);
  }

  isProcessing = false;
}

// ─── Start ────────────────────────────────────────────────────────────────────
console.log('[suparchef] Daemon iniciado. Aguardando jobs…');
console.log(`[suparchef] Polling a cada ${POLL_INTERVAL / 1000}s`);

sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
setInterval(processNextJob, POLL_INTERVAL);

// Executa imediatamente no start
processNextJob();
