-- SIGMILITAR RLS hardening
-- Prepared on 2026-06-05. Review before applying in Cloud.
-- Depends on 0011_rbac_foundation.sql

begin;

-- Remove broad grants from anonymous/public access.
revoke all on public.students from anon, public;
revoke all on public.occurrences from anon, public;
revoke all on public.audit_logs from anon, public;
revoke all on public.rules from anon, public;
revoke all on public.xerifes from anon, public;
revoke all on public.staff_members from anon, public;
revoke all on public.user_profiles from anon, public;

-- Tighten authenticated grants to only the operations we intend to protect via RLS.
revoke all on public.students from authenticated;
revoke all on public.occurrences from authenticated;
revoke all on public.audit_logs from authenticated;
revoke all on public.rules from authenticated;
revoke all on public.xerifes from authenticated;
revoke all on public.staff_members from authenticated;
revoke all on public.user_profiles from authenticated;

grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.occurrences to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert, update, delete on public.rules to authenticated;
grant select, insert, update, delete on public.xerifes to authenticated;
grant select, insert, update, delete on public.staff_members to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;

-- Drop permissive policies created as broad allow-all rules.
drop policy if exists rls_school_select on public.students;
drop policy if exists rls_school_insert on public.students;
drop policy if exists rls_school_update on public.students;
drop policy if exists rls_school_delete on public.students;

drop policy if exists rls_school_select on public.occurrences;
drop policy if exists rls_school_insert on public.occurrences;
drop policy if exists rls_school_update on public.occurrences;
drop policy if exists rls_school_delete on public.occurrences;

drop policy if exists rls_school_select on public.audit_logs;
drop policy if exists rls_school_insert on public.audit_logs;
drop policy if exists rls_school_update on public.audit_logs;
drop policy if exists rls_school_delete on public.audit_logs;

drop policy if exists rls_school_select on public.rules;
drop policy if exists rls_school_insert on public.rules;
drop policy if exists rls_school_update on public.rules;
drop policy if exists rls_school_delete on public.rules;

drop policy if exists rls_school_select on public.xerifes;
drop policy if exists rls_school_insert on public.xerifes;
drop policy if exists rls_school_update on public.xerifes;
drop policy if exists rls_school_delete on public.xerifes;

drop policy if exists rls_school_select on public.staff_members;
drop policy if exists rls_school_insert on public.staff_members;
drop policy if exists rls_school_update on public.staff_members;
drop policy if exists rls_school_delete on public.staff_members;

drop policy if exists rls_school_select on public.user_profiles;
drop policy if exists rls_school_insert on public.user_profiles;
drop policy if exists rls_school_update on public.user_profiles;
drop policy if exists rls_school_delete on public.user_profiles;

-- Students
create policy students_select_by_permission
  on public.students for select
  to authenticated
  using (public.user_has_permission(school_id, 'students.read'));

create policy students_insert_by_permission
  on public.students for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'students.create'));

create policy students_update_by_permission
  on public.students for update
  to authenticated
  using (public.user_has_permission(school_id, 'students.update'))
  with check (public.user_has_permission(school_id, 'students.update'));

create policy students_delete_by_permission
  on public.students for delete
  to authenticated
  using (public.user_has_permission(school_id, 'students.delete'));

-- Occurrences
create policy occurrences_select_by_permission
  on public.occurrences for select
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.read'));

create policy occurrences_insert_by_permission
  on public.occurrences for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'occurrences.create'));

create policy occurrences_update_by_permission
  on public.occurrences for update
  to authenticated
  using (
    public.user_has_permission(school_id, 'occurrences.update')
    or public.user_has_permission(school_id, 'occurrences.resolve')
  )
  with check (
    public.user_has_permission(school_id, 'occurrences.update')
    or public.user_has_permission(school_id, 'occurrences.resolve')
  );

create policy occurrences_delete_by_permission
  on public.occurrences for delete
  to authenticated
  using (public.user_has_permission(school_id, 'occurrences.delete'));

-- Audit logs
create policy audit_logs_select_by_permission
  on public.audit_logs for select
  to authenticated
  using (public.user_has_permission(school_id, 'audit_logs.read'));

create policy audit_logs_insert_by_permission
  on public.audit_logs for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'audit_logs.create'));

-- Rules
create policy rules_select_by_permission
  on public.rules for select
  to authenticated
  using (public.user_has_permission(school_id, 'rules.read'));

create policy rules_insert_by_permission
  on public.rules for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'rules.manage'));

create policy rules_update_by_permission
  on public.rules for update
  to authenticated
  using (public.user_has_permission(school_id, 'rules.manage'))
  with check (public.user_has_permission(school_id, 'rules.manage'));

create policy rules_delete_by_permission
  on public.rules for delete
  to authenticated
  using (public.user_has_permission(school_id, 'rules.manage'));

-- Xerifes
create policy xerifes_select_by_permission
  on public.xerifes for select
  to authenticated
  using (public.user_has_permission(school_id, 'xerifes.read'));

create policy xerifes_insert_by_permission
  on public.xerifes for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'xerifes.manage'));

create policy xerifes_update_by_permission
  on public.xerifes for update
  to authenticated
  using (public.user_has_permission(school_id, 'xerifes.manage'))
  with check (public.user_has_permission(school_id, 'xerifes.manage'));

create policy xerifes_delete_by_permission
  on public.xerifes for delete
  to authenticated
  using (public.user_has_permission(school_id, 'xerifes.manage'));

-- Staff members
create policy staff_members_select_by_permission
  on public.staff_members for select
  to authenticated
  using (public.user_has_permission(school_id, 'staff.read'));

create policy staff_members_insert_by_permission
  on public.staff_members for insert
  to authenticated
  with check (public.user_has_permission(school_id, 'staff.manage'));

create policy staff_members_update_by_permission
  on public.staff_members for update
  to authenticated
  using (public.user_has_permission(school_id, 'staff.manage'))
  with check (public.user_has_permission(school_id, 'staff.manage'));

create policy staff_members_delete_by_permission
  on public.staff_members for delete
  to authenticated
  using (public.user_has_permission(school_id, 'staff.manage'));

-- User profiles
create policy user_profiles_select_own_or_manage
  on public.user_profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.read')
  );

create policy user_profiles_insert_by_permission
  on public.user_profiles for insert
  to authenticated
  with check (
    public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
  );

create policy user_profiles_update_own_or_manage
  on public.user_profiles for update
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
  )
  with check (
    public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
    or (
      id = auth.uid()
      and school_id = (
        select up.school_id
        from public.user_profiles up
        where up.id = auth.uid()
      )
      and role = (
        select up.role
        from public.user_profiles up
        where up.id = auth.uid()
      )
      and email = (
        select up.email
        from public.user_profiles up
        where up.id = auth.uid()
      )
    )
  );

create policy user_profiles_delete_by_permission
  on public.user_profiles for delete
  to authenticated
  using (
    public.current_user_is_admin_global()
    or public.user_has_permission(school_id, 'users.manage')
  );

commit;
