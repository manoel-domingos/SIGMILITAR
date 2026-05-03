# Plans

Planos ativos e arquivados deste projeto.

## Convenção de nome

`NNNN-titulo-em-kebab-case.md`

- `NNNN` = número sequencial com 4 dígitos (`0001`, `0002`...)
- Use `template.md` como base

## Estados

- `draft` — em redação, ainda não aprovado
- `approved` — aprovado pelo operador, pronto para execução
- `in_progress` — sendo implementado agora
- `done` — concluído, todos AC passaram
- `abandoned` — descartado (anotar razão)

## Boas práticas

1. Cada feature significativa = 1 plano
2. AC (Acceptance Criteria) em formato BDD obrigatório
3. Linkar plano em `STATE.md` enquanto ativo
4. Ao concluir, marcar `done` e atualizar `ROADMAP.md`
