# Plano de Implementação Unificado — Módulo Gestão Pedagógica (MEG) & Migração para o Supabase

Este documento unifica o planejamento de implementação do módulo **Gestão Pedagógica** (baseado no Modelo de Excelência em Gestão - MEG Educação - SEDUC-MT) com a migração técnica das configurações do `localStorage` (pastas do Google Drive, quadro Canny e notificações) para tabelas centralizadas e sincronizadas no Supabase.

---

## Eixos do MEG & Resultados da Avaliação (2025)

Avaliação realizada pela SEDUC-MT na EECM Prof. João Batista em Junho/2025, com a respectiva pontuação:

| # | Eixo (MEG SEDUC-MT) | ID sistema | Processos | Máx. Proc. | Resultado | Máx. Res. | Total |
|---|---------------------|------------|----------:|----------:|----------:|----------:|------:|
| 1 | Patrimônio Mobiliário e Imobiliário Escolar | `patrimonio` | 35,9 | 75 | 88,0 | 110 | 123,9 |
| 2 | Alimentação Escolar | `lideranca` | 54,4 | 75 | 89,8 | 110 | 144,2 |
| 3 | Limpeza e Organização dos Ambientes | `pedagogico` | 9,4 | 75 | 84,6 | 110 | 94,0 |
| 4 | Manutenção e Conservação da Infraestrutura | `gestao-escolar` | 18,8 | 75 | 91,1 | 110 | 109,9 |
| 5 | Gestão Escolar e Pedagógica | `clima-escolar` | 97,9 | 115 | 140,0 | 160 | 237,9 |
| | **TOTAL** | | **216,4** | **415** | **493,5** | **600** | **709,94** |

---

## User Review Required

> [!IMPORTANT]
> A migração moverá configurações globais (como IDs de pastas do Drive e o quadro de sugestões Canny) do navegador de cada usuário para o banco de dados. Isso permitirá sincronização instantânea entre múltiplos usuários de uma mesma escola e entre dispositivos.

> [!WARNING]
> Será criada uma migration no Supabase para as tabelas `school_settings`, `meg_canny_ideas`, `system_notifications` e `sigmilitar_edit_trackers`. As regras de Row Level Security (RLS) serão configuradas para proteger dados por escola e role.

---

## Proposed Changes

### Banco de Dados (Supabase)

#### [NEW] [0009_meg_enhancements.sql](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/supabase/migrations/0009_meg_enhancements.sql)
Criação das tabelas e políticas de segurança:
1. `school_settings` (ID da pasta do Drive por escola).
2. `meg_canny_ideas` (sugestões compartilhadas de melhorias).
3. `system_notifications` (notificações e atualizações do sino).
4. `sigmilitar_edit_trackers` (contador de edições do usuário para gerar changelog).

### Componentes

#### [MODIFY] [CannyKanbanModal.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/components/meg/CannyKanbanModal.tsx)
- Substituir leitura e gravação no `localStorage` por chamadas do Supabase na tabela `meg_canny_ideas`.
- Sincronização em tempo real das sugestões e votos de todos os usuários.

#### [MODIFY] [AppShell.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/components/AppShell.tsx)
- Substituir o sino de notificações (`NotificationBell`) para ler e salvar notificações, contadores de edições e atualizações na tabela `system_notifications` e `sigmilitar_edit_trackers`.
- Modificar o "Apagar" notificação para adicionar o e-mail do usuário no array `deleted_by`, ocultando-a sem afetar outros usuários.

### Páginas e Fluxos

#### [MODIFY] [page.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/app/%5Bescola%5D/configuracoes/page.tsx)
- Modificar a aba "Status das Integrações" para ler e atualizar as pastas de Google Drive na tabela `school_settings` no Supabase.

#### [MODIFY] [page.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/app/%5Bescola%5D/pedagogico/%5Beixo%5D/%5Bfase%5D/page.tsx)
- Substituir o carregamento do `driveFolderId` do `localStorage` para ler da tabela `school_settings` no Supabase.

#### [MODIFY] [page.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/app/%5Bescola%5D/registro-disciplinar/page.tsx)
- Substituir o carregamento de `drive_folder_id_${resolvedSchoolId}` por consulta ao `school_settings` no Supabase.

---

## Pilares de Qualidade (Fase 2)

### 🔩 Robustez
- **Tratamento de erros:** Todo salvamento de evidência/checklist no Supabase é envolvido por blocos `try/catch` com tratamento visual de erros.
- **Rollback otimista:** Estado local atualiza instantaneamente e restaura o estado original caso a transação no banco falhe.
- **Evitar loops no React:** Dependências corretas nos hooks `useEffect` e controle de requisições assíncronas concorrentes.

### 🔒 Segurança
- **Controle de Role:** `admin_global`, `GESTOR` e `COORD` têm permissão total de escrita. Outras roles operam em modo somente leitura (`readonly`).
- **Row Level Security (RLS):** Garantir que as tabelas de configurações e evidências filtrem dados pelo respectivo tenant/escola.

### ✨ UX / Mobile
- **Estados de carregamento:** Uso de skeletons (`animate-pulse`) enquanto as informações são carregadas do Supabase.
- **Modo responsivo:** Visualização em duas colunas (split view) ou painel lateral (drawer) para Google Drive em telas menores. Safe areas preservadas para notch e bottom navigation.

---

## Verification Plan

### Automated/Manual Tests
1. **Quadro Canny:** Criar e votar em sugestões. Verificar se elas são gravadas no banco de dados e sincronizadas com outros usuários.
2. **Sino de Notificações:** Simular edições do MEG e verificar se o sino dispara a notificação a cada 3 edições, armazenando os contadores em `sigmilitar_edit_trackers`.
3. **Pastas do Google Drive:** Alterar as configurações de pastas do Drive e conferir se elas mudam nas telas correspondentes refletindo o valor do banco.
4. **Verificação de Acesso:** Testar que perfis normais (ex: professor) não conseguem editar ou configurar o Drive.
