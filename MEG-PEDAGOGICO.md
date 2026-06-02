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
- **`lib/meg-data.ts`** [ATUALIZADO em jun/2025]
  - ✅ Adicionados `MegResultadoAnual`, `MEG_RESULTADOS_ANUAIS` e `MEG_TOTAIS_ANUAIS`.
  - ✅ Adicionadas sub-etapas de **Planejamento** e **Execução** nos 5 eixos (baseadas na avaliação MEG SEDUC-MT jun/2025).
  - ✅ Corrigido `maxProcessos` do eixo `clima-escolar` de 100 → **115**.
  - ✅ Interface `MegEvidencia` estendida com `documento`, `codigoPDF` e `resultados`.
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

## 📊 RESULTADOS DA AVALIAÇÃO MEG — 2025

> Avaliação realizada pela SEDUC-MT na EECM Prof. João Batista — jun/2025.
> Dados inseridos em `lib/meg-data.ts` → `MEG_RESULTADOS_ANUAIS` e `MEG_TOTAIS_ANUAIS`.

### Pontuação por Eixo (2025)

| # | Eixo (MEG SEDUC-MT) | ID sistema | Processos | Máx. Proc. | Resultado | Máx. Res. | Total |
|---|---------------------|------------|----------:|----------:|----------:|----------:|------:|
| 1 | Patrimônio Mobiliário e Imobiliário Escolar | `patrimonio` | 35,9 | 75 | 88,0 | 110 | 123,9 |
| 2 | Alimentação Escolar | `lideranca` | 54,4 | 75 | 89,8 | 110 | 144,2 |
| 3 | Limpeza e Organização dos Ambientes Escolares | `pedagogico` | 9,4 | 75 | 84,6 | 110 | 94,0 |
| 4 | Manutenção e Conservação da Infraestrutura Escolar | `gestao-escolar` | 18,8 | 75 | 91,1 | 110 | 109,9 |
| 5 | Gestão Escolar e Pedagógica | `clima-escolar` | 97,9 | 115 | 140,0 | 160 | 237,9 |
| | **TOTAL** | | **216,4** | **415** | **493,5** | **600** | **709,94** |

---

## 📋 SUB-ETAPAS DE PLANEJAMENTO E EXECUÇÃO — 2025

> IDs com sufixo `_meg25_N` foram adicionados em jun/2025.
> Campos novos: `codigoPDF` (nº do critério no formulário SEDUC-MT), `documento` e `resultados[2025]`.

---

### EIXO 1 — Patrimônio Mobiliário e Imobiliário (`patrimonio`)

#### 🗂️ Planejamento

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 1.1.1 | Elaborar Cronograma de Inventário Anual de Bens Móveis e Imóveis | Cronograma para processo de Inventário de Bens Móveis, Imóveis e Desfazimento de Bens Móveis Inservíveis | ❌ Não Possui | 0,00 |
| 1.1.2 | Elaborar Cronograma para Processo de Desfazimento de Bens Inservíveis | Cronograma para processo de Desfazimento de Bens Móveis Inservíveis | ❌ Não Possui | 0,00 |

#### ▶️ Execução

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 1.2.1 | Executar Inventário Anual de Bens Móveis e Inservíveis | Protocolo do processo de Inventário; Planilha de Inventário de Bens Móveis Inservíveis | ✅ Possui | 12,50 |
| 1.2.2 | Executar Levantamento Cadastral Imobiliário | Ficha de Levantamento Cadastral Imobiliário; Termo de Responsabilidade | ✅ Possui | 6,25 |

**Pontuação Processos 2025:** 35,9 / 75 pts

---

### EIXO 2 — Alimentação Escolar (`lideranca`)

#### 🗂️ Planejamento

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 2.1.1 | Disponibilizar Cardápio Impresso e Controle de Estoque | Cardápio 2025; Diário de alimentação servida; Controle de estoque | ✅ Possui | 3,75 |
| 2.1.2 | Fixar Placas Orientativas de Higiene na Cozinha | Placas orientativas | ✅ Possui | 3,75 |
| 2.1.3 | Documentar Registros de Saúde das Merendeiras/AAE | Laudo médico ou Carteira de Saúde das AAE/Nutrição Escolar | ✅ Possui | 3,75 |
| 2.1.4 | Disponibilizar Lista de Fornecedores e Alimentos Licitados | Planilha com fornecedores e marcas de produtos na cozinha | ✅ Possui | 3,75 |
| 2.1.5 | Disponibilizar Uniformes e EPIs às Merendeiras | Termo de recebimento de uniformes para AAE/nutrição | ⚠️ Incompleto | 1,88 |

#### ▶️ Execução

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 2.2.1 | Priorizar Fornecedores da Agricultura Familiar | Notas fiscais da agricultura familiar (semanal ou quinzenal) | ✅ Possui | 6,25 |
| 2.2.2 | Preencher Diário de Alimentação Servida e Controle de Estoque | Diário de alimentação servida e controle de estoque — Lançamentos | ✅ Possui | 6,25 |
| 2.2.3 | Inserir Notas Fiscais no SIGEDUCA/GPO e BB Ágil | Sistema Sigeduca GPO — Prestação de Contas; Manutenção de Despesa e Consumo | ✅ Possui | 18,75 |

**Pontuação Processos 2025:** 54,4 / 75 pts

---

### EIXO 3 — Limpeza e Organização dos Ambientes Escolares (`pedagogico`)

#### 🗂️ Planejamento

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 3.1.1 | Elaborar Cronograma/Escala de Limpeza por Ambiente | Formulário de escala de limpeza (mural); Plano de trabalho; Identificação de ambientes | ❌ Não Possui | 0,00 |
| 3.1.2 | Planejar Materiais de Limpeza e EPIs | Nota fiscal de aquisição dos produtos; Termo de recebimento de EPIs | ⚠️ Incompleto | 0,00 |
| 3.1.3 | Fornecer Protocolo de Limpeza e Orientações Técnicas | Protocolo impresso; Registro de entrega do protocolo de limpeza | ❌ Não Possui | 0,00 |

#### ▶️ Execução

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 3.2.1 | Executar Limpezas Planejadas e Registrar Tarefas | Cronograma de verificação de limpeza conforme protocolo | ❌ Não Possui | 0,00 |
| 3.2.2 | Comunicar Problemas Identificados Durante a Limpeza | Registro de ocorrência | ✅ Possui | 6,25 |
| 3.2.3 | Contratar e Fiscalizar Serviços Terceirizados de Limpeza | Notas fiscais dos serviços contratados | ✅ Possui | 6,25 |

**Pontuação Processos 2025:** 9,4 / 75 pts  
⚠️ **Atenção:** Eixo com maior oportunidade de melhoria em 2026.

---

### EIXO 4 — Manutenção e Conservação da Infraestrutura Escolar (`gestao-escolar`)

#### 🗂️ Planejamento

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 4.1.1 | Elaborar Cronograma de Inspeções Prediais | Cronograma de Inspeções; Ficha de Inspeção | ✅ Possui | 9,38 |
| 4.1.2 | Realizar Inspeções Prediais Conforme Cronograma | Ficha de Inspeção preenchida | ❌ Não Possui | 0,00 |

#### ▶️ Execução

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 4.3.1 | Executar Manutenções Corretivas Registradas | Relatório de verificação com registro fotográfico; Relatório de justificativa de pendências | ✅ Possui | 9,38 |
| 4.3.2 | Acompanhar Levantamento de Demandas das Manutenções | Relatório de Demanda; Checklist de intervenções | ✅ Possui | 9,38 |

**Pontuação Processos 2025:** 18,8 / 75 pts

---

### EIXO 5 — Gestão Escolar e Pedagógica (`clima-escolar`)

> Máximo de processos corrigido: **115 pts** (era 100 — ajustado em jun/2025).

#### 🗂️ Planejamento

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 5.1.1 | Elaborar e/ou Atualizar o Plano de Gestão Escolar | Plano de Gestão | ✅ Possui | 4,17 |
| 5.1.2 | Revisar e/ou Atualizar o PPP | Projeto Político Pedagógico (PPP) | ✅ Possui | 4,17 |
| 5.1.3 | Elaborar Plano Financeiro (PDDE e Recursos) | Plano Financeiro (PDDE) | ⚠️ Incompleto | 2,08 |
| 5.1.4 | Elaborar e/ou Atualizar o Regimento Interno Escolar | Regimento Interno | ✅ Possui | 4,17 |
| 5.1.5 | Constituir o Conselho Deliberativo da Comunidade Escolar (CDE) | Ata registrada no cartório | ✅ Possui | 4,17 |
| 5.1.6 | Implementar Ato Autorizativo da Unidade Escolar | Protocolo do ato autorizativo | ✅ Possui | 4,17 |

#### ▶️ Execução

| Código | Sub-etapa | Documento Exigido | Status 2025 | Nota 2025 |
|--------|-----------|-------------------|:-----------:|----------:|
| 5.2.1 | Operacionalizar Ficha de Comunicação de Aluno Infrequente (Busca Ativa) | Documento de designação do servidor; Registro das ações da busca ativa | ✅ Possui | 5,00 |
| 5.2.2 | Garantir Recomposição da Aprendizagem dos Alunos em Busca Ativa | Plano de recomposição | ✅ Possui | 5,00 |
| 5.2.3 | Identificar Salas e Turmas no Sistema da Equipe Gestora | Salas e turmas identificadas | ✅ Possui | 5,00 |
| 5.2.4 | Realizar Dependências de Alunos com Progressão Parcial | Resultado da avaliação da progressão | ✅ Possui | 5,00 |
| 5.2.5 | Implementar Calendários de Avaliações Externas (SAEB) | Resultados no SAEB publicados | ✅ Possui | 5,00 |

**Pontuação Processos 2025:** 97,9 / 115 pts ⭐ *Melhor eixo da escola*

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

---

## 📌 CHANGELOG

| Data | Versão | Alteração |
|------|--------|-----------|
| jun/2025 | v2.0 | ✅ Sub-etapas de Planejamento e Execução inseridas (5 eixos × avaliação SEDUC-MT) |
| jun/2025 | v2.0 | ✅ Adicionado `MEG_RESULTADOS_ANUAIS` e `MEG_TOTAIS_ANUAIS` com dados 2025 |
| jun/2025 | v2.0 | ✅ Interface `MegEvidencia` estendida: `documento`, `codigoPDF`, `resultados` |
| jun/2025 | v2.0 | ✅ `maxProcessos` de `clima-escolar` corrigido: 100 → 115 |
| jun/2025 | v1.0 | 🚀 Criação inicial do módulo MEG Pedagógico |
