-- Sprint 7: auth lock-down for a single shared QS-department workspace.
--
-- Design notes (kept simple for v1, extensible later):
-- * approved_emails gains a `role` column ('admin' | 'qs_user'). Free-text
--   check constraint so more roles (project_manager, finance, ...) can be
--   added later with a small migration, not a schema rewrite.
-- * This is a SHARED workspace, not owner-scoped: every approved + active
--   user can read every business row. No company_id/tenant column yet —
--   deliberately deferred until multi-company is actually being built.
-- * All writes already happen through the service-role client in server
--   actions (bypasses RLS). So business tables only need a SELECT policy
--   for approved+active users; no anon/authenticated write policies at all.
-- * approved_emails itself has NO anon/authenticated policies — only the
--   service role (used by the Admin page) can read/write it. Regular
--   session checks go through the security-definer RPC below instead of
--   querying the table directly, so RLS on the table can stay fully closed.

alter table approved_emails
  add column if not exists role text not null default 'qs_user';

alter table approved_emails
  drop constraint if exists approved_emails_role_check;
alter table approved_emails
  add constraint approved_emails_role_check check (role in ('admin', 'qs_user'));

update approved_emails set role = 'admin' where email = 'admin@dept.gov.my';

insert into approved_emails (email, approved_by, is_active, role)
values ('testing@abc.com', 'System', true, 'admin')
on conflict (email) do update set is_active = true, role = 'admin';

-- Security-definer RPC: lets any authenticated user look up their OWN
-- approval status/role without needing a direct SELECT grant on
-- approved_emails. Used by middleware (edge-safe, no service-role client
-- needed there) and by Server Components for nav/role gating.
create or replace function current_user_profile()
returns table(role text, is_active boolean)
language sql
security definer
stable
as $$
  select role, is_active
  from approved_emails
  where email = auth.jwt() ->> 'email'
  limit 1
$$;

grant execute on function current_user_profile() to authenticated;

create or replace function is_approved_active_user() returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from approved_emails
    where email = auth.jwt() ->> 'email' and is_active = true
  )
$$;

-- Replace v1 permissive policies with shared-workspace read access.
-- Writes are intentionally left to the service-role client only.
do $$
declare
  t text;
begin
  foreach t in array array[
    'projects', 'party_details', 'contract_documents',
    'contractual_advice_requests', 'progress_claims', 'quotations',
    'work_order_register', 'work_orders', 'contractual_letters', 'audit_logs'
  ]
  loop
    execute format('drop policy if exists "%s_v1_read" on %I', t, t);
    execute format('drop policy if exists "%s_v1_write" on %I', t, t);
    execute format('drop policy if exists "%s_select_approved" on %I', t, t);
    execute format(
      'create policy "%s_select_approved" on %I for select using (is_approved_active_user())',
      t, t
    );
  end loop;
end $$;

-- approved_emails: fully locked to anon/authenticated. Only the
-- service-role client (Admin page server actions) touches this table.
drop policy if exists "approved_emails_v1_read" on approved_emails;
drop policy if exists "approved_emails_v1_write" on approved_emails;
