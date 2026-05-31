const fs = require('fs');
const path = require('path');

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

const coolifyUrl = env['COOLIFY_URL'] || 'http://62.238.19.20:8000';
const coolifyToken = env['COOLIFY_TOKEN'];

async function fetchCoolify(endpoint) {
  const url = `${coolifyUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${coolifyToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function run() {
  const serviceUuid = 'ytn81mku9i224nx9mqqvud1v'; // Supabase service UUID
  const data = await fetchCoolify(`/api/v1/services/${serviceUuid}/envs`);
  if (!data) return;

  console.log('--- ALL COOLIFY SERVICE ENVIRONMENT VARIABLES ---');
  data.forEach(e => {
    console.log(`${e.key}=${e.value}`);
  });
}

run();
