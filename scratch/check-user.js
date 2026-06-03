const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('Buscando perfis correspondentes a "joao.peres"...');
  
  // 1. Buscar todos os registros que contêm joao.peres
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('email', '%joao.peres%');
    
  if (error) {
    console.error('Erro ao buscar perfis:', error.message);
    return;
  }
  
  console.log('Resultados encontrados:', data.length);
  data.forEach(profile => {
    console.log(JSON.stringify(profile, null, 2));
  });
}

checkUser();
