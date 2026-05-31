const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
}

const host = 'bd.sigmilitar.com.br';
const password = env['SERVICE_PASSWORD_POSTGRES'] || 'IkMF3EoXEKtrkL9zvnuov5Vn4gbbCSRt';

console.log('Testing connection to PG on:', host);
console.log('Password length:', password.length);

async function testConnection(port) {
  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${host}:${port}/postgres`;
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log(`Trying port ${port}...`);
    await client.connect();
    console.log(`SUCCESS connected to ${host}:${port}!`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    return true;
  } catch (err) {
    console.error(`FAILED port ${port}:`, err.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function run() {
  // Test ports 5432, 6543 (supavisor), 8443, 7881 (user custom database port)
  const ports = [5432, 6543, 8443, 7881];
  for (const port of ports) {
    const ok = await testConnection(port);
    if (ok) {
      console.log('\nConnection verification successful!');
      return;
    }
  }
  console.log('\nVerification failed for all listed ports.');
}

run();
