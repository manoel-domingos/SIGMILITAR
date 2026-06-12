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

// Arquivos locais para enviar
const filesToUpload = [
  { local: 'scripts/suparchef-bot.js', remote: `${REMOTE_DIR}/suparchef-bot.js` },
  { local: 'scripts/suparchef-daemon.js', remote: `${REMOTE_DIR}/suparchef-daemon.js` },
  { local: '.env.local', remote: `${REMOTE_DIR}/.env.local` }
];

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando deploy na VPS...');

  // 1. Cria diretório remoto
  conn.exec(`mkdir -p ${REMOTE_DIR} ${REMOTE_DIR}/sessions`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log(`Diretório remoto ${REMOTE_DIR} pronto.`);
      
      // 2. Abre SFTP e faz upload dos arquivos
      conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploadedCount = 0;
        
        function uploadNext() {
          if (uploadedCount === filesToUpload.length) {
            console.log('Todos os arquivos enviados via SFTP.');
            createPackageJson();
            return;
          }
          
          const file = filesToUpload[uploadedCount];
          console.log(`Subindo: ${file.local} -> ${file.remote}`);
          
          sftp.fastPut(file.local, file.remote, (err) => {
            if (err) {
              console.error(`Erro ao subir ${file.local}:`, err);
              conn.end();
              return;
            }
            uploadedCount++;
            uploadNext();
          });
        }
        
        uploadNext();
      });
    });
  });

  // 3. Cria package.json no VPS
  function createPackageJson() {
    console.log('Criando package.json remoto...');
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

    conn.exec(`cat << 'EOF' > ${REMOTE_DIR}/package.json\n${packageJsonContent}\nEOF`, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        console.log('package.json criado na VPS.');
        installDependencies();
      });
    });
  }

  // 4. Instala dependências
  function installDependencies() {
    console.log('Instalando dependências via npm na VPS (pode levar 1-2 minutos)...');
    conn.exec(`cd ${REMOTE_DIR} && npm install`, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        console.log(`npm install finalizado com código: ${code}`);
        if (code !== 0) {
          conn.end();
          return;
        }
        installPlaywright();
      })
      .on('data', (data) => process.stdout.write('[npm] ' + data.toString()))
      .stderr.on('data', (data) => process.stderr.write('[npm-err] ' + data.toString()));
    });
  }

  // 5. Instala navegadores do Playwright
  function installPlaywright() {
    console.log('Instalando navegadores do Playwright na VPS...');
    conn.exec(`cd ${REMOTE_DIR} && npx playwright install chromium`, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        console.log(`playwright chromium install finalizado com código: ${code}`);
        installSystemDeps();
      })
      .on('data', (data) => process.stdout.write('[playwright] ' + data.toString()))
      .stderr.on('data', (data) => process.stderr.write('[playwright-err] ' + data.toString()));
    });
  }

  // 6. Instala dependências do sistema operacional para o Chromium rodar headless em Ubuntu
  function installSystemDeps() {
    console.log('Instalando dependências de sistema do Chromium (npx playwright install-deps)...');
    conn.exec(`cd ${REMOTE_DIR} && npx playwright install-deps`, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        console.log(`playwright install-deps finalizado com código: ${code}`);
        console.log('\n🚀 DEPLOY COMPLETO COM SUCESSO!');
        console.log(`Os arquivos estão prontos em ${REMOTE_DIR}`);
        console.log('Para testar a autenticação de contas, execute na VPS:');
        console.log(`  node ${REMOTE_DIR}/suparchef-bot.js --auth email@gmail.com`);
        console.log('\nPara iniciar o daemon rodando continuamente na VPS:');
        console.log(`  node ${REMOTE_DIR}/suparchef-daemon.js`);
        conn.end();
      })
      .on('data', (data) => process.stdout.write('[deps] ' + data.toString()))
      .stderr.on('data', (data) => process.stderr.write('[deps-err] ' + data.toString()));
    });
  }

}).connect(CONFIG);
