const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Configuration
const CANNY_API_KEY = "dbaba358-a925-2c7b-1f48-0abb577688dd";
const CANNY_BOARD_ID = "6a1b2105dad3883c255b666c";
const CANNY_AUTHOR_ID = "6a1b1c9c86d7b8843b6d467f"; // Gestor user

const counterFile = path.join(__dirname, '..', '.canny-counter.json');

function makeRequest(apiPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'canny.io',
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });
    req.on('error', error => reject(error));
    req.write(data);
    req.end();
  });
}

function translateCommit(msg) {
  if (!msg) return '';
  
  // 1. Map prefixes
  let translated = msg;
  const prefixes = [
    { regex: /^feat(ure)?:\s*/i, repl: 'Nova Funcionalidade: ' },
    { regex: /^fix:\s*/i, repl: 'Correção: ' },
    { regex: /^chore:\s*/i, repl: 'Ajuste: ' },
    { regex: /^docs:\s*/i, repl: 'Documentação: ' },
    { regex: /^refactor:\s*/i, repl: 'Refatoração: ' },
    { regex: /^style:\s*/i, repl: 'Estilo Visual: ' },
    { regex: /^test:\s*/i, repl: 'Testes: ' }
  ];
  
  for (const p of prefixes) {
    if (p.regex.test(translated)) {
      translated = translated.replace(p.regex, p.repl);
      break;
    }
  }
  
  // 2. Map verbs and common terms case-insensitively
  const dictionary = [
    { from: /\bimplement\b/gi, to: 'implementar' },
    { from: /\bimplemented\b/gi, to: 'implementado' },
    { from: /\badd\b/gi, to: 'adicionar' },
    { from: /\badded\b/gi, to: 'adicionado' },
    { from: /\bcreate\b/gi, to: 'criar' },
    { from: /\bcreated\b/gi, to: 'criado' },
    { from: /\bfix\b/gi, to: 'corrigir' },
    { from: /\bfixed\b/gi, to: 'corrigido' },
    { from: /\bremove\b/gi, to: 'remover' },
    { from: /\bremoved\b/gi, to: 'removido' },
    { from: /\bupdate\b/gi, to: 'atualizar' },
    { from: /\bupdated\b/gi, to: 'atualizado' },
    { from: /\badjust\b/gi, to: 'ajustar' },
    { from: /\badjusted\b/gi, to: 'ajustado' },
    { from: /\bdelete\b/gi, to: 'excluir' },
    { from: /\bdeleted\b/gi, to: 'excluído' },
    { from: /\bclean\b/gi, to: 'limpar' },
    { from: /\bcleaned\b/gi, to: 'limpo' },
    { from: /\brefactor\b/gi, to: 'refatorar' },
    { from: /\brefactored\b/gi, to: 'refatorado' },
    { from: /\bchange\b/gi, to: 'alterar' },
    { from: /\bchanged\b/gi, to: 'alterado' },
    { from: /\bcomponent\b/gi, to: 'componente' },
    { from: /\bcomponents\b/gi, to: 'componentes' },
    { from: /\bpage\b/gi, to: 'página' },
    { from: /\bpages\b/gi, to: 'páginas' },
    { from: /\bintegration\b/gi, to: 'integração' },
    { from: /\bdisciplinary record\b/gi, to: 'registro disciplinar' },
    { from: /\bdisciplinary records\b/gi, to: 'registros disciplinares' },
    { from: /\boccurrence\b/gi, to: 'ocorrência' },
    { from: /\boccurrences\b/gi, to: 'ocorrências' },
    { from: /\btable\b/gi, to: 'tabela' },
    { from: /\bdashboard\b/gi, to: 'painel' },
    { from: /\bsimulator\b/gi, to: 'simulador' },
    { from: /\brole\b/gi, to: 'função' },
    { from: /\buser\b/gi, to: 'usuário' },
    { from: /\busers\b/gi, to: 'usuários' },
    { from: /\bschool\b/gi, to: 'escola' },
    { from: /\bschools\b/gi, to: 'escolas' },
    { from: /\btracking\b/gi, to: 'rastreamento' },
    { from: /\bdatabase\b/gi, to: 'banco de dados' },
    { from: /\bbuild\b/gi, to: 'compilação' },
    { from: /\bwith\b/gi, to: 'com' },
    { from: /\band\b/gi, to: 'e' },
    { from: /\bto\b/gi, to: 'para' },
    { from: /\bfrom\b/gi, to: 'de' }
  ];
  
  for (const item of dictionary) {
    translated = translated.replace(item.from, item.to);
  }
  
  return translated;
}

function getCommitLogs() {
  try {
    const output = execSync('git log -n 3 --pretty=format:"%s (%h)"').toString().trim();
    return output.split('\n').filter(Boolean);
  } catch (err) {
    console.error('Erro ao ler logs do git:', err.message);
    return ['Ajustes e melhorias no sistema'];
  }
}

async function main() {
  // Load counter
  let counterData = { count: 0 };
  if (fs.existsSync(counterFile)) {
    try {
      counterData = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
    } catch (e) {
      // fallback
    }
  }

  // Increment counter
  counterData.count += 1;
  console.log(`[Canny Push Tracker] Push ${counterData.count}/3 detectado.`);

  if (counterData.count >= 3) {
    console.log('[Canny Push Tracker] Criando tarefa no Canny...');
    const commits = getCommitLogs();
    
    // Use the latest commit as the title
    const latestCommitMsg = commits[0] ? commits[0].replace(/\s*\([a-f0-9]+\)$/, '') : 'Melhorias no sistema';
    const translatedLatest = translateCommit(latestCommitMsg);
    
    // Capitalize first letter
    const title = translatedLatest.charAt(0).toUpperCase() + translatedLatest.slice(1);
    
    // Details summary of last 3 commits
    const details = `Atualizações implementadas recentemente nas últimas 3 ações:

${commits.map(c => `• ${translateCommit(c)}`).join('\n')}`;

    try {
      // 1. Create Post
      const createRes = await makeRequest('/api/v1/posts/create', {
        apiKey: CANNY_API_KEY,
        boardID: CANNY_BOARD_ID,
        authorID: CANNY_AUTHOR_ID,
        title: title,
        details: details
      });

      if (createRes.statusCode !== 200) {
        throw new Error(`Falha ao criar post (Status: ${createRes.statusCode}): ${createRes.body}`);
      }

      const post = JSON.parse(createRes.body);
      console.log(`[Canny] Post criado com sucesso! ID: ${post.id}`);

      // 2. Change Status to Complete
      const statusRes = await makeRequest('/api/v1/posts/change_status', {
        apiKey: CANNY_API_KEY,
        postID: post.id,
        status: 'complete',
        changerID: CANNY_AUTHOR_ID,
        shouldNotifyVoters: false
      });

      if (statusRes.statusCode !== 200) {
        throw new Error(`Falha ao alterar status (Status: ${statusRes.statusCode}): ${statusRes.body}`);
      }

      console.log('[Canny] Post marcado como completo com sucesso!');
      
      // Reset counter
      counterData.count = 0;
    } catch (err) {
      console.error('[Canny Error]', err.message);
    }
  }

  // Save counter back
  fs.writeFileSync(counterFile, JSON.stringify(counterData, null, 2), 'utf8');
}

main();
