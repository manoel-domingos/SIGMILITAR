const net = require('net');

const host = 'bd.sigmilitar.com.br';
const ports = [22, 80, 443, 7880, 7881, 8000, 8443];

console.log(`Scanning ports on ${host}...`);

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      const duration = Date.now() - startTime;
      socket.destroy();
      resolve({ port, status: 'OPEN', duration });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, status: 'TIMEOUT (Blocked by Firewall)', reason: 'timeout' });
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      if (err.code === 'ECONNREFUSED') {
        resolve({ port, status: 'REFUSED (Port Closed / Service Stopped)', reason: 'refused' });
      } else {
        resolve({ port, status: `ERROR (${err.code})`, reason: err.code });
      }
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  const results = [];
  for (const port of ports) {
    const res = await checkPort(port);
    results.push(res);
  }
  
  console.log('\n============================================');
  console.log('VPS PORT SCAN RESULTS:');
  console.log('============================================');
  results.forEach(r => {
    console.log(`Port ${r.port}: ${r.status}${r.duration ? ` (${r.duration}ms)` : ''}`);
  });
  console.log('============================================');
}

run();
