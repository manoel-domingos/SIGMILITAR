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

if (!coolifyToken) {
  console.error('Error: COOLIFY_TOKEN not found in .env.local');
  process.exit(1);
}

async function fetchCoolify(endpoint) {
  const url = `${coolifyUrl}${endpoint}`;
  console.log(`Fetching Coolify: ${url}`);
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
    console.error(`Error fetching ${endpoint}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('Inspecting Coolify deployments...');
  
  // 1. Get services
  const services = await fetchCoolify('/api/v1/services');
  if (!services) {
    console.log('Failed to fetch services. Trying servers/projects...');
    const projects = await fetchCoolify('/api/v1/projects');
    console.log('Projects:', JSON.stringify(projects, null, 2));
    return;
  }

  console.log(`Found ${services.length} services.`);
  for (const s of services) {
    console.log(`\nService: ${s.name} (UUID: ${s.uuid}, Status: ${s.status})`);
    
    // Get detailed service info if available
    const detail = await fetchCoolify(`/api/v1/services/${s.uuid}`);
    if (detail) {
      console.log('Fqdn / URL:', detail.fqdn || 'None');
      if (detail.connectors) {
        console.log('Connectors:', JSON.stringify(detail.connectors, null, 2));
      }
      if (detail.applications) {
        console.log('Applications in Service:');
        detail.applications.forEach(app => {
          console.log(` - Name: ${app.name}, FQDN: ${app.fqdn}, Status: ${app.status}, Public Port: ${app.public_port}`);
        });
      }
      if (detail.databases) {
        console.log('Databases in Service:');
        detail.databases.forEach(db => {
          console.log(` - Name: ${db.name}, FQDN: ${db.fqdn}, Status: ${db.status}, Public Port: ${db.public_port}`);
        });
      }
    }
  }
}

run();
