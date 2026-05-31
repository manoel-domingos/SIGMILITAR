const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CANNY_API_KEY = "dbaba358-a925-2c7b-1f48-0abb577688dd";
const CANNY_BOARD_ID = "6a1b2105dad3883c255b666c";
const CANNY_AUTHOR_ID = "6a1b1c9c86d7b8843b6d467f"; // Gestor user

const pendingFile = path.join(__dirname, '..', '.canny-pending-posts.json');

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

async function main() {
  let pendingPosts = [];
  
  if (fs.existsSync(pendingFile)) {
    try {
      pendingPosts = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
      if (!Array.isArray(pendingPosts)) {
        pendingPosts = [];
      }
    } catch (e) {
      pendingPosts = [];
    }
  }

  console.log(`[Canny Push Tracker] ${pendingPosts.length}/3 pendências documentadas localmente.`);

  if (pendingPosts.length >= 3) {
    console.log('[Canny Push Tracker] Enviando postagens para o Canny...');
    
    // Obter as 3 primeiras postagens da fila
    const toPost = pendingPosts.slice(0, 3);
    const remaining = pendingPosts.slice(3);

    for (const post of toPost) {
      try {
        console.log(`[Canny] Criando postagem: "${post.title}"`);
        
        // 1. Criar Post
        const createRes = await makeRequest('/api/v1/posts/create', {
          apiKey: CANNY_API_KEY,
          boardID: CANNY_BOARD_ID,
          authorID: CANNY_AUTHOR_ID,
          title: post.title,
          details: post.details
        });

        if (createRes.statusCode !== 200) {
          throw new Error(`Falha ao criar post (Status: ${createRes.statusCode}): ${createRes.body}`);
        }

        const createdPost = JSON.parse(createRes.body);
        console.log(`[Canny] Post criado com sucesso! ID: ${createdPost.id}`);

        // 2. Mudar Status para Completo
        const statusRes = await makeRequest('/api/v1/posts/change_status', {
          apiKey: CANNY_API_KEY,
          postID: createdPost.id,
          status: 'complete',
          changerID: CANNY_AUTHOR_ID,
          shouldNotifyVoters: false
        });

        if (statusRes.statusCode !== 200) {
          throw new Error(`Falha ao alterar status (Status: ${statusRes.statusCode}): ${statusRes.body}`);
        }

        console.log('[Canny] Post marcado como completo com sucesso!');
      } catch (err) {
        console.error('[Canny Error]', err.message);
        // Em caso de erro, re-adiciona na fila para não perder o post
        remaining.unshift(post);
      }
    }

    // Salvar o estado atualizado
    fs.writeFileSync(pendingFile, JSON.stringify(remaining, null, 2), 'utf8');
    console.log(`[Canny] Envio concluído. Fila restante: ${remaining.length} posts.`);
  } else {
    console.log('[Canny Push Tracker] Fila menor que 3. Aguardando mais modificações.');
  }
}

main();
