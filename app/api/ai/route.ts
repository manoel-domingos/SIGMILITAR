import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { REGIMENTO_CORPUS, HIERARQUIA_FONTES } from '@/lib/regimento';

export const maxDuration = 60;

// Lazy initialization para evitar erro quando env var não está disponível no build
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
      baseURL: 'https://api.deepseek.com/v1',
    });
  }
  return _client;
}

// max_tokens removido intencionalmente — DeepSeek usa seu limite padrão (4096+)
// Restrição de input é feita no prompt; nunca limitar a saída gerada.
const CONFIGS: Record<string, { temperature: number }> = {
  ata:       { temperature: 0.4 },
  analise:   { temperature: 0.5 },
  relatorio: { temperature: 0.4 },
  chat:      { temperature: 0.5 },
  sugestao:  { temperature: 0.3 },
};

function buildPrompts(type: string, payload: Record<string, any>): { system: string; user: string } {
  switch (type) {
    case 'ata':
      return {
        system: [
          'Você é um gestor escolar da E.E. Cívico-Militar Prof. João Batista.',
          'Redija atas disciplinares formais, objetivas e em linguagem institucional.',
          'Retorne APENAS o texto da ata, sem comentários adicionais.',
          '',
          REGIMENTO_CORPUS,
          '',
          HIERARQUIA_FONTES,
        ].join('\n'),
        user: 'Formalize para ata:\nAluno(s): ' + payload.students + '\nInfra\u00e7\u00e3o: ' + payload.infractions + '\nData/Hora: ' + payload.dateTime + ' | Local: ' + payload.location + '\nRelato: ' + (payload.text || 'Crie modelo padr\u00e3o baseado na infra\u00e7\u00e3o.'),
      };

    case 'sugestao':
      return {
        system: [
          'Você é um especialista em gestão disciplinar escolar da E.E. Cívico-Militar Prof. João Batista.',
          'Sua função é gerar recomendações de medidas e próximos passos após o registro de uma ATA disciplinar.',
          '',
          '=== FONTE PRIMÁRIA OBRIGATÓRIA ===',
          REGIMENTO_CORPUS,
          '',
          HIERARQUIA_FONTES,
          '',
          'FORMATO DA RESPOSTA:',
          '1. Medida Recomendada: [nome da medida] (Art. XX do Regimento)',
          '2. Justificativa: [1–2 frases baseadas no regimento]',
          '3. Próximos Passos: [lista numerada de 3–5 ações concretas]',
          '4. Intervenção Pedagógica: [1 sugestão prática]',
          '5. Alerta (se aplicável): [risco de escalada ou necessidade de encaminhamento externo]',
          '',
          'Seja conciso, cite artigos do regimento e use linguagem formal institucional.',
        ].join('\n'),
        user: [
          'Aluno(s): ' + payload.students,
          'Infra\u00e7\u00e3o registrada: ' + payload.infractions + ' (Natureza: ' + (payload.severity ?? 'n\u00e3o informada') + ')',
          'Medida atribu\u00edda: ' + (payload.measure ?? 'n\u00e3o informada'),
          'Reincidente: ' + (payload.isReincidente ? 'Sim' : 'N\u00e3o'),
          'Hist\u00f3rico: ' + (payload.totalOccurrences ?? 0) + ' ocorr\u00eancia(s) anteriores',
          'Pontua\u00e7\u00e3o atual: ' + (payload.currentPoints ?? 'n\u00e3o informada'),
          'Observa\u00e7\u00f5es da ATA: ' + (payload.ataText ?? 'n\u00e3o fornecido'),
          '',
          'Gere as recomendações pós-ATA conforme o Regimento Interno.',
        ].join('\n'),
      };

    case 'analise':
      return {
        system: [
          'Você é um psicopedagogo escolar da E.E. Cívico-Militar Prof. João Batista.',
          'Analise o histórico disciplinar de forma construtiva e profissional.',
          '',
          REGIMENTO_CORPUS,
          '',
          HIERARQUIA_FONTES,
        ].join('\n'),
        user: 'Aluno: ' + payload.studentName + ' | Turma: ' + payload.class + '\nOcorr\u00eancias: ' + payload.totalOccurrences + ' | Pontos: ' + payload.currentPoints + '\nDetalhes: ' + payload.occurrences + '\nForne\u00e7a: padr\u00e3o de comportamento, causas prov\u00e1veis e 3 recomenda\u00e7\u00f5es pr\u00e1ticas baseadas no Regimento.',
      };

    case 'relatorio':
      return {
        system: 'Especialista em gestão educacional. Gere relatórios disciplinares concisos com insights acionáveis.',
        user: 'Per\u00edodo: ' + payload.period + ' | Total ocorr\u00eancias: ' + payload.totalOccurrences + '\nAlunos envolvidos: ' + payload.studentsWithOccurrences + '\nTop infra\u00e7\u00f5es: ' + payload.topInfractions + '\nTop turmas: ' + payload.topClasses + '\nGravidade: ' + payload.severityDistribution + '\nGere: resumo executivo, tend\u00eancias e recomenda\u00e7\u00f5es priorit\u00e1rias.',
      };

    case 'chat':
      return {
        system: [
          'Você é ARIA, assistente virtual da E.E. Cívico-Militar Prof. João Batista.',
          'Responda de forma curta, direta e cordial em português.',
          'Auxilie com regras disciplinares, registro de ocorrências e orientações pedagógicas.',
          'Quando perguntado sobre infrações ou medidas, consulte o regimento abaixo.',
          '',
          REGIMENTO_CORPUS,
        ].join('\n'),
        user: payload.message,
      };

    default:
      return { system: '', user: '' };
  }
}

// Mapeamento oficial de erros HTTP da API DeepSeek
// Fonte: https://api-docs.deepseek.com/quick_start/error_codes
const DEEPSEEK_ERRORS: Record<number, { label: string; cause: string; solution: string }> = {
  400: {
    label: 'Formato Inválido',
    cause: 'Corpo da requisição em formato inválido.',
    solution: 'Verifique o payload enviado à API.',
  },
  401: {
    label: 'Falha de Autenticação',
    cause: 'API Key incorreta ou ausente.',
    solution: 'Verifique a variável DEEPSEEK_API_KEY no painel de variáveis.',
  },
  402: {
    label: 'Saldo Insuficiente',
    cause: 'Créditos da conta DeepSeek esgotados.',
    solution: 'Adicione saldo em https://platform.deepseek.com.',
  },
  422: {
    label: 'Parâmetros Inválidos',
    cause: 'Parâmetros fora do esperado (max_tokens, temperature, etc.).',
    solution: 'Revise os parâmetros enviados na requisição.',
  },
  429: {
    label: 'Rate Limit Atingido',
    cause: 'Muitas requisições em pouco tempo.',
    solution: 'Aguarde alguns segundos e tente novamente.',
  },
  500: {
    label: 'Erro no Servidor DeepSeek',
    cause: 'Falha interna nos servidores da NVIDIA/DeepSeek.',
    solution: 'Tente novamente em instantes. Se persistir, contate o suporte.',
  },
  503: {
    label: 'Servidor Sobrecarregado',
    cause: 'Alto tráfego nos servidores DeepSeek.',
    solution: 'Tente novamente após breve espera.',
  },
};

function deepseekErrorMessage(status: number, rawMessage: string): string {
  const known = DEEPSEEK_ERRORS[status];
  if (known) {
    return '[HTTP ' + status + '] ' + known.label + ' \u2014 ' + known.cause + ' | Solu\u00e7\u00e3o: ' + known.solution;
  }
  return '[HTTP ' + status + '] ' + rawMessage;
}

export async function POST(req: NextRequest) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ error: deepseekErrorMessage(401, 'DEEPSEEK_API_KEY não configurada.') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { type: string; payload: Record<string, any> };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: deepseekErrorMessage(400, 'JSON inválido no corpo da requisição.') }),
      { status: 400 }
    );
  }

  const { type, payload } = body;
  const cfg = CONFIGS[type];
  if (!cfg) {
    return new Response(
      JSON.stringify({ error: deepseekErrorMessage(422, `Tipo "${type}" não reconhecido.`) }),
      { status: 400 }
    );
  }

  const { system, user } = buildPrompts(type, payload);

  // Modelos nativos DeepSeek — fallback automatico se o primeiro nao responder
  const MODEL_CHAIN = [
    'deepseek-chat',    // DeepSeek-V3 — principal, mais rapido
    'deepseek-reasoner', // DeepSeek-R1 — fallback mais robusto
  ];
  const FIRST_CHUNK_TIMEOUT_MS = 20000; // 20s sem nenhum chunk = timeout

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { /* fechado */ }
      };

      let lastError: { httpStatus: number; rawMsg: string } | null = null;

      for (const model of MODEL_CHAIN) {
        send({ meta: { model, attempt: MODEL_CHAIN.indexOf(model) + 1 } });

        // AbortController para timeout do primeiro chunk
        const abort = new AbortController();
        let firstChunkReceived = false;
        const timeoutId = setTimeout(() => {
          if (!firstChunkReceived) {
            console.error(`[v0] Timeout ${FIRST_CHUNK_TIMEOUT_MS}ms sem resposta do modelo ${model}`);
            abort.abort();
          }
        }, FIRST_CHUNK_TIMEOUT_MS);

        try {
          const completion = await getClient().chat.completions.create(
            {
              model,
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
              ],
              temperature: cfg.temperature,
              stream: true,
            },
            { signal: abort.signal }
          );

          let full = '';
          let totalTokens = 0;
          let promptTokens = 0;
          let completionTokens = 0;
          for await (const chunk of completion) {
            if (!firstChunkReceived) {
              firstChunkReceived = true;
              clearTimeout(timeoutId);
              send({ meta: { model, firstChunkMs: Date.now() } });
            }
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              full += delta;
              send({ delta, model });
            }
            // Captura tokens do último chunk (DeepSeek envia usage no final)
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens || 0;
              completionTokens = chunk.usage.completion_tokens || 0;
              totalTokens = chunk.usage.total_tokens || (promptTokens + completionTokens);
            }
          }
          clearTimeout(timeoutId);
          
          // Log de tokens no console do servidor
          console.log(`[AI] Modelo: ${model} | Tokens: ${totalTokens} (prompt: ${promptTokens}, completion: ${completionTokens})`);
          
          send({ done: true, result: full.trim(), model, usage: { totalTokens, promptTokens, completionTokens } });
          return; // sucesso — sai do loop
        } catch (err: any) {
          clearTimeout(timeoutId);
          const isTimeout = err?.name === 'AbortError' || err?.code === 'ETIMEDOUT';
          const httpStatus: number = isTimeout ? 504 : (err?.status ?? 500);
          const rawMsg: string = isTimeout
            ? `Modelo ${model} nao respondeu em ${FIRST_CHUNK_TIMEOUT_MS / 1000}s`
            : (err?.message ?? 'Erro desconhecido.');

          lastError = { httpStatus, rawMsg };
          console.error(`[v0] Erro modelo ${model}:`, httpStatus, rawMsg);

          const isLastModel = model === MODEL_CHAIN[MODEL_CHAIN.length - 1];
          if (!isLastModel) {
            const nextModel = MODEL_CHAIN[MODEL_CHAIN.indexOf(model) + 1];
            send({ meta: { fallback: true, from: model, to: nextModel, reason: rawMsg } });
            continue; // tenta proximo modelo
          }

          // Todos os modelos falharam
          const friendlyMsg = deepseekErrorMessage(httpStatus, rawMsg);
          send({ error: friendlyMsg, httpStatus, raw: rawMsg });
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
