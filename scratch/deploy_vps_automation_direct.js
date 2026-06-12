const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const CONFIG = {
  host: '62.238.19.20',
  port: 22,
  username: 'root',
  password: '2FPUYEZ&jn-+DjZ'
};

const REMOTE_DIR = '/root/suparchef';

// Carrega arquivos locais e converte para base64
const suparchefBotBase64 = fs.readFileSync('scripts/suparchef-bot.js').toString('base64');
const suparchefDaemonBase64 = fs.readFileSync('scripts/suparchef-daemon.js').toString('base64');
const envLocalBase64 = fs.readFileSync('.env.local').toString('base64');

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando deploy via Base64 com Resume...');

  // 1. Cria o diretório
  executeCommand(`mkdir -p ${REMOTE_DIR} ${REMOTE_DIR}/sessions`, () => {
    // 2. Escreve suparchef-bot.js
    console.log('Escrevendo suparchef-bot.js...');
    writeBase64File(`${REMOTE_DIR}/suparchef-bot.js`, suparchefBotBase64, () => {
      // 3. Escreve suparchef-daemon.js
      console.log('Escrevendo suparchef-daemon.js...');
      writeBase64File(`${REMOTE_DIR}/suparchef-daemon.js`, suparchefDaemonBase64, () => {
        // 4. Escreve .env.local
        console.log('Escrevendo .env.local...');
        writeBase64File(`${REMOTE_DIR}/.env.local`, envLocalBase64, () => {
          // 5. Cria package.json
          console.log('Escrevendo package.json...');
          const packageJsonContent = JSON.stringify({
            name: "suparchef-vps-runner",
            version: "1.0.0",
            description: "Runner para automação de votos no VPS",
            main: "suparchef-daemon.js",
            dependencies: {
              "@supabase/supabase-js": "^2.104.0",
              "dotenv": "^16.4.5",
              "playwright": "^1.60.0"
            }
          }, null, 2);
          const packageJsonBase64 = Buffer.from(packageJsonContent).toString('base64');
          writeBase64File(`${REMOTE_DIR}/package.json`, packageJsonBase64, () => {
            // 6. Instala dependências
            console.log('Instalando dependências via npm (npm install)...');
            executeCommand(`cd ${REMOTE_DIR} && npm install`, () => {
              // 7. Instala Chromium no Playwright
              console.log('Instalando Chromium (npx playwright install chromium)...');
              executeCommand(`cd ${REMOTE_DIR} && npx playwright install chromium`, () => {
                // 8. Instala dependências de sistema do Chromium (playwright install-deps)
                console.log('Instalando dependências de sistema (npx playwright install-deps)...');
                executeCommand(`cd ${REMOTE_DIR} && npx playwright install-deps`, () => {
                  console.log('\n🚀 DEPLOY COMPLETO COM SUCESSO!');
                  console.log(`Arquivos prontos em ${REMOTE_DIR}`);
                  console.log('\nPara testar a autenticação de contas, execute na VPS:');
                  console.log(`  node ${REMOTE_DIR}/suparchef-bot.js --auth email@gmail.com`);
                  console.log('\nPara iniciar o daemon rodando continuamente na VPS:');
                  console.log(`  node ${REMOTE_DIR}/suparchef-daemon.js`);
                  conn.end();
                });
              });
            });
          });
        });
      });
    });
  });
}).connect(CONFIG);

// Helper para executar comandos simples e aguardar término
function executeCommand(cmd, callback) {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(`Erro ao executar: ${cmd}`, err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      if (code !== 0) {
        console.warn(`Aviso: Comando [${cmd}] terminou com código ${code}`);
      }
      callback();
    })
    .on('data', (data) => process.stdout.write(data.toString()))
    .stderr.on('data', (data) => process.stderr.write(data.toString()));
  });
}

// Helper para escrever arquivos remotos decodificando base64
function writeBase64File(filePath, base64Content, callback) {
  conn.exec(`echo "${base64Content}" | base64 -d > ${filePath}`, (err, stream) => {
    if (err) {
      console.error(`Erro ao executar decodificação base64 para ${filePath}:`, err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      if (code !== 0) {
        console.error(`Falha ao decodificar base64 para ${filePath}, código: ${code}`);
        conn.end();
        return;
      }
      callback();
    });
    
    // Força o fluxo do stream para que os eventos close/end sejam disparados
    stream.resume();
  });
}
