# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) on Vercel
- **Backend/DB:** Supabase (Postgres + Storage + Auth)
- **AI:** OpenAI via server-side API route (key never in client)
- **File Storage:** Supabase Storage buckets (`contract-documents`, `progress-claims`, `party-details`)

## What to Build Now vs Later
**Now:** Project banner, contractual advice (RAG over contract docs), progress claim comparison table, quotation comparison, WO generation + register, letter drafting, approved-email auth.
**Later:** Multi-project support, clause bookmark library, automated claim schedule alerts, mobile layout.

## Key User Action — Generate a Work Order (end-to-end)
1. User fills WO form (scope, contractor, value)
2. Next.js server action reads current max WO number from `work_order_register`
3. New WO number assigned; `work_orders` row inserted; `work_order_register` row appended
4. AI drafts WO body referencing contract clauses (low-risk, auto-draft)
5. User reviews draft → approves → PDF generated and stored
6. Dashboard WO list and register both update instantly
7. Action written to `audit_logs`

## Layer Plan
1. **Data layer first** — Postgres schema, RLS, seed demo rows
2. **App logic** — CRUD forms, file upload, WO number sequencing, gap calculations (pure SQL/code, no AI needed)
3. **Intelligence on top** — RAG contractual advice, letter drafting, quotation recommendation (AI optional; core works without it)

## Core Without AI
Progress claim gap table, WO register, quotation upload/display, and letter template all function as pure data + forms if AI is unavailable.