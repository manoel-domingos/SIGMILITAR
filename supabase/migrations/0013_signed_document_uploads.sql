-- Signed document upload links via QR Code.
begin;

create table if not exists public.signed_document_uploads (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signed_document_uploads_expiry_check check (expires_at > created_at)
);

create index if not exists signed_document_uploads_school_idx
  on public.signed_document_uploads (school_id);

create index if not exists signed_document_uploads_occurrence_idx
  on public.signed_document_uploads (occurrence_id);

create index if not exists signed_document_uploads_student_idx
  on public.signed_document_uploads (student_id);

create index if not exists signed_document_uploads_pending_idx
  on public.signed_document_uploads (school_id, occurrence_id, expires_at)
  where used_at is null;

create or replace function public.touch_signed_document_uploads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists signed_document_uploads_touch_updated_at on public.signed_document_uploads;
create trigger signed_document_uploads_touch_updated_at
  before update on public.signed_document_uploads
  for each row
  execute function public.touch_signed_document_uploads_updated_at();

alter table public.signed_document_uploads enable row level security;

drop policy if exists signed_document_uploads_select_by_permission on public.signed_document_uploads;
create policy signed_document_uploads_select_by_permission
  on public.signed_document_uploads for select
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.read'));

drop policy if exists signed_document_uploads_insert_by_permission on public.signed_document_uploads;
create policy signed_document_uploads_insert_by_permission
  on public.signed_document_uploads for insert
  to authenticated
  with check (
    public.user_has_permission(school_id, 'occurrences.update')
    or public.user_has_permission(school_id, 'occurrences.create')
  );

drop policy if exists signed_document_uploads_update_by_permission on public.signed_document_uploads;
create policy signed_document_uploads_update_by_permission
  on public.signed_document_uploads for update
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.update'))
  with check (public.user_has_permission(school_id, 'occurrences.update'));

grant select, insert, update on public.signed_document_uploads to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signed-documents',
  'signed-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists signed_documents_read_by_permission on storage.objects;
create policy signed_documents_read_by_permission
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'signed-documents'
    and public.user_has_permission(split_part(name, '/', 1), 'storage.read')
  );

drop policy if exists signed_documents_write_by_permission on storage.objects;
create policy signed_documents_write_by_permission
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'signed-documents'
    and public.user_has_permission(split_part(name, '/', 1), 'storage.write')
  );

commit;
