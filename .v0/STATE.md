# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-16  
**Sessão:** Painel de Implantação, KPI Dashboard, Configurador de Painéis com Supabase  
**Operador:** Manoel Domingos

## Foco atual

Persistência 100% no Supabase — localStorage banido do projeto. Toda configuração de usuário é salva no banco.

## Última ação concluída

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
