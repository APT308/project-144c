# Tasks & Sprints

## Sprint 1 — Database + Project Banner + Demo Data *(Foundation)*
**Goal:** Schema live, seed data visible, dashboard skeleton renders without login.
- [ ] Run migration SQL (all tables, RLS v1 permissive policies)
- [ ] Seed demo project, party details, 3 contract documents, 2 progress claims, 2 WOs
- [ ] Build Project Detail banner component (name, dates, LD, claim totals) — always on top
- [ ] Dashboard shell with 6 module cards (nav links)
- [ ] Supabase Storage buckets created (`contract-documents`, `progress-claims`, `party-details`)
- **Definition of Done:** `/dashboard` loads with seeded project banner and module cards; no login required; all seed rows visible in Supabase table editor.

## Sprint 2 — Core Engine: Contractual Advice (RAG) *(v1 functional start)*
**Goal:** A real question gets a real answer citing a real contract document.
- [ ] Contract document upload form → file stored in bucket → text extracted → embedded via `extract_and_embed`
- [ ] Advice request form → `rag_query` called server-side → answer + clause source displayed
- [ ] Confidence < 0.7 shows "Needs Review" warning banner
- [ ] Answer + source + confidence + review_status persisted to `contractual_advice_requests`
- [ ] Audit log entry written on each advice request
- **Definition of Done:** Upload a PDF clause document; ask "What is the LD rate?"; receive an answer citing the correct clause; row appears in DB with source and confidence.

## Sprint 3 — Progress Claim Comparison
**Goal:** Submitted vs certified gap table renders from real inputs.
- [ ] Progress claim form: period, submitted amount, certified amount, file uploads
- [ ] Gap calculated server-side (submitted − certified); stored in DB
- [ ] Claim comparison table: columns = Period | Submitted | Certified | Gap; gaps highlighted red
- [ ] PDF file links to stored files in bucket
- **Definition of Done:** Enter two claim periods with differing amounts; table shows correct gap; negative gaps highlighted; files downloadable.

## Sprint 4 — Quotation Comparison
**Goal:** Upload 2+ quotes → side-by-side comparison table + recommendation.
- [ ] Multi-file upload for quotations
- [ ] `compare_quotations` tool extracts line items → returns comparison JSON
- [ ] Rendered as side-by-side table; specific differing terms highlighted
- [ ] AI recommendation paragraph shown below table (confidence + review_status displayed)
- [ ] User can override recommendation manually
- **Definition of Done:** Upload 2 real or sample quotation PDFs; comparison table renders with highlighted differences; recommendation shown; rows persisted.

## Sprint 5 — Work Order Generation + Register
**Goal:** Generate a WO with unique number; register auto-updates.
- [ ] WO form: scope, contractor, value, date
- [ ] Server action: reads max WO number → assigns next → inserts `work_order_register` row → calls `draft_work_order`
- [ ] Draft WO displayed for review; user clicks Approve
- [ ] On approval: `work_orders` row saved; register row status = 'issued'; PDF generated and stored
- [ ] WO Register table view: all issued WOs with WO number, contractor, value, status
- **Definition of Done:** Create 2 WOs in sequence; WO numbers are sequential and unique; register shows both; PDF downloadable; WO number cannot be reused (DB unique constraint).

## Sprint 6 — Contractual Letter Drafting
**Goal:** Describe an issue → receive a clause-cited letter draft referencing correct parties.
- [ ] Letter form: issue description, select recipient party
- [ ] `draft_letter` tool pulls party details from DB + RAG over contract docs → drafts letter
- [ ] Draft shown with clause citations highlighted; user edits inline
- [ ] Approve → `contractual_letters` row saved with `draft_review_status = 'approved'`; mark as sent option
- [ ] Audit log on approve and on send
- **Definition of Done:** Describe an EOT issue; letter draft cites correct clause; party name/address pulled from `party_details`; approved letter persists; audit row present.

## Sprint 7 — Lock It Down (Auth + Approved Email Gate) *(Security milestone)*
**Goal:** Only approved emails can access any data.
- [ ] Enable Supabase Auth (email/password)
- [ ] Middleware: on sign-in check `approved_emails` table; reject unapproved
- [ ] Admin UI: add/deactivate approved emails
- [ ] Replace permissive RLS v1 policies with `auth.uid() = user_id` owner-scoped policies
- [ ] All seeded rows get `user_id` assigned to an admin seed user
- [ ] Redirect unauthenticated requests to `/login`; homepage remains `/dashboard` post-login
- **Definition of Done:** Sign in with approved email → access granted. Sign in with unapproved email → rejected. Sign out → dashboard inaccessible. Confirm RLS blocks cross-user reads in Supabase SQL editor.

## Gantt (Sprint → Feature)
```
Sprint 1 | DB schema + banner + seed data
Sprint 2 | Contract document upload + RAG advice          ← v1 functional
Sprint 3 | Progress claim comparison
Sprint 4 | Quotation comparison + recommendation
Sprint 5 | Work order generation + register
Sprint 6 | Contractual letter drafting
Sprint 7 | Auth + approved-email gate + RLS lock-down
```