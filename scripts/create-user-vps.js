const { createClient } = require('@supabase/supabase-js');
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

const supabaseUrl = 'https://imprdimqcjbndqewioyt.supabase.co';
const supabaseServiceRole = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseServiceRole) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// Create supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const email = 'admin@sigmilitar.com.br';
  const password = 'AdminPassword123!';

  console.log(`Creating admin user: ${email} on ${supabaseUrl}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Admin Global',
      role: 'admin_global',
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('\n============================================');
  console.log('USER CREATED SUCCESSFULLY!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('============================================');
}

run();
