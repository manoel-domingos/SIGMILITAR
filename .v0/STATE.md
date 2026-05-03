# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-03  
**Sessão:** Implantação do v0-OS (Caminho A)  
**Operador:** Manoel Domingos

## Foco atual

Implantar o framework de trabalho v0-OS (markdowns + Custom Instructions) para que cada sessão tenha continuidade.

## Última ação concluída

- Criação da estrutura `.v0/` com PROJECT, STATE, ROADMAP, DECISIONS, OPERATOR
- Migração do banco Supabase para `imprdimqcjbndqewioyt` (concluída)
- Configuração da API DeepSeek em `app/api/ai/route.ts`
- Log de tokens adicionado nos chamados à AI

## Próxima ação

- [ ] Colar `.v0/INSTRUCTIONS.md` em v0 Settings → Rules
- [ ] Concluir integração Google Drive (faltam env vars `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_API_KEY`)
- [ ] Validar todos os fluxos no novo banco

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
