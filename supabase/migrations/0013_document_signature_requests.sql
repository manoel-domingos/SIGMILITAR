-- Assinatura digital simples para documentos de ocorrencia disciplinar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', false, 10485760, array['text/html', 'application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.document_signature_requests (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  document_type text not null default 'termo',
  recipient_name text not null,
  recipient_phone text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  base_storage_path text,
  signed_storage_path text,
  approved_at timestamptz,
  approved_ip inet,
  approved_user_agent text,
  identity_confirmation text,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_signature_requests_status_chk check (status in ('pending', 'approved', 'expired', 'cancelled'))
);

create index if not exists idx_document_signature_requests_school on public.document_signature_requests(school_id);
create index if not exists idx_document_signature_requests_occurrence on public.document_signature_requests(occurrence_id);
create index if not exists idx_document_signature_requests_status on public.document_signature_requests(status);
create index if not exists idx_document_signature_requests_expires on public.document_signature_requests(expires_at);

create or replace function public.set_document_signature_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_document_signature_requests_updated_at on public.document_signature_requests;
create trigger trg_document_signature_requests_updated_at
before update on public.document_signature_requests
for each row execute function public.set_document_signature_requests_updated_at();

alter table public.document_signature_requests enable row level security;

drop policy if exists document_signature_requests_select_by_school on public.document_signature_requests;
create policy document_signature_requests_select_by_school
  on public.document_signature_requests for select
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.read'));

drop policy if exists document_signature_requests_insert_by_school on public.document_signature_requests;
create policy document_signature_requests_insert_by_school
  on public.document_signature_requests for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'occurrences.update'));

drop policy if exists document_signature_requests_update_by_school on public.document_signature_requests;
create policy document_signature_requests_update_by_school
  on public.document_signature_requests for update
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.update'))
  with check (public.user_has_permission(school_id, 'occurrences.update'));

grant select, insert, update on public.document_signature_requests to authenticated;
