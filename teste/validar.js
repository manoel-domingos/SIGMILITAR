const path = require('path');
const fs = require('fs');

// Ler o arquivo .env.local manualmente por splitting
const envPath = path.resolve(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      // Remover aspas duplas/simples se existirem
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[match[1].trim()] = val;
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou chaves do Supabase não encontradas no .env.local');
  process.exit(1);
}

async function testQuery(tableName, selectQuery) {
  console.log(`\nTestando acesso à tabela: "${tableName}"...`);
  const url = `${supabaseUrl}/rest/v1/${tableName}?select=${selectQuery}&limit=2`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Sucesso! Tabela "${tableName}" existe.`);
    console.log(`Quantidade de registros obtidos (limite 2): ${data.length}`);
    if (data.length > 0) {
      console.log('Amostra de registro:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Nenhum registro encontrado (tabela vazia).');
    }
  } catch (error) {
    console.error(`❌ Erro ao acessar a tabela "${tableName}":`, error.message);
  }
}

async function run() {
  // Testar tabela students
  await testQuery('students', 'id,name,registration_number,contacts,archived');
  
  // Testar tabela ficai_importacoes
  await testQuery('ficai_importacoes', 'id,ano,cod_aluno,nome_aluno,turma,perc_faltas_geral,ficai_aberto,school_id');
}

run();
