# Security

## Secret Handling
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` stored in Vercel environment variables only
- Never referenced in client components or exposed via API responses
- All AI calls made from Next.js server actions / API routes

## Permission Model
- **v1 (demo):** Permissive RLS policies — all tables readable/writable without login so app is demoable
- **Lock-down sprint:** Supabase Auth enabled; login required; RLS owner-scoped to `auth.uid() = user_id`; `approved_emails` table checked on sign-in (server-side middleware rejects unapproved emails)
- No role is permitted to read another user's rows after lock-down
- Supabase Storage bucket policies mirror table RLS

## Approved-Tool Rule
- Agent may only call the five named tools listed in AGENTIC_LAYER.md
- No `eval`, no dynamic SQL, no shell execution
- Every tool call is scoped to the authenticated user's `project_id`

## Audit Principle
- Every create/update/approve/send action writes to `audit_logs` before returning success
- Audit rows are insert-only; no update or delete permitted (enforced by RLS policy)
- If audit write fails, the parent action is rolled back

## Out of Scope (v1)
- SOC 2 / penetration testing
- Data-at-rest encryption beyond Supabase defaults
- IP allowlisting

> If any of the above security controls are unclear or outside the builder's expertise, stop and engage a qualified security engineer before handling real contract data.