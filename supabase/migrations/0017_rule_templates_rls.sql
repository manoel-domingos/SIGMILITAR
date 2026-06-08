-- Habilita RLS no catálogo de regras padrão (apenas leitura para autenticados).
-- discipline_rule_templates é catálogo de referência: leitura liberada a usuários
-- autenticados; escrita apenas via service_role (migrations/provisionamento).

begin;

alter table public.discipline_rule_templates enable row level security;

drop policy if exists discipline_rule_templates_read_authenticated on public.discipline_rule_templates;
create policy discipline_rule_templates_read_authenticated
  on public.discipline_rule_templates for select
  to authenticated
  using (true);

commit;
