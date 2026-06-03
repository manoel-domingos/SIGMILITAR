const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
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

async function testDrive() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID || '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';

  console.log('--- DIAGNÓSTICO GOOGLE DRIVE ---');
  console.log('Service Account Email:', email);
  console.log('PrivateKey Configured:', key ? 'Sim (Tamanho: ' + key.length + ')' : 'Não');
  console.log('Target Folder ID:', folderId);

  if (!email || !key) {
    console.error('Erro: GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_PRIVATE_KEY não estão configurados no arquivo .env.local.');
    return;
  }

  key = key.replace(/\\n/g, '\n');
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({ version: 'v3', auth });

    console.log('\n1. Testando autenticação e listagem da pasta alvo...');
    try {
      const listRes = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id,name,mimeType)',
      });
      console.log('Sucesso na listagem! Arquivos encontrados:', listRes.data.files?.length || 0);
      if (listRes.data.files) {
        listRes.data.files.slice(0, 5).forEach(f => {
          console.log(` - [${f.mimeType}] ${f.name} (${f.id})`);
        });
      }
    } catch (listErr) {
      console.error('Erro ao listar pasta alvo:', listErr.message);
      if (listErr.response) {
        console.error('Detalhes do Erro do Google:', listErr.response.data);
      }
    }

    console.log('\n2. Testando permissão de escrita (Criar pasta de teste)...');
    try {
      const createRes = await drive.files.create({
        requestBody: {
          name: 'Pasta Diagnostico SIGMILITAR ' + new Date().toISOString(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folderId],
        },
        fields: 'id,name',
      });
      console.log('Sucesso ao criar pasta! ID:', createRes.data.id);
      
      // Deletar pasta de teste para não poluir
      console.log('Removendo pasta de teste criada...');
      await drive.files.delete({ fileId: createRes.data.id });
      console.log('Pasta de teste removida.');
    } catch (createErr) {
      console.error('Erro ao criar pasta no diretório alvo:', createErr.message);
      if (createErr.response) {
        console.error('Detalhes do Erro do Google:', createErr.response.data);
      }
    }

  } catch (authErr) {
    console.error('Erro geral de Autenticação:', authErr.message);
  }
}

testDrive();
