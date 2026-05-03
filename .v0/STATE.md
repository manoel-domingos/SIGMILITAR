# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-03  
**Sessão:** Correções AI, Pendencias, Regras Supabase  
**Operador:** Manoel Domingos

## Foco atual

Estabilização do sistema: fluxo de ocorrências completo, IA funcional sem corte, pendencias visíveis no painel flutuante.

## Última ação concluída

- `max_tokens` removido da rota DeepSeek — saída agora livre (sem corte)
- Aba "Pendencias" adicionada ao `AIChat.tsx` (painel flutuante real do app) como aba primária com badge de contagem
- Modal pós-salvar com pergunta "Foi cumprida?" implementado
- Multi-select de medidas com auto-seleção de "Acionar os pais" para infrações Média/Grave
- Novos campos `measures`, `resolved`, `resolvedAt` na tabela `occurrences`
- Dados de acidentes zerados (banco antigo → novo `imprdimqcjbndqewioyt`)
- Regra cardinal adicionada em `.v0/rules/development.md`: todo salvamento vai para Supabase, sempre
- v0-OS implantado com estrutura `.v0/` completa
- `INSTRUCTIONS.md` comprimido para caber no campo de 2000 chars

## Próxima ação

- [ ] Concluir integração Google Drive (faltam env vars `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_API_KEY`)
- [ ] Validar fluxo completo: registrar ocorrência → pendencia aparece no painel → marcar cumprida → sair da lista
- [ ] Testar ATA gerada sem corte após remoção do max_tokens

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
