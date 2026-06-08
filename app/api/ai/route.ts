import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { REGIMENTO_CORPUS, HIERARQUIA_FONTES } from '@/lib/regimento';
import { getTenantServer } from '@/lib/getTenantServer';
import { createClient } from '@supabase/supabase-js';

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

function getDbSchoolId(tenantId: string): string {
  if (tenantId === 'eecmprofjoaobatista') return 'joaobatista';
  if (tenantId === 'eecmheliodoro') return 'heliodoro';
  if (tenantId === 'eecmtangara') return 'tangara';
  return tenantId;
}

function buildPrompts(type: string, payload: Record<string, any>, school: { id: string; name: string }): { system: string; user: string } {
  const schoolContext = [
    '=== IDENTIDADE DA ESCOLA (TENANT ATIVO) ===',
    `ID do Tenant: ${school.id}`,
    `Nome Oficial: ${school.name}`,
    '',
  ].join('\n');

  switch (type) {
    case 'ata':
      return {
        system: [
          `Você é um gestor escolar da ${school.name}.`,
          'Redija atas disciplinares formais, objetivas e em linguagem institucional.',
          'Retorne APENAS o texto da ata, sem comentários adicionais, sem aspas e sem blocos de código.',
          '',
          schoolContext,
          'FORMATO OBRIGATÓRIO (use exatamente esta estrutura com campos em negrito markdown **campo:**):',
          '',
          '**Data:** [dia] de [mês por extenso] de [ano]',
          '**Hora:** [HH:MM]',
          '**Local:** [local completo]',
          '',
          '**Aluno(s) envolvido(s):** [NOME(S) EM MAIÚSCULAS]',
          '',
          '**Relato dos Fatos:**',
          '[Narrativa formal e objetiva na 3ª pessoa. Inclua: o que aconteceu, onde, quando, quem identificou, contexto relevante, orientação dada. Se houver reincidência, mencione expressamente.]',
          '',
          '**Classificação da Infração:**',
          '[Natureza da infração (Leve/Média/Grave), artigo(s) do Regimento Interno com descrição, e qualquer agravante/atenuante aplicável.]',
          '',
          'REGRAS:',
          '- Nunca use "ATA Nº ..." no corpo — esse número é gerado automaticamente pelo sistema.',
          '- Use linguagem formal institucional, sem gírias.',
          '- Os campos em negrito são obrigatórios e devem aparecer exatamente como acima.',
          '- Cite artigos do Regimento Interno quando relevante.',
          '',
          REGIMENTO_CORPUS,
          '',
          HIERARQUIA_FONTES,
        ].join('\n'),
        user: [
          'Formalize para ata disciplinar:',
          'Aluno(s): ' + payload.students,
          'Infração: ' + payload.infractions,
          'Data/Hora: ' + payload.dateTime,
          'Local: ' + payload.location,
          'Localizado por: ' + (payload.locatedBy || 'não informado'),
          'Medida atribuída: ' + (payload.measure || 'a definir'),
          'Reincidente: ' + (payload.isReincidente ? 'Sim' : 'Não'),
          'Relato/observações: ' + (payload.text || 'Elabore a narrativa com base nos dados acima.'),
        ].join('\n'),
      };

    case 'sugestao':
      return {
        system: [
          `Você é um especialista em gestão disciplinar escolar da ${school.name}.`,
          'Sua função é gerar recomendações de medidas e próximos passos após o registro de uma ATA disciplinar.',
          '',
          schoolContext,
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
          'Infração registrada: ' + payload.infractions + ' (Natureza: ' + (payload.severity ?? 'não informada') + ')',
          'Medida atribuída: ' + (payload.measure ?? 'não informada'),
          'Reincidente: ' + (payload.isReincidente ? 'Sim' : 'Não'),
          'Histórico: ' + (payload.totalOccurrences ?? 0) + ' ocorrência(s) anteriores',
          'Pontuação atual: ' + (payload.currentPoints ?? 'não informada'),
          'Observações da ATA: ' + (payload.ataText ?? 'não fornecido'),
          '',
          'Gere as recomendações pós-ATA conforme o Regimento Interno.',
        ].join('\n'),
      };

    case 'analise':
      return {
        system: [
          `Você é um psicopedagogo escolar da ${school.name}.`,
          'Analise o histórico disciplinar de forma construtiva e profissional.',
          '',
          schoolContext,
          REGIMENTO_CORPUS,
          '',
          HIERARQUIA_FONTES,
        ].join('\n'),
        user: 'Aluno: ' + payload.studentName + ' | Turma: ' + payload.class + '\nOcorrências: ' + payload.totalOccurrences + ' | Pontos: ' + payload.currentPoints + '\nDetalhes: ' + payload.occurrences + '\nForneça: padrão de comportamento, causas prováveis e 3 recomendações práticas baseadas no Regimento.',
      };

    case 'relatorio':
      return {
        system: [
          `Você é um especialista em gestão educacional da ${school.name}.`,
          'Gere relatórios disciplinares concisos com insights acionáveis.',
          '',
          schoolContext,
        ].join('\n'),
        user: 'Período: ' + payload.period + ' | Total ocorrências: ' + payload.totalOccurrences + '\nAlunos envolvidos: ' + payload.studentsWithOccurrences + '\nTop infrações: ' + payload.topInfractions + '\nTop turmas: ' + payload.topClasses + '\nGravidade: ' + payload.severityDistribution + '\nGere: resumo executivo, tendências e recomendações prioritárias.',
      };

    case 'chat':
      return {
        system: [
          `Você é ARIA, assistente virtual da ${school.name}.`,
          'Responda de forma curta, direta e cordial em português.',
          'Auxilie com regras disciplinares, registro de ocorrências e orientações pedagógicas.',
          'Quando perguntado sobre infrações ou medidas, consulte o regimento abaixo.',
          '',
          schoolContext,
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
  let body: {
    type: string;
    payload: Record<string, any>;
    schoolId?: string;
    customApiKey?: string;
    customBaseUrl?: string;
    customModel?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: deepseekErrorMessage(400, 'JSON inválido no corpo da requisição.') }),
      { status: 400 }
    );
  }

  try {
    const { type, payload, schoolId, customApiKey, customBaseUrl, customModel } = body;

    const activeApiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
    if (!activeApiKey) {
      return new Response(
        JSON.stringify({ error: deepseekErrorMessage(401, 'API Key do Assistente não configurada.') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawBaseUrl = customBaseUrl || 'https://api.deepseek.com';
    const activeBaseUrl = rawBaseUrl.replace(/\/+$/, '');

    const cfg = CONFIGS[type];
    if (!cfg) {
      return new Response(
        JSON.stringify({ error: deepseekErrorMessage(422, `Tipo "${type}" não reconhecido.`) }),
        { status: 400 }
      );
    }

    // Resolve o tenant ativo. No modelo só-slug (sigmilitar.com.br/<escola>), o
    // /api/ai não recebe o slug no path, então o header x-tenant cai no fallback.
    // Por isso priorizamos o schoolId enviado pelo cliente (validado), e só então
    // recorremos ao header/sessão do servidor.
    const VALID_TENANTS = new Set([
      'eecmheliodoro', 'eecmprofjoaobatista', 'eecmtangara',
      'heliodoro', 'joaobatista', 'tangara',
    ]);
    const clientTenant = typeof schoolId === 'string' && VALID_TENANTS.has(schoolId) ? schoolId : null;
    const tenantId = clientTenant ?? await getTenantServer();
    const dbSchoolId = getDbSchoolId(tenantId);

    // Inicializa o cliente do Supabase para buscar o nome correto da escola
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const keyToUse = supabaseServiceKey || supabaseAnonKey;
    
    const FALLBACK_SCHOOL_NAMES: Record<string, string> = {
      joaobatista: 'E.E. Cívico-Militar Prof. João Batista',
      heliodoro: 'E.E. Cívico-Militar Heliodoro Capistrano',
      tangara: 'E.E. Cívico-Militar Tangará',
    };
    const fallbackName = FALLBACK_SCHOOL_NAMES[dbSchoolId] || 'E.E. Cívico-Militar Heliodoro Capistrano';
    let school = { id: dbSchoolId, name: fallbackName };

    if (supabaseUrl && keyToUse) {
      try {
        let url = supabaseUrl;
        if (!url.startsWith('http')) url = `https://${url}`;
        const supabaseAdmin = createClient(url, keyToUse, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data } = await supabaseAdmin
          .from('schools')
          .select('*')
          .eq('id', dbSchoolId)
          .single();
        if (data && data.name) {
          school = { id: data.id, name: data.name };
        }
      } catch (err) {
        console.error('[AI API] Falha ao recuperar dados da escola:', err);
      }
    }

    const { system, user } = buildPrompts(type, payload, school);

    // Modelos nativos DeepSeek — fallback automatico se o primeiro nao responder
    const MODEL_CHAIN = customModel
      ? [customModel]
      : [
          'deepseek-v4-pro',   // DeepSeek V4 Pro
          'deepseek-v4-flash', // DeepSeek V4 Flash
        ];
    const FIRST_CHUNK_TIMEOUT_MS = 20000; // 20s sem nenhum chunk = timeout

    const client = new OpenAI({
      apiKey: activeApiKey,
      baseURL: activeBaseUrl,
    });

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
              console.error('[v0] Timeout ' + FIRST_CHUNK_TIMEOUT_MS + 'ms sem resposta do modelo ' + model);
              abort.abort();
            }
          }, FIRST_CHUNK_TIMEOUT_MS);

          try {
            const completion = await client.chat.completions.create(
              {
                model,
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                ],
                temperature: cfg.temperature,
                stream: true,
                thinking: { type: 'disabled' },
              } as any,
              { signal: abort.signal }
            );

            let full = '';
            let totalTokens = 0;
            let promptTokens = 0;
            let completionTokens = 0;
            for await (const chunk of completion as any) {
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
            console.log('[AI] Modelo: ' + model + ' | Tokens: ' + totalTokens + ' (prompt: ' + promptTokens + ', completion: ' + completionTokens + ')');
            
            send({ done: true, result: full.trim(), model, usage: { totalTokens, promptTokens, completionTokens } });
            controller.close();
            return; // sucesso — sai do loop
          } catch (err: any) {
            clearTimeout(timeoutId);
            const isTimeout = err?.name === 'AbortError' || err?.code === 'ETIMEDOUT';
            const httpStatus: number = isTimeout ? 504 : (err?.status ?? 500);
            const rawMsg: string = isTimeout
              ? 'Modelo ' + model + ' nao respondeu em ' + (FIRST_CHUNK_TIMEOUT_MS / 1000) + 's'
              : (err?.message ?? 'Erro desconhecido.');

            lastError = { httpStatus, rawMsg };
            console.error('[v0] Erro modelo ' + model + ':', httpStatus, rawMsg);

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
  } catch (error: any) {
    console.error('[AI API ERROR]:', error);
    return new Response(
      JSON.stringify({ error: deepseekErrorMessage(500, error?.message || 'Erro inesperado no servidor.') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
