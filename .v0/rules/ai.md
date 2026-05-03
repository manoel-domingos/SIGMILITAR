# Rules: ai

> Carregar quando trabalhar em integração de IA, prompts, geração assistida.

## Provider atual

- **DeepSeek** via OpenAI SDK (`baseURL: https://api.deepseek.com/v1`)
- Modelos: `deepseek-chat` (principal), `deepseek-reasoner` (fallback / raciocínio profundo)
- Env var obrigatória: `DEEPSEEK_API_KEY`

## Padrões de chamada

1. **Lazy init** — cliente OpenAI deve ser instanciado dentro da função, não no escopo do módulo (evita erro de build sem env var)

2. **Streaming SSE** — sempre que possível, retornar stream para feedback rápido ao usuário

3. **Log de tokens** — toda chamada deve logar:
   ```
   [AI] Modelo: <model> | Tokens: <total> (prompt: X, completion: Y)
   ```
   E enviar `usage` no chunk final do SSE.

4. **Timeout** — 60s máximo (`export const maxDuration = 60`)

5. **Fallback** — se `deepseek-chat` falhar, tentar `deepseek-reasoner` antes de retornar erro

## Prompts

- Sistema sempre em pt-BR
- Explicitar formato de saída (markdown, JSON, texto puro)
- Para geração disciplinar, incluir disclaimer "rascunho a revisar"
- Limitar dados pessoais ao mínimo necessário (LGPD)

## Templates de prompt (futuro)

Manter em `lib/ai/prompts/` separados por feature:
- `occurrence-draft.ts`
- `conduct-term-draft.ts`
- `summons-draft.ts`
- `pattern-analysis.ts`

## Custo

- Logar tokens permite estimar custo
- Considerar cache de respostas idênticas (futuro, via Upstash Redis)
