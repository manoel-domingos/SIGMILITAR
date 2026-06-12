const { Client } = require('ssh2');

const conn = new Client();

const CONFIG = {
  host: '62.238.19.20',
  port: 22,
  username: 'root',
  password: '2FPUYEZ&jn-+DjZ'
};

const PM2_PATH = '/root/.hermes/node/bin/pm2';

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando daemon com caminho absoluto do PM2...');

  // 1. Para/deleta anterior se houver
  conn.exec(`${PM2_PATH} delete suparchef-daemon 2>/dev/null; ${PM2_PATH} start /root/suparchef/suparchef-daemon.js --name suparchef-daemon`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`PM2 start finalizado com código: ${code}`);
      
      // 2. Salva estado
      conn.exec(`${PM2_PATH} save`, (err, stream2) => {
        if (err) throw err;
        stream2.on('close', (code2) => {
          console.log(`PM2 save finalizado com código: ${code2}`);
          console.log('\n🚀 DAEMON INICIADO COM SUCESSO VIA PM2 ABSOLUTO!');
          conn.end();
        });
        stream2.resume();
      });
    });
    stream.resume();
  });
}).connect(CONFIG);
