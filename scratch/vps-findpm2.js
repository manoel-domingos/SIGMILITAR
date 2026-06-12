const { Client } = require('ssh2');

const conn = new Client();

const CMD = `
echo "npm prefix global:"; npm config get prefix
echo "npm bin global:"; npm bin -g 2>/dev/null || npm root -g
echo "where pm2:"; find / -name "pm2" -type f 2>/dev/null | head -5
echo "where node:"; which node
echo "node version:"; node --version
echo "env PATH:"; echo $PATH
echo "ls /usr/local/bin:"; ls /usr/local/bin/ | grep -E "pm2|node|npm|playwright"
`.trim();

conn.on('ready', () => {
  console.log('✅ Conectado!\n');
  conn.exec(CMD, (err, stream) => {
    if (err) { console.error('Erro:', err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('\n--- done (code:', code, ') ---');
      conn.end();
    });
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
});

conn.on('error', (err) => console.error('❌', err.message));
conn.connect({
  host: '62.238.19.20', port: 22, username: 'root',
  password: '2FPUYEZ&jn-+DjZ', readyTimeout: 15000,
  hostVerifier: () => true,
});
