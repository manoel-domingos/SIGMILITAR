const { Client } = require('ssh2');

const conn = new Client();

const CONFIG = {
  host: '62.238.19.20',
  port: 22,
  username: 'root',
  password: '2FPUYEZ&jn-+DjZ'
};

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando configuração do PM2 na VPS...');

  // 1. Instala PM2 globalmente
  console.log('Instalando PM2 globalmente (npm install -g pm2)...');
  conn.exec('npm install -g pm2', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`npm install -g pm2 finalizado com código: ${code}`);
      
      // 2. Para qualquer processo anterior com o mesmo nome e inicia o daemon
      console.log('Iniciando daemon do Suparchef via PM2...');
      conn.exec('pm2 delete suparchef-daemon 2>/dev/null; pm2 start /root/suparchef/suparchef-daemon.js --name suparchef-daemon', (err, stream2) => {
        if (err) throw err;
        stream2.on('close', (code2) => {
          console.log(`pm2 start finalizado com código: ${code2}`);
          
          // 3. Salva a lista de processos para persistir no reinício
          console.log('Salvando estado do PM2...');
          conn.exec('pm2 save', (err, stream3) => {
            if (err) throw err;
            stream3.on('close', (code3) => {
              console.log(`pm2 save finalizado com código: ${code3}`);
              console.log('\n🚀 DAEMON INICIADO E CONFIGURADO NO PM2 COM SUCESSO!');
              console.log('O daemon está escutando o Supabase em segundo plano.');
              console.log('Para checar os logs na VPS run: pm2 logs suparchef-daemon');
              conn.end();
            });
            stream3.resume();
          });
        });
        stream2.resume();
      });
    });
    stream.resume();
  });
}).connect(CONFIG);
