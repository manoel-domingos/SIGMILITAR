# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-04  
**Sessão:** Layout ATA, Perfil Supabase, Assinaturas, Correções SWC  
**Operador:** Manoel Domingos

## Foco atual

Estabilização do documento de ATA (layout, impressão, DOCX) e persistência do perfil do usuário no Supabase.

## Última ação concluída

- Layout ATA migrado para A4 retrato (`210mm x 297mm`) com grid 28/72
- Logo SEDUC trocada para SVG (`/public/logo-seduc-mt.svg`) com coluna 200px
- Barra azul esquerda via `border-left: 2px solid #1a237e` no `body`
- Rodapé fixo (`position: fixed; bottom: 0`) alinhado à direita com dados da escola
- Preview markdown `**negrito**` no campo ATA (abas Editar / Preview)
- Função `markdownBoldToHtml` exportada do `print-header.ts`, aplicada na impressão e no DOCX
- Bloco de assinaturas reformulado: 3 colunas, espaço para assinar, cargo, campo "Nome:"
- Funções `signaturesHTML()` e `signaturesDocxHTML()` centralizadas, usadas em print e export
- Perfil do usuário migrado de `localStorage` para tabela `user_profiles` no Supabase
- Modal de primeiro acesso agora consulta `setup_done` no banco antes de exibir
- Botões "Salvar" e "Pular" gravam `setup_done = true` via upsert
- `registro-disciplinar` lê nome do usuário logado direto do Supabase
- Correções de erros SWC: template literals com acentos substituídos por escapes unicode

## Próxima ação

- [ ] Concluir integração Google Drive (faltam env vars `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_API_KEY`)
- [ ] Validar fluxo completo: registrar ocorrência → pendencia aparece no painel → marcar cumprida → sair da lista
- [ ] Testar ATA gerada sem corte após remoção do max_tokens
- [ ] Verificar se ainda há template literals com acentos em outros arquivos do projeto

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
