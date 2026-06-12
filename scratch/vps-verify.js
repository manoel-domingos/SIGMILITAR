const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

// Lê o daemon local para enviar para a VPS
const DAEMON_CODE = fs.readFileSync(
  path.join(__dirname, '../scripts/suparchef-daemon.js'),
  'utf8'
);

// Substitui require('playwright') pelo caminho global do playwright instalado
// Na VPS playwright foi instalado globalmente

const VERIFY_AND_DEPLOY = `
set -e

echo "=== PATH e versões ==="
export PATH=$PATH:/usr/local/bin
pm2 --version
node --version

echo "=== Chromium via Playwright ==="
node -e "const {chromium}=require('playwright'); console.log('Chromium:', chromium.executablePath())" 2>/dev/null || echo "playwright local: tentando path global..."
PLAYWRIGHT_PATH=$(node -e "require.resolve('playwright')" 2>/dev/null || echo "")
echo "Playwright resolve: $PLAYWRIGHT_PATH"

echo "=== Estrutura /root/suparchef ==="
ls -la /root/suparchef/

echo "=== Node modules em /root/suparchef ==="
ls /root/suparchef/node_modules/ 2>/dev/null | head -10 || echo "sem node_modules ainda"

echo "=== Chromium executable ==="
find /root -name "chrome" -o -name "chromium" 2>/dev/null | head -5
find /usr -name "chromium*" 2>/dev/null | head -5

echo "=== VERIFICAÇÃO COMPLETA ==="
`.trim();

conn.on('ready', () => {
  console.log('✅ Conectado!\n');
  conn.exec(`export PATH=$PATH:/usr/local/bin && ${VERIFY_AND_DEPLOY}`, (err, stream) => {
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
