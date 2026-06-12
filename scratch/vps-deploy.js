const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const PM2 = '/root/.hermes/node/bin/pm2';
const DAEMON_LOCAL = path.join(__dirname, '../scripts/suparchef-daemon.js');
const DAEMON_CODE = fs.readFileSync(DAEMON_LOCAL, 'utf8');

// Precisamos das env vars do .env.local
const envLocalPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

function parseEnv(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

const env = parseEnv(envContent);
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis Supabase não encontradas no .env.local');
  process.exit(1);
}

console.log('✅ Env vars encontradas:');
console.log('  SUPABASE_URL:', SUPABASE_URL);
console.log('  SUPABASE_KEY:', SUPABASE_KEY.slice(0, 20) + '...');

conn.on('ready', () => {
  console.log('\n✅ Conectado na VPS! Iniciando deploy...\n');

  // Passo 1: criar o diretório e package.json do suparchef
  const SETUP_CMD = `
mkdir -p /root/suparchef
cd /root/suparchef

# Criar package.json se não existir
if [ ! -f package.json ]; then
  echo '{"name":"suparchef-daemon","version":"1.0.0","main":"daemon.js"}' > package.json
fi

# Instalar dependência @supabase/supabase-js e playwright
npm install @supabase/supabase-js playwright --save 2>&1 | tail -3

# Verificar playwright chromium
node -e "const {chromium}=require('playwright'); console.log('Chromium OK:', chromium.executablePath())" 2>/dev/null || echo "Playwright: verificar instalação"

echo "=== Setup base OK ==="
`.trim();

  conn.exec(SETUP_CMD, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }

    let output = '';
    stream.on('data', (d) => { const s = d.toString(); output += s; process.stdout.write(s); });
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', () => {
      console.log('\n✅ Setup base concluído. Enviando daemon...\n');
      uploadDaemon();
    });
  });

  function uploadDaemon() {
    // Passo 2: criar daemon.js na VPS via SFTP
    conn.sftp((err, sftp) => {
      if (err) { console.error('SFTP erro:', err); conn.end(); return; }

      const remoteFile = '/root/suparchef/daemon.js';
      const writeStream = sftp.createWriteStream(remoteFile);

      writeStream.on('close', () => {
        console.log('✅ daemon.js enviado para', remoteFile);
        createEnvAndStart();
      });

      writeStream.on('error', (e) => console.error('Erro SFTP write:', e));
      writeStream.write(DAEMON_CODE);
      writeStream.end();
    });
  }

  function createEnvAndStart() {
    // Passo 3: criar .env e iniciar com PM2
    const envFileContent = `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}\nSUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}\n`;

    conn.sftp((err, sftp) => {
      if (err) { console.error('SFTP erro:', err); conn.end(); return; }

      const envStream = sftp.createWriteStream('/root/suparchef/.env');
      envStream.on('close', () => {
        console.log('✅ .env criado com credenciais Supabase');
        startDaemon();
      });
      envStream.write(envFileContent);
      envStream.end();
    });
  }

  function startDaemon() {
    // Passo 4: criar script de inicialização e iniciar PM2
    const START_CMD = `
cd /root/suparchef

# Parar instância anterior se existir
${PM2} delete suparchef 2>/dev/null || true

# Criar wrapper que carrega o .env antes de iniciar
cat > start.sh << 'STARTEOF'
#!/bin/bash
set -a
source /root/suparchef/.env
set +a
exec node /root/suparchef/daemon.js
STARTEOF
chmod +x start.sh

# Iniciar com PM2
${PM2} start /root/suparchef/start.sh --name suparchef --interpreter bash

# Salvar configuração PM2 para sobreviver a reinicializações
${PM2} save
${PM2} startup systemd 2>/dev/null | tail -2 || true

echo ""
echo "=== STATUS PM2 ==="
${PM2} list
echo ""
echo "=== LOGS (últimas 10 linhas) ==="
${PM2} logs suparchef --lines 10 --nostream 2>/dev/null || echo "aguardando logs..."
echo ""
echo "=== DEPLOY CONCLUÍDO ✅ ==="
`.trim();

    conn.exec(START_CMD, (err, stream) => {
      if (err) { console.error(err); conn.end(); return; }
      stream.on('data', (d) => process.stdout.write(d.toString()));
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      stream.on('close', (code) => {
        console.log('\n--- Finalizado (code:', code, ') ---');
        conn.end();
      });
    });
  }
});

conn.on('error', (err) => console.error('❌ Erro SSH:', err.message));
conn.connect({
  host: '62.238.19.20', port: 22, username: 'root',
  password: '2FPUYEZ&jn-+DjZ', readyTimeout: 15000,
  hostVerifier: () => true,
});
