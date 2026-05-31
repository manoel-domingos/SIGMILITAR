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
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }
    return await response.json();
  } catch (err) {
    // Suppress logs for probing
    return null;
  }
}

async function run() {
  const serviceUuid = 'ytn81mku9i224nx9mqqvud1v'; // Supabase service UUID
  
  // Try different endpoints to get container logs or logs from Coolify API
  const endpoints = [
    `/api/v1/services/${serviceUuid}/logs`,
    `/api/v1/services/${serviceUuid}/containers`,
    `/api/v1/services/${serviceUuid}/envs`
  ];
  
  for (const ep of endpoints) {
    console.log(`\nProbing endpoint: ${ep}...`);
    const data = await fetchCoolify(ep);
    if (data) {
      console.log(`SUCCESS:`, JSON.stringify(data, null, 2).slice(0, 1000));
    } else {
      console.log(`FAILED / NOT FOUND`);
    }
  }
}

run();
