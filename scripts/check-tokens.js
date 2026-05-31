const fs = require('fs');
const path = require('path');

// Caminho base do AppData do Gemini Antigravity
const BRAIN_DIR = 'C:\\Users\\Manoel\\.gemini\\antigravity-ide\\brain';

function checkTokens() {
  console.log('\n=== ANTIGRAVITY TOKEN ESTIMATOR ===\n');

  if (!fs.existsSync(BRAIN_DIR)) {
    console.error(`Diretório Brain não encontrado em: ${BRAIN_DIR}`);
    return;
  }

  // 1. Encontrar a conversa ativa/recente (isolando pastas UUID da conversa)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const conversations = fs.readdirSync(BRAIN_DIR)
    .map(name => {
      const fullPath = path.join(BRAIN_DIR, name);
      const stat = fs.statSync(fullPath);
      return { name, path: fullPath, isDirectory: stat.isDirectory(), mtime: stat.mtime };
    })
    .filter(item => item.isDirectory && uuidRegex.test(item.name))
    .sort((a, b) => b.mtime - a.mtime);

  if (conversations.length === 0) {
    console.log('Nenhuma sessão de conversa encontrada.');
    return;
  }

  // A mais recente é a ativa
  const activeConversation = conversations[0];
  console.log(`Conversa Detectada: ${activeConversation.name}`);
  console.log(`Última Atividade: ${activeConversation.mtime.toLocaleString('pt-BR')}`);

  const logFile = path.join(activeConversation.path, '.system_generated', 'logs', 'transcript.jsonl');

  if (!fs.existsSync(logFile)) {
    console.error(`Arquivo de histórico de log não encontrado em: ${logFile}`);
    return;
  }

  // 2. Ler e processar o arquivo transcript.jsonl
  const fileContent = fs.readFileSync(logFile, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  let totalChars = 0;
  let userChars = 0;
  let modelChars = 0;
  let toolChars = 0;
  let stepCount = 0;

  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      stepCount++;

      // Analisa o source do conteúdo
      const source = step.source || '';
      const type = step.type || '';
      const content = step.content || '';
      const toolCalls = step.tool_calls || [];
      const toolOutput = step.output || '';

      const contentLen = content.length;
      totalChars += contentLen;

      if (source === 'USER_EXPLICIT' || source === 'USER' || type === 'USER_INPUT') {
        userChars += contentLen;
      } else if (source === 'MODEL' || type === 'PLANNER_RESPONSE') {
        modelChars += contentLen;
      } else {
        toolChars += contentLen;
      }

      // Conta chamadas de ferramentas
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        const toolCallsStr = JSON.stringify(toolCalls);
        toolChars += toolCallsStr.length;
        totalChars += toolCallsStr.length;
      }

      // Conta outputs de ferramentas
      if (toolOutput) {
        const outputStr = typeof toolOutput === 'object' ? JSON.stringify(toolOutput) : String(toolOutput);
        toolChars += outputStr.length;
        totalChars += outputStr.length;
      }
    } catch (e) {
      // Ignorar erros de parse se houver linha corrompida
    }
  }

  // 3. Estimativa de Tokens
  // Fatores de conversão empíricos para o tokenizer do Gemini Pro/Flash
  // Textos em Português / Código mesclado: ~3.5 caracteres por token
  const CHARS_PER_TOKEN = 3.6;
  const estimatedTokens = Math.round(totalChars / CHARS_PER_TOKEN);
  
  // Limites oficiais do Gemini
  const CONTEXT_LIMIT = 1000000; // 1 milhão de tokens
  const contextPercentage = ((estimatedTokens / CONTEXT_LIMIT) * 100).toFixed(2);

  console.log('\n--- Estatísticas de Volumetria ---');
  console.log(`Total de Passos (Steps): ${stepCount}`);
  console.log(`Caracteres do Usuário:  ${userChars.toLocaleString('pt-BR')}`);
  console.log(`Caracteres do Modelo:   ${modelChars.toLocaleString('pt-BR')}`);
  console.log(`Caracteres de Tools:    ${toolChars.toLocaleString('pt-BR')}`);
  console.log(`Total de Caracteres:    ${totalChars.toLocaleString('pt-BR')}`);

  console.log('\n--- Estimativa de Tokens ---');
  console.log(`Tokens Consumidos:      ${estimatedTokens.toLocaleString('pt-BR')} tokens`);
  console.log(`Janela de Contexto:     ${CONTEXT_LIMIT.toLocaleString('pt-BR')} tokens (Gemini 1.5)`);
  console.log(`Uso do Contexto:        ${contextPercentage}%`);

  console.log('\n-----------------------------------');
  console.log('Dica: Conversas longas ocupam mais memória de contexto. Se o tempo de resposta aumentar, considere iniciar uma nova conversa.');
  console.log('-----------------------------------\n');
}

checkTokens();
