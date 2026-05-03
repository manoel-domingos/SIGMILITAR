# SCHEMA — Orquestração Caminho B (futuro)

> Quando quisermos dashboard visual em `/admin/v0-os`, executar o SQL abaixo no Supabase. Cada tabela espelha um arquivo markdown desta pasta.

## Princípios da migração

1. Markdowns continuam sendo **fonte de verdade**
2. Tabelas Supabase **espelham** os markdowns (sync bidirecional via API route)
3. Dashboard `/admin/v0-os` lê das tabelas e oferece editor visual
4. Em caso de conflito, **markdown vence** (mais fácil de auditar via git)

## Tabelas planejadas

```sql
-- Espelha .v0/PROJECT.md
create table v0_project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  north_star text,
  stack jsonb,
  domains jsonb,
  constraints jsonb,
  out_of_scope jsonb,
  updated_at timestamptz default now()
);

-- Espelha .v0/STATE.md
create table v0_state (
  id uuid primary key default gen_random_uuid(),
  session_label text,
  operator text,
  current_focus text,
  last_action text,
  next_action text,
  blockers text,
  drift_score int default 0,
  active_plans jsonb,
  updated_at timestamptz default now()
);

-- Espelha .v0/ROADMAP.md
create table v0_roadmap_phases (
  id uuid primary key default gen_random_uuid(),
  phase_number int not null,
  title text not null,
  status text check (status in ('done','in_progress','open')),
  items jsonb,
  position int,
  updated_at timestamptz default now()
);

create table v0_milestones (
  id text primary key, -- M1, M2, etc
  name text not null,
  criterion text,
  status text check (status in ('done','in_progress','open')),
  updated_at timestamptz default now()
);

-- Espelha .v0/DECISIONS.md (append-only)
create table v0_decisions (
  id int generated always as identity primary key,
  number int unique not null,
  title text not null,
  date date not null,
  domain text not null,
  context text,
  options text,
  choice text,
  rationale text,
  tradeoffs text,
  reversible text,
  created_at timestamptz default now()
);

-- Espelha .v0/OPERATOR.md
create table v0_operator (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  preferences jsonb,
  values jsonb,
  vision text,
  updated_at timestamptz default now()
);

-- Espelha .v0/plans/*.md
create table v0_plans (
  id text primary key, -- 0001-titulo-slug
  title text not null,
  status text check (status in ('draft','approved','in_progress','done','abandoned')),
  acceptance_criteria jsonb, -- array de {given, when, then, status}
  tasks jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Espelha .v0/rules/*.md
create table v0_rules (
  domain text primary key, -- development | disciplina | ai
  body_md text not null,
  updated_at timestamptz default now()
);

-- Espelha .v0/psmm/current.md (e histórico)
create table v0_session_memory (
  id int generated always as identity primary key,
  session_label text,
  summary text,
  last_action text,
  decisions_made jsonb,
  drift_score int,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Auditoria de sincronização markdown ↔ db
create table v0_sync_log (
  id int generated always as identity primary key,
  file_path text not null,
  table_name text not null,
  direction text check (direction in ('md_to_db','db_to_md')),
  status text,
  details jsonb,
  created_at timestamptz default now()
);
```

## Plano de ativação

Quando decidir ativar Caminho B:

1. Executar SQL acima no Supabase
2. Criar API route `app/api/v0-os/sync/route.ts` (md ↔ db)
3. Criar página `app/admin/v0-os/page.tsx` com:
   - Card State (current focus, drift)
   - Timeline de Decisions
   - Lista de Plans com checkboxes de AC
   - Editor markdown para Project/Operator
4. Adicionar trigger pré-commit (opcional) para sync automático
5. Atualizar `.v0/INSTRUCTIONS.md` adicionando regra de sync

## Sem migração de dados

Os markdowns têm tudo. O primeiro sync popula as tabelas a partir deles.
