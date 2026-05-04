# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-04  
**Sessão:** Correções Build, Sessão Permanente, Assinaturas  
**Operador:** Manoel Domingos

## Foco atual

Estabilização do build e persistência de sessão de autenticação.

## Última ação concluída

- Corrigidos todos os classNames com template literals multilinha para concatenação (compatibilidade SWC Next.js 15)
- Corrigido backtick escapado `\`` que causava "Unterminated template" no template HTML de impressão
- Adicionada função `getLoggedUserName()` faltante no registro-disciplinar
- Corrigido TypeScript narrowing do `supabase` em `AppShell.tsx` (captura em const local após null-check)
- Removidas linhas "Nome:" e pontilhados extras do bloco de assinaturas (signaturesHTML e signaturesDocxHTML)
- **Sessão permanente:** removido timeout de 10 minutos da sessão mock/guest — agora só desloga via logout explícito
- Configuração Supabase auth aprimorada: `storageKey: 'eecm-auth-token'`, `flowType: 'pkce'`

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
