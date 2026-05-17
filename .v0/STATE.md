# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-17  
**Sessão:** DRE login — auth corrigido (aguarda isAuthRestored), cor #2d3184, base_dre no canto direito  
**Operador:** Manoel Domingos

## Foco atual

Sistema multi-tenant ativo. Isolamento por escola via RLS no Postgres. DRE acessa tudo.

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
