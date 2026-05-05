# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-05  
**Sessão:** Otimização Mobile UX, Correção Duplicação Ocorrências, Impressão Ficha  
**Operador:** Manoel Domingos

## Foco atual

Experiência móvel otimizada com touch targets adequados, navegação fluida e responsividade total.

## Última ação concluída

- **Correção duplicação ocorrências:** Corrigido bug no `addOccurrence` que criava registros duplicados quando Supabase estava conectado (fallback local executava mesmo após insert no banco)
- **Impressão Ficha Disciplinar:** Atualizada para usar o mesmo cabeçalho institucional completo das ocorrências (com logos SEDUC e EECM, rodapé oficial)
- **Otimização Mobile UX completa:**
  - `layout.tsx`: viewport mobile com theme-color dinâmico, PWA-ready, `touch-manipulation`
  - `AppShell.tsx`: touch targets 44px+, drawer mobile mais largo (72/80px), botões acessíveis, safe-area insets
  - `globals.css`: utilitários mobile (safe-area, touch-target, scroll-smooth, btn-mobile, fab, breakpoint xs)
  - Tabelas de ocorrências e alunos: scroll horizontal suave, colunas responsivas ocultas em telas pequenas
  - Modais: sheet-style no mobile (slide-up from bottom), formulários com inputs maiores (py-3 em vez de py-2)
  - `SearchableSelect`: touch targets maiores, texto responsivo, dropdown otimizado

## Próxima ação

- [ ] Concluir integração Google Drive (env vars ainda faltam)
- [ ] Testar experiência mobile em dispositivos reais
- [ ] Validar PWA install prompt se necessário

## Bloqueios

- Aguardando credenciais Google Cloud para finalizar Drive

## Drift Score

`0` (sessão alinhada ao plano)

> Drift score = quantas vezes saímos do plano nesta sessão sem registrar decisão. Resetar a cada sessão nova.

## Planos ativos

Nenhum no momento. Próximo plano nascerá da primeira feature solicitada.

---

## Como atualizar este arquivo

A cada virada de tarefa:
1. Mover "Próxima ação" → "Última ação concluída"
2. Definir nova "Próxima ação"
3. Atualizar data
4. Se algo decidido, anotar em `DECISIONS.md`
