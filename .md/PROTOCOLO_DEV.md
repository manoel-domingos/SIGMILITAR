# PROTOCOLO DE DESENVOLVIMENTO — EECM / SIGMILITAR

> **Instrução para a IA:** Ao receber qualquer prompt de desenvolvimento neste projeto,
> leia este arquivo **antes** de propor ou executar qualquer alteração no código.
> Toda resposta deve seguir as três fases abaixo.

---

## FASE 1 — Análise e Planejamento

Antes de alterar qualquer arquivo:

1. Identifique **quais arquivos** serão tocados e em quais linhas.
2. Mapeie **dependências**: o que mais no sistema consome ou é afetado pelo trecho a alterar.
3. Apresente um plano estruturado diretamente na conversa do chat — execute após alinhamento direto.
4. Nunca assuma que uma coluna, campo ou rota já existe — **verifique no código antes de referenciar**.

---

## FASE 2 — Pilares de Qualidade

Toda implementação deve ser avaliada e construída sob os três pilares:

---

### 🔩 Robustez

- **Tratamento de erros obrigatório** em toda operação assíncrona (`try/catch` com mensagem útil ao usuário).
- **Edge cases explícitos:**
  - Arrays vazios (`contextSchools`, `appUsers`, `occurrences`) — nunca assumir que têm itens.
  - Campos opcionais (`linkedProfessor`, `schoolId`) — usar `?.` e `?? fallback` sempre.
  - Usuário não autenticado ou `isAuthRestored === false` — nunca renderizar dados sensíveis antes da hidratação.
- **Concorrência no React/Next.js:**
  - `useEffect` com dependências corretas — sem loops infinitos.
  - Cancelar fetches em andamento ao desmontar (`AbortController` ou flag `isMounted`).
  - Nunca chamar `setState` após desmontagem.
- **Consistência de dados entre store e banco:**
  - Após `addOccurrence` / `updateOccurrence` / `deleteOccurrence`, sempre chamar `refreshData()` ou atualizar o estado local de forma otimista + rollback em caso de erro.
  - Campos novos adicionados ao banco **devem** ser mapeados nos dois blocos de fetch do store (`fetchData` e `refreshData` em `lib/store.tsx`).
- **`sessionStorage` e `localStorage`:**
  - Sempre envolver em `typeof window !== 'undefined'` antes de acessar.
  - Chaves devem ser constantes nomeadas no topo do arquivo, nunca strings inline.

---

### 🔒 Segurança

- **Validação de role antes de renderizar** qualquer dado ou ação sensível:
  ```ts
  if (currentUserRole !== 'admin_global') return null;
  ```
- **Nunca confiar só no frontend** — regras de acesso críticas devem existir também nas **Row Level Security (RLS)** do Supabase.
- **Filtragem de dados por `school_id`** obrigatória em todas as queries que retornam registros multi-tenant. Nunca buscar `SELECT *` sem filtro de escola.
- **Validação de entrada** com os schemas de `lib/validators.ts` antes de qualquer `insert` ou `update` no Supabase.
- **Middleware (`middleware.ts`):**
  - Rotas protegidas devem verificar sessão ativa.
  - Resolução de tenant pelo hostname **e** pelo pathname — nunca depender só de um.
- **Tokens e chaves** nunca expostos no client-side. Variáveis `NEXT_PUBLIC_` só para dados não-sensíveis.
- **Redirecionamentos pós-login** devem sempre validar que o `schoolId` do usuário existe em `contextSchools` antes de redirecionar — evitar open redirect.

---

### ✨ UX (Experiência do Usuário)

- **Estados de carregamento claros:**
  - Usar skeleton (`animate-pulse`) enquanto `!isAuthRestored` ou durante fetches.
  - Botões de ação devem exibir `<Loader2 className="animate-spin" />` durante operação assíncrona e ficar `disabled`.
- **Feedback de erro visível:**
  - Erros de formulário abaixo do campo afetado, em vermelho, com `text-sm`.
  - Erros de operação (save/delete) via toast ou banner — nunca silenciosos.
- **Micro-animações:**
  - Entradas de elementos: `animate-in fade-in duration-200` (Tailwind/tw-animate).
  - Expansão de acordeões: `transition-all duration-200 overflow-hidden`.
  - Chevrons e ícones de estado: `transition-transform duration-200`.
- **Responsividade:**
  - Testar layout em `max-w-sm` (mobile) e `lg:` (desktop) para todo componente novo.
  - Modais: `max-w-sm w-full mx-4` — nunca encostar nas bordas em mobile.
- **Acessibilidade mínima:**
  - Botões com `title` ou `aria-label` quando só têm ícone.
  - Foco visível (`focus:ring-2`) em todos os elementos interativos.
- **Consistência visual:**
  - Seguir o padrão de cores já estabelecido: `blue-600` para ações primárias, `amber-500` para militar/xerife, `rose-500` para destrutivo.
  - Bordas: `rounded-xl` para botões, `rounded-3xl` para modais/cards grandes.

---

### 📱 Mobile — UI & UX (obrigatório em toda implementação)

> O sistema é **desktop-first**: o design e a experiência principal são pensados para telas grandes.
> Porém, **mobile deve funcionar 100%** — sem layouts quebrados, elementos cortados ou interações inacessíveis.
> Projetar para desktop, depois garantir que mobile não quebre.

#### Layout e estrutura

- **Desktop-first, mobile garantido:** escrever o layout pensando em desktop, mas sempre adicionar breakpoints para mobile não quebrar.
  ```tsx
  // ✅ Correto — desktop define o padrão, mobile adapta
  className="p-8 max-w-6xl" // desktop ok
  className="p-4 md:p-8"    // mobile também ok
  // ❌ Errado — ignora mobile
  className="p-8 grid grid-cols-4" // sem adaptação, colapsa em mobile
  ```
- **Altura de tela real:** usar `min-h-[100dvh]` (dynamic viewport height) em vez de `100vh` — evita o bug da barra de endereço em iOS/Android.
- **Bottom navigation (já existe no projeto):** está em `AppShell.tsx` como `fixed bottom-0 ... md:hidden`. Todo novo conteúdo de página deve ter `pb-24 md:pb-8` para não ser encoberto por ela.
- **Sidebar:** oculta em mobile (`hidden md:flex`). Em mobile usa drawer deslizante com `translate-x-0 / -translate-x-full` via estado `open`. Nunca duplicar lógica de navegação.

#### Safe area (notch e barra home)

O projeto já possui as classes utilitárias em `globals.css`. Usar obrigatoriamente:

| Situação | Classe |
|---|---|
| Drawer/sidebar lateral | `safe-area-inset` (padding left/right) |
| Rodapé fixo / bottom nav | `safe-area-bottom` ou `pb-[calc(Xpx+env(safe-area-inset-bottom,0px))]` |
| Header fixo | `safe-area-top` |
| Modais com scroll interno | `overscroll-contain` no container scrollável |

```tsx
// Exemplo — rodapé de modal em iPhone
className="p-4 border-t safe-area-bottom"

// Exemplo — bottom nav
className="pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
```

#### Tamanhos de toque e interação

- **Área mínima de toque:** `min-h-[44px] min-w-[44px]` em todo botão/ícone interativo (padrão Apple HIG).
- **Feedback tátil:** adicionar `active:scale-95 transition-transform` em botões para dar resposta visual ao toque.
- **Inputs:** `py-2.5` mínimo em campos de formulário — evitar alvos pequenos demais em mobile.
- **Listas longas:** usar `overscroll-contain` em containers com scroll para evitar que o scroll "vaze" para a página pai.

#### Tipografia e espaçamento mobile

- Títulos de página: `text-xl sm:text-2xl` — nunca `text-2xl` fixo.
- Labels de formulário: `text-sm` — legível sem zoom.
- Texto de apoio/subtítulo: `text-xs sm:text-sm`.
- Padding de cards e seções: `p-4 sm:p-6` — nunca `p-6` fixo.
- Gap entre elementos de lista: `gap-3 sm:gap-4`.

#### Modais e drawers em mobile

- Modais devem ocupar `w-full max-w-sm mx-4` em mobile — nunca `max-w-lg` fixo sem breakpoint.
- Em telas muito pequenas (`< 375px`), modais com muito conteúdo devem ter `overflow-y-auto max-h-[85dvh]`.
- Fechar modal ao clicar no backdrop: `onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}` — padrão já usado no projeto.
- Botão de fechar (X) sempre visível no canto superior direito — `absolute top-4 right-4`.

#### Tabelas e listas de dados

- **Nunca usar `<table>` em mobile sem adaptação.** Preferir cards empilhados em mobile e tabela em `md:`.
  ```tsx
  {/* Mobile: cards */}
  <div className="flex flex-col gap-3 md:hidden">...</div>
  {/* Desktop: tabela */}
  <table className="hidden md:table w-full">...</table>
  ```
- Alternativamente, usar `overflow-x-auto` com `min-w-[600px]` na tabela interna para scroll horizontal controlado.

#### Formulários em mobile

- Campos de formulário em coluna única em mobile, podendo ir para 2 colunas em `sm:grid-cols-2`.
- `<select>` nativo do browser tem melhor UX em mobile do que selects customizados — usar `SearchableSelect` apenas quando busca for necessária.
- Teclado virtual: campos numéricos com `inputMode="numeric"`, telefones com `inputMode="tel"`, datas com `type="date"` (abre picker nativo).
- Scroll da página não deve ser travado desnecessariamente ao abrir dropdowns inline.

#### Navegação e fluxo mobile

- **Botão de voltar** explícito em sub-páginas — não depender só do gesto de swipe do browser.
- **Ações destrutivas** (deletar, arquivar) devem ter confirmação em modal — nunca em linha sem confirmação, especialmente em mobile onde toques acidentais são comuns.
- **FAB (Floating Action Button):** para ações primárias recorrentes (ex: "Nova Ocorrência"), considerar um botão fixo `fixed bottom-20 right-4 md:hidden` acima da bottom nav.

#### Checklist mobile obrigatório antes de entregar

Antes de considerar uma implementação concluída, verificar:

- [ ] Layout funciona em `375px` de largura (iPhone SE) sem scroll horizontal.
- [ ] Nenhum elemento fica atrás da bottom navigation (`pb-24 md:pb-8`).
- [ ] Áreas de toque têm no mínimo `44px`.
- [ ] Modais têm `mx-4` e não encostam nas bordas.
- [ ] Safe area aplicada em elementos fixos (header, footer, drawers).
- [ ] Textos legíveis sem zoom (`text-sm` mínimo para conteúdo, `text-xs` só para metadata).
- [ ] `100dvh` em vez de `100vh` em containers full-height.

---

## FASE 3 — Execução e Revisão

Após aprovação do plano:

1. Alterar **somente** os arquivos listados no plano — sem refatorações não solicitadas.
2. Ao adicionar campo novo ao banco → **sempre** criar a migration em `supabase/migrations/` com `IF NOT EXISTS`.
3. Ao adicionar campo novo à interface `Occurrence`, `Student`, `AppUser` etc. → **atualizar** `lib/data.ts`.
4. Ao mapear campo do banco → **verificar os dois blocos** de fetch em `lib/store.tsx` (`fetchData` e `refreshData`).
5. Após implementar, listar explicitamente o que **não** foi alterado.
6. Toda ação manual exigida do usuário para implantação (como rodar migrações SQL no editor do Supabase, criação de buckets de storage, etc.) **deve ser sempre informada com destaque utilizando alertas visuais** (ex: `> [!IMPORTANT]` ou `> [!WARNING]`) no resultado final apresentado na conversa do chat.

---

## Contexto do Projeto

| Item | Valor |
|---|---|
| Framework | Next.js 14 App Router |
| Auth + Banco | Supabase |
| Estilo | Tailwind CSS |
| Domínio legado | Nenhum (descontinuado) |
| Domínio novo | `sigmilitar.com.br` |
| Estrutura de rotas | `app/[escola]/[pagina]/page.tsx` |
| Resolução de tenant | hostname + pathname slug via `lib/useTenantConfig.ts` |
| Store principal | `lib/store.tsx` — `useAppContext()` |
| Roles existentes | `admin_global`, `GESTOR`, `COORD`, `MONITOR`, `PROFESSOR` |
| Escolas ativas | `eecmheliodoro`, `eecmprofjoaobatista`, `tangara` |

---

## Mapeamento slug ↔ schoolId

| `currentUserSchoolId` | Slug na URL | Nome exibido |
|---|---|---|
| `heliodoro` | `eecmheliodoro` | EECM Heliodoro Capistrano |
| `joaobatista` | `eecmprofjoaobatista` | EECM Prof. João Batista |
| `tangara` | `tangara` | EECM Tangará |

---

*Última atualização: maio 2026 — inclui pilar Mobile UI/UX baseado no código real do projeto.*
