# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-05  
**Sessão:** Faltas Disciplinares, Ocorrências Individuais, Coluna Nº, Horário com Segundos  
**Operador:** Manoel Domingos

## Foco atual

Registro disciplinar com suporte a múltiplos alunos e captura completa de data/hora.

## Última ação concluída

- Lista de faltas disciplinares atualizada para 91 itens conforme regimento oficial: 26 leve + 36 média + 29 grave
- **Ocorrências individuais:** `handleSubmit` agora cria uma ocorrência separada para cada aluno selecionado (antes criava uma com múltiplos `studentIds`)
- **Coluna Nº:** adicionada à esquerda da tabela exibindo o número sequencial (posição + 1) em badge circular
- **Horário com segundos:** input de hora convertido de `type="time"` para texto com validação `HH:MM:SS`, captura automática de segundos ao desfocar, pré-preenchimento usa hora completa
- **Confirmado:** todas as ocorrências anteriores mostravam mesmo horário (07:08) porque foram criadas no mesmo segundo/milissegundo

## Próxima ação

- [ ] Concluir integração Google Drive (env vars ainda faltam)
- [ ] Validar fluxo: múltiplos alunos → criar ocorrências individuais → cada uma com seu Nº sequencial
- [ ] Testar impressão/DOCX com novas colunas

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
