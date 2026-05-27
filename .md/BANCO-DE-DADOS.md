# BANCO-DE-DADOS.md — Estrutura e Regras do Supabase

> Leia antes de: escrever queries, criar migrations, adicionar colunas, alterar tabelas.

---

## 1. Cliente singleton

**Arquivo:** `lib/supabase.ts`
**Import correto:**
```ts
import { supabase } from '@/lib/supabase';
```

Nunca instancie `createClient` diretamente em componentes ou páginas.

---

## 2. Filtro de escola em queries

Toda query que acessa dados de alunos, ocorrências, staff ou usuários **deve** filtrar por `school_id`.

```ts
// Correto
const { data } = await supabase
  .from('occurrences')
  .select('*')
  .eq('school_id', dbSchoolId);   // dbSchoolId vem de getDbSchoolId(tenantId)

// ERRADO — vaza dados de todas as escolas
const { data } = await supabase.from('occurrences').select('*');
```

Exceção: `admin_global` ou queries sem `school_id !== 'DRE'`.

---

## 3. Tabelas principais

| Tabela | Descrição | Chave de isolamento |
|--------|-----------|---------------------|
| `students` | Alunos cadastrados | `school_id` |
| `occurrences` | Ocorrências disciplinares | `school_id` |
| `accidents` | Acidentes registrados | `school_id` |
| `praises` | Elogios | `school_id` |
| `summons` | Convocações | `school_id` |
| `conduct_terms` | Termos de conduta | `school_id` |
| `staff_members` | Monitores, coordenadores | `school_id` |
| `user_profiles` | Usuários do sistema (whitelist) | `school_id` |
| `audit_logs` | Log de auditoria | `school_id` |
| `settings` | Configurações (permissões, regras) | `school_id` |
| `dashboard_panels` | Configuração de painéis do dashboard | `user_id` (por usuário) |
| `schools` | Catálogo de escolas | — |

---

## 4. Coluna `school_id` — valores válidos no banco

| Valor no banco | Slug na URL | Escola |
|----------------|-------------|--------|
| `joaobatista` | `eecmprofjoaobatista` | EECM Prof. João Batista |
| `heliodoro` | `eecmheliodoro` | EECM Heliodoro Capistrano |
| `tangara` | `eecmtangara` | EECM Tangará |
| `DRE` | — | Usuários admin global |

---

## 5. Campo `ataNumber` em `occurrences`

- Sequencial por escola, auto-incrementado no banco
- **Imutável após criação** — representa o número oficial da ata
- Nunca permita edição deste campo no frontend ou em migrations

---

## 6. Campos de professor em `occurrences`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `registered_by` | `text` | Nome de quem registrou a ocorrência |
| `located_by` | `text` | Nome de quem localizou o aluno |
| `linked_professor` | `text` | Professor vinculado explicitamente |

Os três campos são usados no filtro de visibilidade do PROFESSOR.
Se adicionar migration para `linked_professor`, use `ADD COLUMN IF NOT EXISTS` para não quebrar em ambientes que já aplicaram.

---

## 7. Tabela `dashboard_panels`

| Coluna | Tipo | Obs |
|--------|------|-----|
| `user_id` | `text` | E-mail do usuário |
| `panels` | `jsonb` | Array de `PanelConfig` |
| `updated_at` | `timestamp` | Data da última atualização |

- Use `.maybeSingle()` ao buscar — pode não existir registro para novos usuários
- Use `.upsert()` ao salvar — cria ou atualiza

---

## 8. Regras de uso do Supabase

| Situação | Use |
|----------|-----|
| Buscar um registro que pode não existir | `.maybeSingle()` |
| Buscar um registro que DEVE existir | `.single()` |
| Criar ou atualizar | `.upsert()` |
| Deletar com segurança | `.delete().eq('id', id).eq('school_id', dbSchoolId)` |

---

## 9. Migrations

Toda migration deve:
1. Usar `IF NOT EXISTS` para colunas novas (safe para multi-ambiente)
2. Ser registrada no `CHANGELOG.md` com data e descrição
3. Ser testada em ambiente de dev antes de produção

Arquivos de migration ficam na raiz do projeto com prefixo `supabase_`.
