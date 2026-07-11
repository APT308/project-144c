# Test Plan

## Success Scenario (manual, end-to-end)
1. Open `/dashboard` → Project banner shows name, dates, LD/day, current claim, certified amount
2. Navigate to **Contractual Advice** → upload `conditions_of_contract.pdf` → confirm row in `contract_documents`
3. Ask: *"What is the notice period for extension of time?"* → answer appears within 15 s citing clause number → confidence score shown → row in `contractual_advice_requests`
4. Navigate to **Progress Claims** → enter Period 5: Submitted $500,000 / Certified $420,000 → table shows Gap = −$80,000 highlighted red
5. Navigate to **Quotations** → upload 2 sample quote PDFs → comparison table renders side-by-side → differing line items highlighted → recommendation shown
6. Navigate to **Work Orders** → fill WO form → click Generate → draft shown → click Approve → WO number assigned (e.g. WO-006) → register table shows new row
7. Navigate to **Letters** → enter issue: *"Contractor failed to give EOT notice"* → select recipient: Contractor → draft letter appears citing Clause 23.1 with contractor name/address → Approve
8. Check `audit_logs` in Supabase: rows present for advice request, WO approval, letter approval

## Empty State Tests
- **No contract documents uploaded:** Advice module shows "No contract documents in knowledgebase — please upload first"
- **No progress claims:** Claims table shows "No claims recorded yet — add the first claim"
- **No WOs issued:** Register shows "No work orders issued yet"

## Error State Tests
- Upload non-PDF file → form shows "Only PDF files are accepted"
- AI call fails (simulate by revoking key) → module shows "AI service unavailable — please try again" — no crash
- Submit advice with confidence < 0.7 → "Needs Review" banner shown; answer still displayed but flagged
- Attempt to create WO with duplicate WO number → DB unique constraint triggers; UI shows "WO number already exists"

## Permission Tests (Sprint 7+)
- Unapproved email login → rejected with "Your email is not authorised"
- Approved email → full access
- Sign out → `/dashboard` redirects to `/login`
- Cross-user row read via SQL → returns 0 rows (RLS confirmed)