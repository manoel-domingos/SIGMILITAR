const { Client } = require('ssh2');

const conn = new Client();

// Comandos de setup completo na VPS
const SETUP = `
set -e
echo "=== Instalando PM2 ==="
npm install -g pm2

echo "=== Instalando Playwright + Chromium ==="
cd /root/suparchef || (mkdir -p /root/suparchef && cd /root/suparchef)
npm install -g playwright
npx playwright install chromium --with-deps

echo "=== Verificando instalações ==="
pm2 --version
chromium --version 2>/dev/null || chromium-browser --version 2>/dev/null || node -e "const {chromium}=require('playwright'); chromium.executablePath().then(p=>console.log('Chromium em:',p))"

echo "=== Listando /root/suparchef ==="
ls -la /root/suparchef/

echo "=== SETUP CONCLUIDO ==="
`.trim();

conn.on('ready', () => {
  console.log('✅ Conectado! Iniciando setup...\n');
  conn.exec(SETUP, { pty: false }, (err, stream) => {
    if (err) { console.error('Erro:', err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('\n--- Finalizado (code:', code, ') ---');
      conn.end();
    });
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
});

conn.on('error', (err) => console.error('❌ Erro SSH:', err.message));

conn.connect({
  host: '62.238.19.20',
  port: 22,
  username: 'root',
  password: '2FPUYEZ&jn-+DjZ',
  readyTimeout: 15000,
  hostVerifier: () => true,
});
