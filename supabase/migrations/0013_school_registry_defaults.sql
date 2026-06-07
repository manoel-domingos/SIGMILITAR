-- SIGMILITAR school registry defaults
-- Ensures Cloud/staging DBs have the core DRE/school registry and tenant settings.

begin;

create table if not exists public.schools (
  id text primary key,
  name text not null,
  dre_id text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schools
  add column if not exists name text,
  add column if not exists dre_id text,
  add column if not exists active boolean default true,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.schools
set
  name = coalesce(nullif(name, ''), id),
  active = coalesce(active, true),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or name = ''
  or active is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.schools
  alter column name set not null,
  alter column active set default true,
  alter column active set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schools'::regclass
      and contype = 'p'
  ) then
    alter table public.schools add primary key (id);
  end if;
end $$;

create table if not exists public.school_settings (
  school_id text primary key,
  drive_folder_id text,
  default_panel_module text not null default 'civico-militar',
  grades jsonb not null default '[]'::jsonb,
  class_letters jsonb not null default '[]'::jsonb,
  special_years jsonb not null default '[]'::jsonb,
  standalone_classes jsonb not null default '[]'::jsonb,
  logo_config jsonb not null default '{}'::jsonb,
  theme_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint school_settings_default_panel_module_check
    check (default_panel_module in ('civico-militar', 'pedagogico'))
);

alter table public.school_settings
  add column if not exists drive_folder_id text,
  add column if not exists default_panel_module text default 'civico-militar',
  add column if not exists grades jsonb default '[]'::jsonb,
  add column if not exists class_letters jsonb default '[]'::jsonb,
  add column if not exists special_years jsonb default '[]'::jsonb,
  add column if not exists standalone_classes jsonb default '[]'::jsonb,
  add column if not exists logo_config jsonb default '{}'::jsonb,
  add column if not exists theme_config jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by text;

update public.school_settings
set
  default_panel_module = coalesce(default_panel_module, 'civico-militar'),
  grades = coalesce(grades, '[]'::jsonb),
  class_letters = coalesce(class_letters, '[]'::jsonb),
  special_years = coalesce(special_years, '[]'::jsonb),
  standalone_classes = coalesce(standalone_classes, '[]'::jsonb),
  logo_config = coalesce(logo_config, '{}'::jsonb),
  theme_config = coalesce(theme_config, '{}'::jsonb),
  updated_at = coalesce(updated_at, now())
where
  default_panel_module is null
  or grades is null
  or class_letters is null
  or special_years is null
  or standalone_classes is null
  or logo_config is null
  or theme_config is null
  or updated_at is null;

alter table public.school_settings
  alter column default_panel_module set default 'civico-militar',
  alter column default_panel_module set not null,
  alter column grades set default '[]'::jsonb,
  alter column grades set not null,
  alter column class_letters set default '[]'::jsonb,
  alter column class_letters set not null,
  alter column special_years set default '[]'::jsonb,
  alter column special_years set not null,
  alter column standalone_classes set default '[]'::jsonb,
  alter column standalone_classes set not null,
  alter column logo_config set default '{}'::jsonb,
  alter column logo_config set not null,
  alter column theme_config set default '{}'::jsonb,
  alter column theme_config set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.school_settings'::regclass
      and contype = 'p'
  ) then
    alter table public.school_settings add primary key (school_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.school_settings'::regclass
      and conname = 'school_settings_default_panel_module_check'
  ) then
    alter table public.school_settings
      add constraint school_settings_default_panel_module_check
      check (default_panel_module in ('civico-militar', 'pedagogico'));
  end if;
end $$;

insert into public.schools (id, name, dre_id, active, metadata)
values
  ('DRE', 'Diretoria Regional de Educação de Tangará da Serra', null, true, '{"type":"dre"}'::jsonb),
  ('joaobatista', 'EECM Prof. João Batista', 'DRE', true, '{"slug":"eecmprofjoaobatista"}'::jsonb),
  ('heliodoro', 'EECM Heliodoro Capistrano', 'DRE', true, '{"slug":"eecmheliodoro"}'::jsonb),
  ('tangara', 'EECM Tangará da Serra', 'DRE', true, '{"slug":"eecmtangara"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  dre_id = excluded.dre_id,
  active = true,
  metadata = public.schools.metadata || excluded.metadata,
  updated_at = now();

insert into public.school_settings (
  school_id,
  drive_folder_id,
  default_panel_module,
  grades,
  class_letters,
  special_years,
  standalone_classes,
  logo_config,
  theme_config
)
values
  (
    'joaobatista',
    null,
    'civico-militar',
    '["1º Ano", "2º Ano", "3º Ano"]'::jsonb,
    '["A", "B", "C", "D"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{"sidebar":"/schools/joaobatista/nova_logo.svg","dashboard":"/schools/joaobatista/logo_dash.svg","login":"/schools/joaobatista/logo_login.svg"}'::jsonb,
    '{}'::jsonb
  ),
  (
    'heliodoro',
    null,
    'civico-militar',
    '["1º Ano", "2º Ano", "3º Ano"]'::jsonb,
    '["A", "B", "C", "D", "E", "F"]'::jsonb,
    '["PRA"]'::jsonb,
    '["EPT-AUTOMAC", "EPT-EDIFICAC", "EPT-ELETROTEC", "EPT-ELETROT"]'::jsonb,
    '{"sidebar":"/schools/heliodoro/nova_logo.svg","dashboard":"/schools/heliodoro/logo_dash.svg","login":"/schools/heliodoro/logo_login.svg"}'::jsonb,
    '{}'::jsonb
  ),
  (
    'tangara',
    null,
    'civico-militar',
    '["1º Ano", "2º Ano", "3º Ano"]'::jsonb,
    '["A", "B", "C"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{"sidebar":"/schools/tangara/nova_logo.svg","dashboard":"/schools/tangara/logo_dash.svg","login":"/schools/tangara/logo_login.svg"}'::jsonb,
    '{}'::jsonb
  )
on conflict (school_id) do update set
  drive_folder_id = coalesce(public.school_settings.drive_folder_id, excluded.drive_folder_id),
  default_panel_module = coalesce(public.school_settings.default_panel_module, excluded.default_panel_module),
  grades = case when public.school_settings.grades = '[]'::jsonb then excluded.grades else public.school_settings.grades end,
  class_letters = case when public.school_settings.class_letters = '[]'::jsonb then excluded.class_letters else public.school_settings.class_letters end,
  special_years = case when public.school_settings.special_years = '[]'::jsonb then excluded.special_years else public.school_settings.special_years end,
  standalone_classes = case when public.school_settings.standalone_classes = '[]'::jsonb then excluded.standalone_classes else public.school_settings.standalone_classes end,
  logo_config = case when public.school_settings.logo_config = '{}'::jsonb then excluded.logo_config else public.school_settings.logo_config end,
  theme_config = public.school_settings.theme_config || excluded.theme_config,
  updated_at = now();


-- Supabase Storage buckets used by app uploads. Buckets start empty by design.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('student-files', 'student-files', true, 52428800, null),
  ('sigmilitar-assets', 'sigmilitar-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('evidence-files', 'evidence-files', true, 52428800, null),
  ('document-files', 'document-files', true, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Leitura publica de arquivos SIGMILITAR'
  ) then
    create policy "Leitura publica de arquivos SIGMILITAR" on storage.objects
      for select
      using (bucket_id in ('student-files', 'sigmilitar-assets', 'evidence-files', 'document-files'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Uploads autenticados SIGMILITAR'
  ) then
    create policy "Uploads autenticados SIGMILITAR" on storage.objects
      for insert to authenticated
      with check (bucket_id in ('student-files', 'sigmilitar-assets', 'evidence-files', 'document-files'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Atualizacao autenticada SIGMILITAR'
  ) then
    create policy "Atualizacao autenticada SIGMILITAR" on storage.objects
      for update to authenticated
      using (bucket_id in ('student-files', 'sigmilitar-assets', 'evidence-files', 'document-files'))
      with check (bucket_id in ('student-files', 'sigmilitar-assets', 'evidence-files', 'document-files'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Exclusao autenticada SIGMILITAR'
  ) then
    create policy "Exclusao autenticada SIGMILITAR" on storage.objects
      for delete to authenticated
      using (bucket_id in ('student-files', 'sigmilitar-assets', 'evidence-files', 'document-files'));
  end if;
end $$;

alter table public.schools enable row level security;
alter table public.school_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schools'
      and policyname = 'Leitura de escolas autenticadas'
  ) then
    create policy "Leitura de escolas autenticadas" on public.schools
      for select to authenticated
      using (true);
  end if;
end $$;

commit;
