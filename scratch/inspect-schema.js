const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = [
    'schools',
    'school_settings',
    'user_profiles',
    'tenant_email_whitelist',
    'students',
    'occurrences',
    'accidents',
    'praises',
    'rules',
    'summons',
    'conduct_terms',
    'audit_logs',
    'staff_members'
  ];

  console.log("=== INSPECTING COLUMNS FOR TABLES ===");
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table}: Error - ${error.message}`);
      } else {
        const columns = data.length > 0 ? Object.keys(data[0]) : ['(No rows to check columns)'];
        console.log(`Table ${table}: [${columns.join(', ')}]`);
      }
    } catch (err) {
      console.log(`Table ${table}: Exception - ${err.message}`);
    }
  }
}

main();
