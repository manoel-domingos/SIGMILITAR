const { Client } = require('ssh2');
const conn = new Client();
const PM2 = '/root/.hermes/node/bin/pm2';

const CMD = `
${PM2} delete suparchef-daemon 2>/dev/null || true
${PM2} list
echo "=== Logs ao vivo (15s) ==="
${PM2} logs suparchef --lines 20 --nostream 2>/dev/null
`.trim();

conn.on('ready', () => {
  conn.exec(CMD, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});
conn.on('error', (err) => console.error('❌', err.message));
conn.connect({
  host: '62.238.19.20', port: 22, username: 'root',
  password: '2FPUYEZ&jn-+DjZ', readyTimeout: 10000,
  hostVerifier: () => true,
});
