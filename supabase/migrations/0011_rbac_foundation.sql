-- SIGMILITAR RBAC foundation
-- Prepared on 2026-06-05. Do not apply before review in staging/Cloud.
-- This migration creates the authorization model but does not replace existing
-- permissive RLS policies yet.

begin;

create table if not exists public.roles (
  key text primary key,
  name text not null,
  description text,
  scope text not null default 'school',
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_scope_check check (scope in ('global', 'school'))
);

create table if not exists public.permissions (
  key text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

create table if not exists public.user_school_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id text references public.schools(id) on delete cascade,
  role_key text not null references public.roles(key),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_school_memberships_scope_check check (
    (role_key = 'admin_global' and school_id is null)
    or
    (role_key <> 'admin_global' and school_id is not null)
  )
);

create unique index if not exists user_school_memberships_active_uniq
  on public.user_school_memberships (user_id, coalesce(school_id, '__global__'), role_key)
  where active;

create index if not exists user_school_memberships_user_idx
  on public.user_school_memberships (user_id)
  where active;

create index if not exists user_school_memberships_school_idx
  on public.user_school_memberships (school_id)
  where active;

insert into public.roles (key, name, description, scope, priority) values
  ('admin_global', 'Admin global', 'Acesso global a todas as escolas e configuracoes.', 'global', 100),
  ('gestor', 'Gestor', 'Administrador local da escola.', 'school', 80),
  ('coord', 'Coordenador', 'Administrador local com permissoes reduzidas.', 'school', 60),
  ('professor', 'Professor', 'Usuario comum com operacoes escolares basicas.', 'school', 30),
  ('monitor', 'Monitor', 'Usuario comum com operacoes escolares basicas.', 'school', 30)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  scope = excluded.scope,
  priority = excluded.priority,
  updated_at = now();

insert into public.permissions (key, description) values
  ('system.admin', 'Administrar configuracoes globais do sistema.'),
  ('dre.read_all', 'Visualizar dados agregados e escolas sob escopo DRE.'),
  ('schools.read', 'Visualizar escolas.'),
  ('schools.manage', 'Criar e administrar escolas.'),
  ('settings.read', 'Visualizar configuracoes da escola.'),
  ('settings.manage', 'Administrar configuracoes da escola.'),
  ('users.read', 'Visualizar usuarios e perfis da escola.'),
  ('users.manage', 'Criar, atualizar e desativar usuarios da escola.'),
  ('students.read', 'Visualizar alunos da escola.'),
  ('students.create', 'Cadastrar alunos da escola.'),
  ('students.update', 'Atualizar alunos da escola.'),
  ('students.delete', 'Excluir alunos da escola.'),
  ('students.import', 'Importar alunos em lote.'),
  ('occurrences.read', 'Visualizar ocorrencias da escola.'),
  ('occurrences.create', 'Cadastrar ocorrencias da escola.'),
  ('occurrences.update', 'Atualizar ocorrencias da escola.'),
  ('occurrences.delete', 'Excluir ocorrencias da escola.'),
  ('occurrences.resolve', 'Resolver ocorrencias da escola.'),
  ('rules.read', 'Visualizar regras disciplinares.'),
  ('rules.manage', 'Administrar regras disciplinares.'),
  ('staff.read', 'Visualizar equipe da escola.'),
  ('staff.manage', 'Administrar equipe da escola.'),
  ('xerifes.read', 'Visualizar xerifes da escola.'),
  ('xerifes.manage', 'Administrar xerifes da escola.'),
  ('audit_logs.read', 'Visualizar trilha de auditoria da escola.'),
  ('audit_logs.create', 'Registrar trilha de auditoria.'),
  ('reports.read', 'Visualizar relatorios da escola.'),
  ('storage.read', 'Visualizar arquivos autorizados da escola.'),
  ('storage.write', 'Enviar arquivos autorizados da escola.'),
  ('storage.delete', 'Excluir arquivos autorizados da escola.')
on conflict (key) do update set
  description = excluded.description;

insert into public.role_permissions (role_key, permission_key)
select 'admin_global', key from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'gestor', key
from public.permissions
where key in (
  'schools.read',
  'settings.read', 'settings.manage',
  'users.read', 'users.manage',
  'students.read', 'students.create', 'students.update', 'students.delete', 'students.import',
  'occurrences.read', 'occurrences.create', 'occurrences.update', 'occurrences.delete', 'occurrences.resolve',
  'rules.read', 'rules.manage',
  'staff.read', 'staff.manage',
  'xerifes.read', 'xerifes.manage',
  'audit_logs.read', 'audit_logs.create',
  'reports.read',
  'storage.read', 'storage.write', 'storage.delete'
)
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select 'coord', key
from public.permissions
where key in (
  'schools.read',
  'settings.read',
  'users.read',
  'students.read', 'students.create', 'students.update', 'students.import',
  'occurrences.read', 'occurrences.create', 'occurrences.update', 'occurrences.resolve',
  'rules.read',
  'staff.read',
  'xerifes.read', 'xerifes.manage',
  'audit_logs.read', 'audit_logs.create',
  'reports.read',
  'storage.read', 'storage.write'
)
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select role_key, permission_key
from (
  values
    ('professor', 'students.read'),
    ('professor', 'occurrences.read'),
    ('professor', 'occurrences.create'),
    ('professor', 'rules.read'),
    ('professor', 'audit_logs.create'),
    ('professor', 'reports.read'),
    ('professor', 'storage.read'),
    ('professor', 'storage.write'),
    ('monitor', 'students.read'),
    ('monitor', 'occurrences.read'),
    ('monitor', 'occurrences.create'),
    ('monitor', 'rules.read'),
    ('monitor', 'audit_logs.create'),
    ('monitor', 'reports.read'),
    ('monitor', 'storage.read'),
    ('monitor', 'storage.write')
) as p(role_key, permission_key)
on conflict do nothing;

create or replace function public.normalize_sigmilitar_role(input_role text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case lower(coalesce(input_role, ''))
    when 'admin_global' then 'admin_global'
    when 'admin' then 'admin_global'
    when 'gestor' then 'gestor'
    when 'coord' then 'coord'
    when 'coordenador' then 'coord'
    when 'professor' then 'professor'
    when 'monitor' then 'monitor'
    else 'monitor'
  end;
$$;

insert into public.user_school_memberships (user_id, school_id, role_key, active)
select
  up.id,
  case
    when public.normalize_sigmilitar_role(up.role) = 'admin_global' then null
    else up.school_id
  end as school_id,
  public.normalize_sigmilitar_role(up.role) as role_key,
  true
from public.user_profiles up
where exists (
  select 1 from auth.users au where au.id = up.id
)
on conflict do nothing;

create or replace function public.current_user_school_ids()
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(distinct m.school_id) filter (where m.school_id is not null), array[]::text[])
  from public.user_school_memberships m
  where m.user_id = auth.uid()
    and m.active;
$$;

create or replace function public.current_user_is_admin_global()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_school_memberships m
    where m.user_id = auth.uid()
      and m.active
      and m.role_key = 'admin_global'
  )
  or exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and public.normalize_sigmilitar_role(up.role) = 'admin_global'
  );
$$;

create or replace function public.user_has_school_access(target_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.current_user_is_admin_global()
    or exists (
      select 1
      from public.user_school_memberships m
      where m.user_id = auth.uid()
        and m.active
        and m.school_id = target_school_id
    )
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.school_id = target_school_id
    );
$$;

create or replace function public.user_has_permission(target_school_id text, permission text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.current_user_is_admin_global()
    or exists (
      select 1
      from public.user_school_memberships m
      join public.role_permissions rp on rp.role_key = m.role_key
      where m.user_id = auth.uid()
        and m.active
        and m.school_id = target_school_id
        and rp.permission_key = permission
    );
$$;

revoke all on function public.normalize_sigmilitar_role(text) from public;
revoke all on function public.current_user_school_ids() from public;
revoke all on function public.current_user_is_admin_global() from public;
revoke all on function public.user_has_school_access(text) from public;
revoke all on function public.user_has_permission(text, text) from public;

grant execute on function public.normalize_sigmilitar_role(text) to authenticated, service_role;
grant execute on function public.current_user_school_ids() to authenticated, service_role;
grant execute on function public.current_user_is_admin_global() to authenticated, service_role;
grant execute on function public.user_has_school_access(text) to authenticated, service_role;
grant execute on function public.user_has_permission(text, text) to authenticated, service_role;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_school_memberships enable row level security;

create policy "roles_read_authenticated"
  on public.roles for select
  to authenticated
  using (true);

create policy "permissions_read_authenticated"
  on public.permissions for select
  to authenticated
  using (true);

create policy "role_permissions_read_authenticated"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "memberships_read_own_or_admin"
  on public.user_school_memberships for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.read')
  );

create policy "memberships_manage_admin_or_gestor"
  on public.user_school_memberships for all
  to authenticated
  using (
    public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
  )
  with check (
    public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
  );

create index if not exists students_school_id_idx on public.students (school_id);
create index if not exists occurrences_school_id_idx on public.occurrences (school_id);
create index if not exists audit_logs_school_id_idx on public.audit_logs (school_id);
create index if not exists rules_school_id_idx on public.rules (school_id);
create index if not exists xerifes_school_id_idx on public.xerifes (school_id);
create index if not exists staff_members_school_id_idx on public.staff_members (school_id);
create index if not exists user_profiles_school_id_idx on public.user_profiles (school_id);

commit;
