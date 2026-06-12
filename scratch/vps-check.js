const { Client } = require('ssh2');

const conn = new Client();

const COMMANDS = [
  'uname -a',
  'node --version 2>/dev/null || echo "node: nao instalado"',
  'npm --version 2>/dev/null || echo "npm: nao instalado"',
  'which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "chromium: nao instalado"',
  'pm2 --version 2>/dev/null || echo "pm2: nao instalado"',
  'ls /root/',
  'df -h / | tail -1',
  'free -m | head -2',
].join(' && echo "---" && ');

conn.on('ready', () => {
  console.log('✅ Conectado na VPS!\n');
  conn.exec(COMMANDS, (err, stream) => {
    if (err) { console.error('Erro exec:', err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('\n--- Conexão encerrada (code:', code, ') ---');
      conn.end();
    });
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
});

conn.on('error', (err) => {
  console.error('❌ Erro SSH:', err.message);
});

conn.connect({
  host: '62.238.19.20',
  port: 22,
  username: 'root',
  password: '2FPUYEZ&jn-+DjZ',
  readyTimeout: 15000,
  // Aceita qualquer host key (ambiente interno)
  hostVerifier: () => true,
});
