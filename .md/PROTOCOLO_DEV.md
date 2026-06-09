# PROTOCOLO DE DESENVOLVIMENTO — EECM / SIGMILITAR

> Leia **antes** de propor ou executar qualquer alteração. Toda resposta segue as três fases.

---

## FASE 1 — Análise e Planejamento

1. Identifique **quais arquivos** serão tocados e em quais linhas.
2. Mapeie **dependências**: o que mais no sistema é afetado.
3. Apresente plano no chat — execute só após alinhamento.
4. Nunca assuma que coluna, campo ou rota já existe — **verifique no código**.

---

## FASE 2 — Pilares de Qualidade

### Robustez
- `try/catch` em toda operação assíncrona com mensagem útil ao usuário.
- Arrays vazios, campos opcionais (`?.`, `?? fallback`) — nunca assumir que existem.
- `useEffect` com dependências corretas; cancelar fetches ao desmontar.
- Após `addOccurrence`/`updateOccurrence`, sempre atualizar store ou chamar `refreshData()`.
- `sessionStorage`/`localStorage`: envolver em `typeof window !== 'undefined'`.

### Segurança
- Validar role antes de renderizar dados sensíveis.
- RLS obrigatória — nunca confiar só no frontend.
- Filtro `school_id` obrigatório em todas as queries multi-tenant.
- Tokens e chaves nunca expostos no client-side.
- Redirecionamentos pós-login: validar `schoolId` em `contextSchools`.

### UX
- Skeleton (`animate-pulse`) durante fetches; botões com spinner e `disabled`.
- Erros de formulário abaixo do campo em vermelho. Erros de operação via toast.
- Cores padrão: `blue-600` primário, `amber-500` militar, `rose-500` destrutivo.
- Bordas: `rounded-xl` botões, `rounded-3xl` modais/cards.

### Mobile (desktop-first, mobile garantido)
- Usar `min-h-[100dvh]` — nunca `100vh`.
- Todo conteúdo de página: `pb-24 md:pb-8` (bottom nav cobre).
- Área mínima de toque: `min-h-[44px] min-w-[44px]`.
- Modais: `max-w-sm w-full mx-4`. Fechar no backdrop.
- Tabelas: cards empilhados em mobile (`md:hidden`) + tabela em `md:table`.
- Formulários: coluna única mobile → `sm:grid-cols-2`.
- Inputs: `inputMode="numeric"`, `tel`, `type="date"` conforme tipo.
- Safe area em elementos fixos: `safe-area-bottom`, `safe-area-top`.

**Checklist mobile antes de entregar:**
- [ ] Layout ok em 375px sem scroll horizontal
- [ ] Nada atrás da bottom nav (`pb-24 md:pb-8`)
- [ ] Toque mínimo 44px
- [ ] Modais com `mx-4`
- [ ] Safe area em fixos
- [ ] `100dvh` em containers full-height

---

## FASE 3 — Execução e Revisão

1. Alterar **somente** os arquivos listados no plano.
2. Campo novo no banco → aplicar via **Supabase MCP** (`apply_migration`). Nunca criar `.sql` locais.
3. Campo novo em interface → atualizar `lib/data.ts`.
4. Campo do banco → verificar **dois blocos** de fetch em `lib/store.tsx` (`fetchData` e `refreshData`).
5. Após implementar, listar o que **não** foi alterado.
6. Ações manuais exigidas do usuário → destacar com `> [!IMPORTANT]` ou `> [!WARNING]`.

---

## Contexto do Projeto

| Item | Valor |
|---|---|
| Framework | Next.js 14 App Router |
| Auth + Banco | Supabase (MCP) |
| Estilo | Tailwind CSS |
| Domínio | `sigmilitar.com.br` |
| Rotas | `app/[escola]/[pagina]/page.tsx` |
| Tenant | hostname + slug via `lib/useTenantConfig.ts` |
| Store | `lib/store.tsx` → `useAppContext()` |
| Roles | `admin_global`, `GESTOR`, `COORD`, `MONITOR`, `PROFESSOR` |
| Escolas | `eecmheliodoro`, `eecmprofjoaobatista`, `eecmtangara` |

## Mapeamento slug ↔ schoolId

| Slug (URL) | school_id (banco) | Nome |
|---|---|---|
| `eecmprofjoaobatista` | `joaobatista` | EECM Prof. João Batista |
| `eecmheliodoro` | `heliodoro` | EECM Heliodoro Capistrano |
| `eecmtangara` | `tangara` | EECM Tangará |
