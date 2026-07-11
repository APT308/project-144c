create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  start_date date,
  completion_date date,
  ld_per_day numeric default 0,
  current_claim_amount numeric default 0,
  certified_amount numeric default 0,
  created_at timestamptz not null default now()
);
alter table projects enable row level security;
drop policy if exists "projects_v1_read" on projects;
create policy "projects_v1_read" on projects for select using (true);
drop policy if exists "projects_v1_write" on projects;
create policy "projects_v1_write" on projects for all using (true) with check (true);

create table if not exists party_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  role text not null,
  company_name text,
  address text,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now()
);
alter table party_details enable row level security;
drop policy if exists "party_details_v1_read" on party_details;
create policy "party_details_v1_read" on party_details for select using (true);
drop policy if exists "party_details_v1_write" on party_details;
create policy "party_details_v1_write" on party_details for all using (true) with check (true);

create table if not exists approved_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text unique not null,
  approved_by text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table approved_emails enable row level security;
drop policy if exists "approved_emails_v1_read" on approved_emails;
create policy "approved_emails_v1_read" on approved_emails for select using (true);
drop policy if exists "approved_emails_v1_write" on approved_emails;
create policy "approved_emails_v1_write" on approved_emails for all using (true) with check (true);

create table if not exists contract_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  doc_type text not null,
  file_name text,
  storage_path text,
  parsed_text text,
  created_at timestamptz not null default now()
);
alter table contract_documents enable row level security;
drop policy if exists "contract_documents_v1_read" on contract_documents;
create policy "contract_documents_v1_read" on contract_documents for select using (true);
drop policy if exists "contract_documents_v1_write" on contract_documents;
create policy "contract_documents_v1_write" on contract_documents for all using (true) with check (true);

create table if not exists contractual_advice_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  question text not null,
  answer text,
  answer_source text,
  answer_confidence numeric,
  answer_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table contractual_advice_requests enable row level security;
drop policy if exists "contractual_advice_requests_v1_read" on contractual_advice_requests;
create policy "contractual_advice_requests_v1_read" on contractual_advice_requests for select using (true);
drop policy if exists "contractual_advice_requests_v1_write" on contractual_advice_requests;
create policy "contractual_advice_requests_v1_write" on contractual_advice_requests for all using (true) with check (true);

create table if not exists progress_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  claim_period text not null,
  submitted_amount numeric default 0,
  certified_amount numeric default 0,
  gap_amount numeric generated always as (submitted_amount - certified_amount) stored,
  submitted_file_path text,
  certified_file_path text,
  notes text,
  created_at timestamptz not null default now()
);
alter table progress_claims enable row level security;
drop policy if exists "progress_claims_v1_read" on progress_claims;
create policy "progress_claims_v1_read" on progress_claims for select using (true);
drop policy if exists "progress_claims_v1_write" on progress_claims;
create policy "progress_claims_v1_write" on progress_claims for all using (true) with check (true);

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  description text,
  file_paths text[],
  comparison_output jsonb,
  comparison_source text,
  comparison_confidence numeric,
  comparison_review_status text default 'unreviewed',
  recommendation text,
  recommendation_source text,
  recommendation_confidence numeric,
  recommendation_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table quotations enable row level security;
drop policy if exists "quotations_v1_read" on quotations;
create policy "quotations_v1_read" on quotations for select using (true);
drop policy if exists "quotations_v1_write" on quotations;
create policy "quotations_v1_write" on quotations for all using (true) with check (true);

create table if not exists work_order_register (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  wo_number text unique not null,
  issued_date date,
  issued_to text,
  description text,
  value numeric default 0,
  status text default 'issued',
  created_at timestamptz not null default now()
);
alter table work_order_register enable row level security;
drop policy if exists "work_order_register_v1_read" on work_order_register;
create policy "work_order_register_v1_read" on work_order_register for select using (true);
drop policy if exists "work_order_register_v1_write" on work_order_register;
create policy "work_order_register_v1_write" on work_order_register for all using (true) with check (true);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  register_id uuid references work_order_register(id),
  draft_content text,
  draft_source text,
  draft_confidence numeric,
  draft_review_status text default 'unreviewed',
  approved_at timestamptz,
  pdf_path text,
  created_at timestamptz not null default now()
);
alter table work_orders enable row level security;
drop policy if exists "work_orders_v1_read" on work_orders;
create policy "work_orders_v1_read" on work_orders for select using (true);
drop policy if exists "work_orders_v1_write" on work_orders;
create policy "work_orders_v1_write" on work_orders for all using (true) with check (true);

create table if not exists contractual_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references projects(id),
  issue_description text,
  draft_content text,
  draft_source text,
  draft_confidence numeric,
  draft_review_status text default 'unreviewed',
  recipient_party text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table contractual_letters enable row level security;
drop policy if exists "contractual_letters_v1_read" on contractual_letters;
create policy "contractual_letters_v1_read" on contractual_letters for select using (true);
drop policy if exists "contractual_letters_v1_write" on contractual_letters;
create policy "contractual_letters_v1_write" on contractual_letters for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  object_type text,
  object_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into projects (id, name, start_date, completion_date, ld_per_day, current_claim_amount, certified_amount) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sunway Mixed Development Block A', '2023-06-01', '2025-05-31', 3500, 4200000, 3850000);

insert into party_details (project_id, role, company_name, address, contact_name, contact_email) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'client', 'Sunway Properties Sdn Bhd', 'Level 12, Sunway Tower, Petaling Jaya, Selangor', 'Dato Lim Wei Shen', 'lim.weishen@sunway.com.my'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'architect', 'Arkitek KDN Partnership', '35 Jalan Yap Kwan Seng, Kuala Lumpur', 'Ar. Faridah binti Rashid', 'faridah@arkitekKDN.com'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'QS', 'QS Konsult Sdn Bhd', '8 Jalan Bukit Bintang, Kuala Lumpur', 'Ahmad Hafizuddin', 'hafiz@qskonsult.com'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'contractor', 'Bina Teguh Construction Sdn Bhd', 'Lot 7, Jalan Industri 3, Shah Alam, Selangor', 'Tan Kok Wai', 'kokwai@binateguph.com');

insert into approved_emails (email, approved_by, is_active) values
  ('admin@dept.gov.my', 'System', true),
  ('engineer1@dept.gov.my', 'admin@dept.gov.my', true),
  ('qs@dept.gov.my', 'admin@dept.gov.my', true);

insert into contract_documents (project_id, doc_type, file_name, storage_path, parsed_text) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'conditions_of_contract', 'PAM_Contract_2006.pdf', 'contract-documents/PAM_Contract_2006.pdf', 'Clause 23.1: The Contractor shall within 28 days of the occurrence of any event give written notice to the Architect...'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'BOQ', 'BOQ_BlockA_Rev3.pdf', 'contract-documents/BOQ_BlockA_Rev3.pdf', 'Bill No. 1 — Preliminaries. Bill No. 2 — Substructure. Liquidated Damages: RM 3,500 per day.'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'other', 'Employer_Requirements.pdf', 'contract-documents/Employer_Requirements.pdf', 'Section 4.2: All works shall comply with MS 1722 and local authority requirements.');

insert into progress_claims (project_id, claim_period, submitted_amount, certified_amount, submitted_file_path, certified_file_path) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Month 18 — December 2024', 850000, 720000, 'progress-claims/PC18_submitted.pdf', 'progress-claims/PC18_certified.pdf'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Month 19 — January 2025', 960000, 830000, 'progress-claims/PC19_submitted.pdf', 'progress-claims/PC19_certified.pdf');

insert into work_order_register (project_id, wo_number, issued_date, issued_to, description, value, status) values
  ('a1b2c3d4-0001-0001-0001-000000000001', 'WO-001', '2024-07-10', 'Bina Teguh Construction Sdn Bhd', 'Additional waterproofing to basement B2 slab', 45000, 'issued'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'WO-002', '2024-09-03', 'Bina Teguh Construction Sdn Bhd', 'Variation in façade cladding material — Level 10 to 15', 128000, 'issued'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'WO-003', '2024-11-20', 'Bina Teguh Construction Sdn Bhd', 'Rectification works to car park ramp gradient', 67500, 'issued');