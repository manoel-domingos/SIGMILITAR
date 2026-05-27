# 🛡️ Planejamento Técnico — Evolução do Modal de Seleção de Painel

Este documento detalha a arquitetura, segurança e interface visual (UX) para a reformulação do modal de seleção de contexto escolar, dividindo as interações entre usuários comuns e administradores globais de forma isolada e segura.

---

## 📋 1. Planeje

### 🔍 Diagnóstico e Objetivos
1. **Objetivo Principal:** Redesenhar o modal de seleção de contexto (escola/módulo) para se comportar de forma distinta dependendo da role do usuário:
   * **Fluxo A (Usuários Comuns):** Exibe apenas a escola vinculada de forma não-clicável (com skeleton de carregamento) e disponibiliza as opções de módulos internos: *Gestão Cívico-Militar* e *Gestão Pedagógica*.
   * **Fluxo B (Administrador Global):** Exibe o Painel Geral da DRE e a lista de escolas. Ao clicar em uma escola, ela se expande inline via sanfona (accordion) revelando as opções de módulo correspondentes.
2. **Camada de Estado Global:** Adicionar a propriedade `activePanelModule` ao store (`lib/store.tsx`) para guardar de forma resiliente a escolha do módulo atual (`'civico-militar' | 'pedagogico'`), persistindo essa escolha via `sessionStorage` entre sessões.

---

## 🚀 2. Aperfeiçoe (Os Três Pilares)

### 🛡️ 1. Robustez (Estado e Resiliência)
* **Gestão de Skeletons:** Enquanto as credenciais ou a lista `contextSchools` não estiverem totalmente resolvidas no cliente (`!isAuthRestored`), renderizaremos um layout skeleton cinza animado no lugar do nome da escola, evitando erros de leitura (`undefined`).
* **Ciclo de Vida do Modal:** O estado `expandedSchool` será reiniciado para `null` sempre que o modal for fechado (`setShowContextModal(false)`), garantindo que em um próximo clique o modal inicie limpo e colapsado.
* **Resiliência de Refresh:** O estado `activePanelModule` lerá diretamente o `sessionStorage` na inicialização do store.

### 🔑 2. Segurança Avançada (Isolamento)
* **Filtro de Exibição:** Garantir por validações em código que usuários comuns nunca acessem a listagem de outras escolas ou o botão consolidador da DRE.
* **Validação de ID no Fluxo B:** Antes de redirecionar e setar o contexto ativo de uma escola selecionada pelo administrador global, confirmaremos se a escola escolhida existe na lista validada `contextSchools`.

### 💎 3. UX Premium (Experiência e Animações)
* **Micro-animações de Entrada:** Os botões e sub-módulos entrarão com a animação suave `animate-in slide-in-from-top-1 fade-in duration-150` do Tailwind.
* **Efeito Accordion:** A expansão de módulos sob as escolas para o administrador global usará `transition-all duration-200 overflow-hidden` com rotação de 90 graus do Chevron do indicador.
* **Estilo Distinto:** O cabeçalho da escola do usuário comum no Fluxo A será renderizado com `opacity-90 bg-blue-600 shadow-sm`, conferindo destaque corporativo não-interativo, diferenciando-se dos botões clicáveis.

---

## 📢 3. Apresente

### 🛠️ Modificações Propostas por Arquivo

---

### [Componente] Estado Global (`lib/store.tsx`)

#### 1. Adicionar o Módulo à Interface `AppState`
```typescript
activePanelModule: 'civico-militar' | 'pedagogico';
setActivePanelModule: (module: 'civico-militar' | 'pedagogico') => void;
```

#### 2. Declarar e Inicializar o Estado
```typescript
  const [activePanelModule, setActivePanelModuleState] = useState<'civico-militar' | 'pedagogico'>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('active_panel_module');
      if (stored === 'civico-militar' || stored === 'pedagogico') return stored;
    }
    return 'civico-militar';
  });

  const setActivePanelModule = React.useCallback((module: 'civico-militar' | 'pedagogico') => {
    setActivePanelModuleState(module);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('active_panel_module', module);
    }
  }, []);
```

---

### [Interface] Modal de Seleção Geral (`components/AppShell.tsx`)

#### 1. Reestruturar a Renderização Condicional
Faremos uma divisão estrita no corpo do modal baseada na role do usuário ativo:

```tsx
{currentUserRole !== 'admin_global' ? (
  // ==================== FLUXO A: USUÁRIO COMUM ====================
  <div className="flex flex-col gap-2 pt-1 text-center">
    {!isAuthRestored ? (
      <div className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse text-transparent text-sm">
        Carregando escola...
      </div>
    ) : (
      <div className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 opacity-90 shadow-sm">
        <Building2 className="w-4 h-4" />
        {contextSchools.find(s => s.id === currentUserSchoolId)?.name ?? 'Minha Escola'}
      </div>
    )}

    <button
      onClick={() => handleCommonUserContext('civico-militar')}
      className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in slide-in-from-top-1 fade-in duration-150"
    >
      <ShieldCheck className="w-4 h-4 text-amber-500" /> Gestão Cívico Militar
    </button>

    <button
      onClick={() => handleCommonUserContext('pedagogico')}
      className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in slide-in-from-top-1 fade-in duration-150"
    >
      <BookOpen className="w-4 h-4 text-blue-500" /> Gestão Pedagógica
    </button>
  </div>
) : (
  // ==================== FLUXO B: ADMIN GLOBAL ====================
  <div className="flex flex-col gap-2 pt-1">
    <button
      onClick={() => chooseContext('DRE')}
      className="w-full py-3 rounded-xl bg-[#0052cc] hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
    >
      <Building2 className="w-4 h-4" /> Painel DRE — Visão Consolidada
    </button>
    {contextSchools.map(s => {
      const isExpanded = expandedSchool === s.id;
      return (
        <div key={s.id} className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-200">
          <button
            onClick={() => toggleSchool(s.id)}
            className="w-full py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{s.name}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          
          {isExpanded && (
            <div className="bg-slate-50 dark:bg-slate-950/40 p-2 border-t border-slate-100 dark:border-slate-800 space-y-1 animate-in slide-in-from-top-1 fade-in duration-150">
              <button
                onClick={() => handleAdminSelection(s.id, 'civico-militar')}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Gestão Cívico Militar
              </button>
              <button
                onClick={() => handleAdminSelection(s.id, 'pedagogico')}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Gestão Pedagógica
              </button>
            </div>
          )}
        </div>
      );
    })}
  </div>
)}
```

---

### [Interface] Modal de Seleção da DRE (`app/dre/page.tsx`)

Aplicar a mesma estrutura do **FLUXO B (com accordion expandido)** e limpeza de estados adequada na DRE.

---

### 🧪 Plano de Homologação (Manual)
1. **Teste do Usuário Comum:** Realize login como gestor/coordenador comum. Clique no botão de contexto e verifique se apenas a escola do usuário aparece destacada em azul estático, seguido pelas duas opções de contexto clicáveis de módulos.
2. **Persistência do Módulo:** Clique em *Gestão Pedagógica*, confirme se o redirecionamento ocorre com `/pedagogico` ao final da URL, e se o sessionStorage grava `'pedagogico'`.
3. **Teste do Administrador Global:** Logue como admin. Clique em "Trocar Escola". Verifique se a sanfona de expansão de módulos funciona fluentemente com chevron animado, abrindo os botões de redirecionamento corretos para cada escola.
