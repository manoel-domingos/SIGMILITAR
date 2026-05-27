# PLANEJAMENTO — MÓDULO GESTÃO PEDAGÓGICA (MEG EDUCAÇÃO)

Este documento descreve o planejamento e a implementação do módulo **Gestão Pedagógica**, baseado no Modelo de Excelência em Gestão (MEG Educação - SEDUC-MT) para as escolas do SIGMilitar / EECM.

---

## 🔩 FASE 1 — ANÁLISE E PLANEJAMENTO

### 1. Arquivos Envolvidos e Linhas de Alteração
- **`components/AppShell.tsx`** (~linhas 108–130 e ~linhas 1839–2017)
  - Integração do novo menu lateral para o Módulo Pedagógico quando `activePanelModule === 'pedagogico'`.
  - Refatoração do componente `NotificationBell` para gerenciar notificações e atualizações de forma dinâmica via `localStorage`.
  - Implementação do botão "Marcar como lido" / "Apagar" apenas na aba de Notificações, mantendo as Atualizações visíveis.
- **`lib/store.tsx`** (~linhas 40–120)
  - Mapeamento de novos estados e métodos (se necessário) para sincronizar dados e eventos.
  - Verificação de role e tratamento específico para `admin_global` e outras roles.
- **`supabase/migrations/0004_meg_pedagogico.sql`** [NOVO]
  - Criação das tabelas de banco de dados para os 5 Eixos × 5 Fases, evidências globais e checklist por escola.
  - Configuração de políticas RLS.
- **`lib/meg-data.ts`** [NOVO]
  - Dados estáticos e estruturas tipadas dos 5 Eixos, 5 Fases e das evidências fixas para consulta offline/rápida.
- **`app/[escola]/pedagogico/page.tsx`** [NOVO]
  - Dashboard geral da Gestão Pedagógica com progresso dos eixos.
- **`app/[escola]/pedagogico/[eixo]/page.tsx`** [NOVO]
  - Página de fases pertencentes a um eixo selecionado.
- **`app/[escola]/pedagogico/[eixo]/[fase]/page.tsx`** [NOVO]
  - Visualização detalhada das evidências por fase e preenchimento de status/upload.
- **`components/meg/ProgressBar.tsx`** [NOVO]
  - Componente de barra de progresso estilizada.
- **`components/meg/EixoCard.tsx`** [NOVO]
  - Card responsivo para os eixos no painel pedagógico.
- **`components/meg/EvidenciaItem.tsx`** [NOVO]
  - Item de evidência com checkbox de 3 estados, observações inline e upload de arquivos.

### 2. Mapeamento de Dependências
- **Role Permissions:** `admin_global` possui poder total de visualização e edição ampla em qualquer escola.
- **Tenant Resolution:** Os links dinâmicos no menu lateral utilizam `/[escola]/pedagogico/...` e resolvem dinamicamente a escola ativa.

---

## 💎 FASE 2 — PILARES DE QUALIDADE

### 🔩 Robustez
- **Tratamento de erros:** Todo salvamento de evidência/checklist no Supabase é envolvido por blocos `try/catch` com Toast de erro para falhas de rede.
- **Estado otimista:** Ao alternar o estado de uma evidência ou alterar uma observação, a interface atualiza instantaneamente na tela. Caso a transação do Supabase falhe, o estado anterior é restaurado automaticamente (rollback otimista).
- **Tratamento de nulidades:** Uso de safe nav (`?.`) em todas as leituras de checklist. Se uma evidência não possuir registro no checklist, ela assume o estado padrão `pendente`.
- **Limitação de concorrência:** Bloqueio de múltiplos cliques rápidos nos checkboxes com estados desabilitados durante a requisição assíncrona.

### 🔒 Segurança
- **Acesso admin_global:**
  - `admin_global` possui permissão total de leitura e **edição** em todos os eixos e fases de todas as escolas do contexto.
- **Controle de Role:**
  - `admin_global` e perfis de gestão escolar (`GESTOR`, `COORD`) possuem acesso de edição total.
  - Perfis como `PROFESSOR` e `MONITOR` possuem acesso exclusivamente em modo **somente leitura** (`readonly={true}`).
- **Row Level Security (RLS):**
  - Tabelas no Supabase protegidas por RLS, validando `school_id = auth.jwt() ->> 'school_id'` ou liberando acessos de escrita/leitura totais para o perfil de `admin_global`.

### ✨ UX (Experiência do Usuário)
- **Checkboxes de 3 Estados:**
  - ⬜ **Pendente:** Cinza (`slate-300`)
  - 🟡 **Em andamento:** Âmbar (`amber-500`)
  - ✅ **Concluído:** Esmeralda (`emerald-500`)
  - O clique no checkbox rotaciona o estado linearmente.
- **Transições Suaves:**
  - Barra de progresso animada com transições de largura (`transition-all duration-500 ease-out`).
  - Efeitos de hover e micro-interações táteis nos cards dos eixos.
- **Skeleton Loaders:**
  - Enquanto os dados do Supabase estão sendo buscados, o painel exibe um esqueleto animado (`animate-pulse`) combinando com o tema escuro.

### 📱 Mobile UI & UX
- **Design Adaptativo:** cards empilhados na vertical em telas móveis e grid de 2 a 3 colunas em desktops.
- **Áreas de toque aumentadas:** botões interativos e áreas de checkbox têm no mínimo `44px` de altura e largura.
- **Sem estouro de tela:** uso de viewports dinâmicos (`min-h-[100dvh]`) e paddings inferiores (`pb-24`) para evitar que elementos caiam atrás da barra de navegação móvel padrão do SIGMilitar.

---

## 🔔 NOTIFICAÇÕES E ATUALIZAÇÕES DO SINO

### 1. Contador de Edições no MEG
- A cada edição importante salva no MEG (ex: marcar uma evidência como concluída, alterar um checklist, etc.), enviamos uma chamada que incrementa o contador de edições no `localStorage`.
- Ao completar **3 edições**, o sistema dispara uma rotina:
  1. Cria uma entrada de notificação do sistema ("Nova atualização no MEG").
  2. Adiciona um item na lista de **Atualizações** com um resumo TL;DR dinâmico baseado nos eixos modificados ultimamente (ex: *v1.2.7-MEG: Resumo de conquistas pedagógicas*).
  3. Reseta o contador local para contar as próximas 3 edições.

### 2. Gerenciamento Reativo no AppShell
- O componente `NotificationBell` passa a ler e atualizar seu estado reativamente a partir do `localStorage` (com fallback para os dados estáticos do sistema).
- Adicionamos um botão de **"Marcar como lido" / "Excluir" (lixeira)** em cada linha da aba **Notificações**.
- Quando clicado, a notificação correspondente é apagada/oculta, enquanto as atualizações na aba **Atualizações** permanecem salvas e sempre visíveis para fins de histórico e changelog.

---

## 🚀 FASE 3 — EXECUÇÃO E REVISÃO

### Plano de Testes
1. **Modificar dados no MEG:** Simular 3 atualizações de evidências consecutivas. Verificar se o sino de notificações exibe uma bolinha vermelha e insere o resumo TL;DR.
2. **Excluir Notificação:** Clicar no botão da lixeira na aba de notificações. Confirmar se ela some e a aba de atualizações continua intacta.
3. **Validação de Role (admin_global):** Entrar com a conta de admin global, mudar de escola e fazer edições. Verificar se as alterações são salvas com sucesso para a escola correspondente.
4. **Validação de Role (professor):** Entrar com conta de professor e verificar se os botões e checkboxes estão completamente travados (readonly).
