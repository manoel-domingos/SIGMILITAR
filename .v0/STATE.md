# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-24 (sessão 6)
**Sessão:** Fix login (isSupabaseReady), match turmas importação, sync memories
**Operador:** Manoel Domingos

## Foco atual

Sistema multi-tenant ativo. Detecção de tenant em **runtime pelo domínio** (`getTenantIdFromHost`). Isolamento por escola via RLS no Postgres. DRE acessa tudo.

## Última ação concluída (2026-05-24) — sessão 6

- **Fix login — `isSupabaseReady()`:**
  - `lib/supabase.ts`: adicionado flag `_initialized` + `isSupabaseReady()` exportado
  - Proxy sempre era truthy mesmo sem credenciais — causava `No API key found` no Supabase
  - `login/page.tsx` usa `isSupabaseReady()` em vez de `if (supabase)`
  - Erros reais de credenciais exibem mensagem ao usuário — não caem no fallback mock

- **Race condition no logout corrigido:**
  - `logoutFlagRef` bloqueia `onAuthStateChange` durante o `signOut()`
  - Evita `Lock "eecm-auth-token" was released by another request`

- **Detecção de tenant robusta:**
  - `getTenantIdFromHost()`: passo 1 match exato → passo 2 substring do hostname
  - Cobre previews Vercel com hash: `eecmheliodoro-abc123.vercel.app`

- **Match de turmas na importação XLSX:**
  - `parseTurmaLetter` removido — sufixo completo preservado (`"A-LING"`, `"B-CHS"`)
  - `matchToAvailableClass()` busca em `getAllClassNames(getTenantIdFromHost())` em 3 passos: exato → substring → fuzzy por tokens
  - Logs `[v0] classMatch:` adicionados para diagnóstico

- **Sync de memories:**
  - `v0_memories/user/eecm-project.md` — identidade + tenants
  - `v0_memories/user/eecm-decisions.md` — decisões 0001–0007
  - `v0_memories/user/eecm-roadmap.md` — fases + milestones
  - `v0_memories/user/eecm-rules-development.md` — padrões de código
  - `MEMORY.md` atualizado com índice

## Última ação concluída (2026-05-24) — sessão 5

- **Detecção de tenant por domínio (runtime):**
  - `lib/useTenantConfig.ts`: exporta `getTenantIdFromHost()` (função pura) e `TENANT_MAP`
  - `lib/school.ts`: `getSchoolConfig()` + `getAllClassNames()` com suporte a turmas compostas por tenant
  - `lib/store.tsx`: `activeSchoolContext` inicializa pelo domínio; boot usa domínio como fallback; `onAuthStateChange` resolve `school_id` do perfil e re-executa `fetchData` filtrado ao `SIGNED_IN`
  - `components/AppShell.tsx`: `SCHOOL_NAME`, `SCHOOL_LOGO_SIDEBAR`, `SCHOOL_LOGO_DASH` estáticos removidos — substituídos por `schoolName`, `logoSidebar`, `logoDash` do `useTenantConfig`

- **Logout corrigido:**
  - `logout()` no store limpa estado + `supabase.auth.signOut()` + `window.location.href = '/login'`
  - Não depende mais do `useEffect` do AppShell para redirecionar

- **Turmas compostas — Heliodoro:**
  - `lib/school.ts`: `SchoolConfig` estendida com `classSuffixesByGrade` e `standaloneClasses`
  - Heliodoro: `A-LING`, `B-CHS`, `B-LING`, `C-CHS`, `C-MAT/CNT`, `D-EPT/INFORM`, `D-MAT/CNT`, `E-EPT/INFORM`, `E-MAT/CNT` (por ano) + `EPT-AUTOMAC`, `EPT-EDIFICAC`, `EPT-ELETROTEC`, `EPT-ELETROT` (standalone)
  - `components/ClassSelector.tsx`: componente reutilizável — modo composto (select único agrupado) ou modo simples (dois selects ano + letra)
  - Aplicado em `alunos/page.tsx`, `StudentSheet.tsx`, `registro-disciplinar/page.tsx`

- **Parser XLSX aprimorado (formato SIGMILITAR):**
  - Detecta colunas `SÉRIE` + `TURMA` separadas e as combina
  - `TELEFONES` separados por espaço divididos em dois contatos
  - `SOB LAUDO PAED/CID` mesclado na Observação

- **`useTenantConfig` expõe:** `tenantId`, `schoolName`, `logoSidebar`, `logoDash`, `logoLogin`, `grades`, `seniorGrades`, `classLetters`, `allClassNames`, `classSuffixesByGrade`, `standaloneClasses`, `hasCompoundClasses`

- Zero erros TypeScript em todas as sessões

## Última ação concluída (2026-05-17) — sessão 4

- **Novo layout do painel DRE (`DreDashboard.tsx`):**
  1. Layout `grid 1fr 300px` — painel central + sidebar fixa (xl)
  2. **Sidebar:** card KPI "% Implantação do Sistema na Rede" com gauge semicircular, ranking de escolas por índice disciplinar, ranking de alunos (elogios/100) com barra de progresso
  3. **Painel central:** estrutura analytics (hero card Índice Disciplinar + 3 cards KPI em linha), KPIs secundários (Taxa Gravidade, Razão E/O, Acidentes, Alertas), gráficos comparativos
  4. **Lista de Ocorrências** ao final — tabela com colunas Escola, Descrição, Qtd, Progresso, Severidade + filtros pills (Todas/Graves/Medias/Leves) + select por escola + link para registro completo
- Zero erros TypeScript

## Última ação concluída (2026-05-17) — sessão 3
- **Ficha do aluno com 4 abas + replicação para escolas:**
  1. `app/alunos/page.tsx`: modal de edição reformulado com layout largo (max-w-4xl) e 4 abas: Atividades (timeline de ocorrências), Dados (formulário), Responsaveis, Documentos
  2. `components/StudentSheet.tsx`: componente reutilizável extraído (aceita `studentId`, `onClose`, `readOnly`)
  3. `app/page.tsx`: cards de alunos críticos tornados clicáveis — abre `StudentSheet` diretamente no dashboard da escola
- Zero erros TypeScript

## Última ação concluída (2026-05-17) — sessão 2
- **4 melhorias no /dre:**
  1. `<AIChat />` adicionado ao DRE (flutuante IA com ARIA, mesmo componente do AppShell)
  2. Fundo azul `from-blue-700 via-blue-800 to-blue-950` — mesmo gradiente do DRE login
  3. Header substituído por pill glass igual ao TopbarLayout das escolas (logo, status ONLINE, ícones icon-pill, avatar)
  4. Todos os KPIs clicáveis: `HeroKpi` e `SecKpi` viram `<button>` com hover scale, shadow, border colorida, ARIA labels e `onNavigate` para rotas corretas
- Zero erros TypeScript

## Última ação concluída (2026-05-17)
- **Dashboard DRE com KPIs atraentes:** Criado `DreDashboard.tsx` (603 linhas) com bento grid moderno — KPIs primários com card herói de índice disciplinar, badges de severidade L/M/G, gráfico de barras comparativo por escola (Recharts), gráfico de pizza de severidade, seção de implantação com `IndexRing`, ranking com medalhas, cards de escola clicáveis com barra stacked de gravidade.
- **Redirecionamento ao clicar na escola:** `onSchoolClick` passa `setActiveSchoolContext(id)` + `router.push('/')`.
- **Seções legadas desativadas:** Blocos `kpis_primarios`, `kpis_secundarios`, `implantacao`, `ranking/escolas` substituídos por `{false &&}`.

## Última ação concluída (2026-05-16)
- **Multi-tenant (DECISÃO 0006):**
  - Tabela `schools` criada com `joaobatista` e `DRE`
  - Coluna `school_id TEXT DEFAULT 'joaobatista'` adicionada nas 16 tabelas operacionais com FK para `schools`
  - Todos os registros existentes atualizados para `school_id = 'joaobatista'`
  - Funções PG criadas: `user_can_access_school()` e `current_school_id()` — DRE/admin_global retorna acesso total
  - RLS habilitado + 4 policies (`select/insert/update/delete`) em todas as tabelas
  - 10 índices de performance criados em `school_id`
- **Protocolo de Erro adicionado:** criado `.v0/rules/debug.md` com sequência obrigatória de 4 etapas.

## Ação anterior concluída

- **Painel de Implantação:** Página `/implantacao` criada com checklist completo da escola cívico-militar, popup de conclusão com campo de relato, sistema de undo (desfazer), persistência em `implantacao_categories` + `implantacao_items` no Supabase
- **KPI Dashboard:** Novo card de Implantação com progresso real vindo do Supabase + gráfico de rosca corrigido (não cortado)
- **Configurador de Painéis:** Drawer lateral no Dashboard com toggle e drag-and-drop para reordenar painéis. Configuração salva na tabela `dashboard_panels` no Supabase por `user_id` (DECISÃO 0005)
- **Regra geral:** localStorage banido — toda persistência passa pelo Supabase

## Próxima ação

- [ ] Validar em produção: acesso a `eecmheliodoro.vercel.app` carrega dados e logo do Heliodoro sem resync manual
- [ ] Validar logout: botão desloga e redireciona para `/login` corretamente em todos os tenants
- [ ] Verificar se uploads estão funcionando corretamente após mudanças nas políticas RLS
- [ ] Melhorar UX de preview dos arquivos após upload (gallery/thumbnail)
- [ ] Implementar deleção de arquivos do Storage quando ocorrência/aluno é deletado

## Bloqueios

Nenhum no momento.

## Drift Score

`0` (sessão alinhada)

---

## Como atualizar este arquivo

A cada virada de tarefa:
1. Mover "Próxima ação" → "Última ação concluída"
2. Definir nova "Próxima ação"
3. Atualizar data
4. Se algo decidido, anotar em `DECISIONS.md`
