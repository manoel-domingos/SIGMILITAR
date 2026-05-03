# Rules: development

> Carregar quando trabalhar em código geral, infra, builds.

## Estrutura de pastas

- `app/` — App Router (Next.js 15)
- `app/api/*/route.ts` — API routes
- `components/` — UI compartilhada
- `lib/` — utilities, clients (supabase, ai)
- `supabase/migrations/` — migrations versionadas
- `scripts/` — scripts SQL e setup

## Padrões obrigatórios

1. **Server vs Client** — Componentes são Server Component por default. Adicionar `"use client"` apenas quando necessário (state, effects, browser APIs).

2. **Supabase — REGRA CARDINAL**
   - **TODO salvamento de dados DEVE ir para o Supabase, sempre. Sem exceções.**
   - Nunca usar localStorage como destino de dados de negócio (students, occurrences, accidents, praises, summons, conduct_terms, rules).
   - localStorage é permitido apenas para preferências de UI (debug mode, api keys, sessão ativa).
   - Se `isSupabaseConnected === false`, lançar erro visível ao usuário — não fazer fallback silencioso para estado local.
   - Banco ativo: projeto `imprdimqcjbndqewioyt` (EECM-JOAO-BATISTA)
   - Cliente browser: `lib/supabase.ts` (anon key)
   - Cliente server: usar `createClient` com service role apenas em API routes
   - **Nunca** expor service_role no client
   - Sempre RLS habilitado em tabelas com dados sensíveis

3. **Forms**
   - `react-hook-form` + `zod` via `@hookform/resolvers`
   - Mensagens de erro em pt-BR

4. **Estilo**
   - Tailwind v4 + shadcn/ui
   - Tokens semânticos (`bg-background`, `text-foreground`)
   - Mobile-first, depois `md:`, `lg:`
   - Gap > space-* > margin

5. **Erros**
   - API routes sempre retornam `{ error: string, code?: string }` em falha
   - UI usa `sonner` para toast de erro

6. **Logs**
   - `console.log("[v0] ...")` para debug temporário
   - `console.log("[AI] ...")` para chamadas IA
   - `console.log("[supabase] ...")` para queries problemáticas
   - Remover debug antes de fechar plano

## Auto-instalação de deps

O v0 detecta imports e instala automaticamente. **Não editar `package.json` para adicionar libs** — apenas escreva o `import` e o sistema resolve.

## Branches e PRs

- Branch padrão de trabalho: `v0/<descrição>`
- Nunca push direto em `main`
- Commits descritivos em pt-BR aceitos
