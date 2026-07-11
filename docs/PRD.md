# PRD — Construction Project Operations Dashboard

## Problem
The team manages a live construction contract using spreadsheets and chat. Contractual advice, progress claim comparisons, quotation reviews, work order issuance, and formal letters are ad-hoc, error-prone, and not referenced back to contract documents.

## Target Users
Internal department team members (pre-approved emails only). No public access.

## Core Objects
- **Project** — master record with start/end dates, LD rate, current claim/certified totals
- **ContractDocument** — uploaded KB files (conditions of contract, BOQ, etc.)
- **ContractualAdviceRequest** — question + AI answer citing source clauses
- **ProgressClaim** — submitted vs certified figures per claim period with gap analysis
- **Quotation** — uploaded quotes; side-by-side comparison + recommendation
- **WorkOrder** — generated WO with unique WO number, linked to WO register
- **WorkOrderRegister** — running log of all WO numbers issued
- **ContractualLetter** — drafted letter citing clauses, referencing party details
- **PartyDetail** — client, architect, QS, contractor names/addresses
- **ApprovedEmail** — whitelist of permitted logins
- **AuditLog** — every meaningful action

## MVP Must-Haves
- [ ] Project detail banner always visible at dashboard top
- [ ] Contractual advice: ask question → AI answers citing contract docs only
- [ ] Progress claim comparison: input submitted vs certified → gap report
- [ ] Quotation upload and side-by-side comparison with recommendation
- [ ] Work order generation with auto-incremented WO number; register updated
- [ ] Contractual letter drafting citing clauses and party details
- [ ] Approved-email login gate

## Non-Goals (v1)
- Multi-project / multi-tenant support
- Mobile app
- External contractor portal
- Payment processing

## Success Criteria
A team member opens the dashboard, sees project details, asks a contractual question, receives an answer citing the correct contract clause, generates a work order with a new WO number, and the WO register reflects the new entry — all without leaving the browser.