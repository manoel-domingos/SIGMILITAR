-- Tenant e-mail whitelist for onboarding and tenant-level access control.

begin;

create table if not exists public.tenant_email_whitelist (
  id uuid primary key default gen_random_uuid(),
  tenant text not null,
  school_id text not null references public.schools(id) on delete cascade,
  email text not null,
  role text not null default 'gestor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_email_whitelist_email_lower_check check (email = lower(trim(email))),
  constraint tenant_email_whitelist_tenant_check check (tenant ~ '^[a-z0-9]+$')
);

create unique index if not exists tenant_email_whitelist_tenant_email_uniq
  on public.tenant_email_whitelist (tenant, email);

create unique index if not exists tenant_email_whitelist_school_email_uniq
  on public.tenant_email_whitelist (school_id, email);

create index if not exists tenant_email_whitelist_school_active_idx
  on public.tenant_email_whitelist (school_id)
  where active;

alter table public.tenant_email_whitelist enable row level security;

revoke all on public.tenant_email_whitelist from anon, public;
grant select, insert, update, delete on public.tenant_email_whitelist to authenticated;

drop policy if exists tenant_email_whitelist_select_own_or_school_manage on public.tenant_email_whitelist;
create policy tenant_email_whitelist_select_own_or_school_manage
  on public.tenant_email_whitelist for select
  to authenticated
  using (
    email = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.school_id = tenant_email_whitelist.school_id
        and up.role in ('GESTOR', 'COORD', 'admin_global')
    )
  );

drop policy if exists tenant_email_whitelist_write_school_manage on public.tenant_email_whitelist;
create policy tenant_email_whitelist_write_school_manage
  on public.tenant_email_whitelist for all
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.school_id = tenant_email_whitelist.school_id
        and up.role in ('GESTOR', 'COORD', 'admin_global')
    )
  )
  with check (
    exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.school_id = tenant_email_whitelist.school_id
        and up.role in ('GESTOR', 'COORD', 'admin_global')
    )
  );

commit;
