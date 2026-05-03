# Rules: disciplina

> Carregar quando trabalhar em alunos, ocorrências, regras, termos, intimações.

## Modelo de dados (resumo)

```
students        — cadastro de alunos
rules           — 91 regras de disciplina (seed inicial)
occurrences     — ocorrências (FK student, FK rule)
conduct_terms   — termos de conduta
summons         — intimações
accidents       — acidentes
praises         — elogios
audit_logs      — todas operações sensíveis
```

## Princípios não-negociáveis

1. **Auditabilidade** — toda operação de criação/edição/exclusão em ocorrências, termos, intimações DEVE gerar entrada em `audit_logs` com:
   - `actor_id` (usuário autenticado)
   - `action` (create/update/delete)
   - `entity` (tabela)
   - `entity_id`
   - `before`/`after` (snapshot JSON)
   - `created_at`

2. **Soft delete preferido** — para ocorrências, termos e intimações, marcar `deleted_at` em vez de DELETE. Hard delete apenas via admin.

3. **RLS** — qualquer leitura de ocorrência exige usuário autenticado. Monitor vê só sua escola.

4. **Exportações** — relatórios XLSX devem ter cabeçalho com data, operador e filtros aplicados.

## Linguagem e UX

- Termos em pt-BR institucional ("ocorrência", "termo de conduta", "intimação")
- Datas no formato `DD/MM/AAAA`
- Hora 24h
- Sempre confirmar exclusões com `AlertDialog`

## IA aplicada à disciplina

Quando IA gerar texto disciplinar (ocorrência, termo):
- Marcar visualmente como "Rascunho gerado por IA — revisar"
- Não enviar dados pessoais sensíveis no prompt além do necessário
- Sempre permitir edição antes de salvar
