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
--   session checks go through the security-definer RPCs below instead of
--   querying the table directly, so RLS on the table can stay fully closed.
-- * Both security-definer functions pin `search_path` and schema-qualify
--   every reference, per Postgres guidance for SECURITY DEFINER functions
--   (prevents search_path hijacking via objects created in another
--   schema). EXECUTE is revoked from PUBLIC/anon and granted only to
--   authenticated — anonymous requests can't even invoke these.
-- * Email matching is case-insensitive (lower()) on both sides, and
--   approved_emails gets a case-insensitive unique index so two rows
--   can't exist that only differ by case.
-- * This migration seeds exactly ONE approved_emails row — the real
--   admin. No other users are hardcoded here; the admin adds the rest
--   from the Admin page after logging in, since team membership changes
--   over time and shouldn't live in a migration file.

alter table public.approved_emails
  add column if not exists role text not null default 'qs_user';

alter table public.approved_emails
  drop constraint if exists approved_emails_role_check;
alter table public.approved_emails
  add constraint approved_emails_role_check check (role in ('admin', 'qs_user'));

create unique index if not exists approved_emails_email_lower_idx
  on public.approved_emails (lower(email));

-- Clear every placeholder/demo seed row from 0001 (admin@dept.gov.my,
-- engineer1@dept.gov.my, qs@dept.gov.my, etc). The migration seeds exactly
-- one account — everyone else is added later from the Admin page, since
-- the testing team's membership will change over time and shouldn't be
-- hardcoded into a migration file.
delete from public.approved_emails where lower(email) <> lower('fantasticol28@yahoo.com');

-- Real admin account for this deployment.
insert into public.approved_emails (email, approved_by, is_active, role)
values ('fantasticol28@yahoo.com', 'System', true, 'admin')
on conflict (email) do update set is_active = true, role = 'admin';

-- Security-definer RPC: lets any authenticated user look up their OWN
-- approval status/role without needing a direct SELECT grant on
-- approved_emails. Used by middleware (edge-safe, no service-role client
-- needed there) and by Server Components for nav/role gating.
create or replace function public.current_user_profile()
returns table(role text, is_active boolean)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role, is_active
  from public.approved_emails
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1
$$;

revoke all on function public.current_user_profile() from public;
revoke all on function public.current_user_profile() from anon;
grant execute on function public.current_user_profile() to authenticated;

create or replace function public.is_approved_active_user() returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.approved_emails
    where lower(email) = lower(auth.jwt() ->> 'email') and is_active = true
  )
$$;

revoke all on function public.is_approved_active_user() from public;
revoke all on function public.is_approved_active_user() from anon;
grant execute on function public.is_approved_active_user() to authenticated;

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
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_v1_read" on public.%I', t, t);
    execute format('drop policy if exists "%s_v1_write" on public.%I', t, t);
    execute format('drop policy if exists "%s_select_approved" on public.%I', t, t);
    execute format(
      'create policy "%s_select_approved" on public.%I for select using (public.is_approved_active_user())',
      t, t
    );
  end loop;
end $$;

-- approved_emails: fully locked to anon/authenticated. Only the
-- service-role client (Admin page server actions) touches this table.
alter table public.approved_emails enable row level security;
drop policy if exists "approved_emails_v1_read" on public.approved_emails;
drop policy if exists "approved_emails_v1_write" on public.approved_emails;
