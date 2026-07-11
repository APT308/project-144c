# Agentic Layer

## Risk Classification & Actions

### Low Risk — Auto-execute (no approval needed)
- Extract and embed contract document text on upload
- Generate contractual advice answer (draft shown to user; not sent)
- Generate quotation comparison table and recommendation (shown to user)
- Draft WO body content (shown for review)
- Draft contractual letter content (shown for review)

### Medium Risk — Light approval (user clicks Approve)
- Save approved WO draft → assign WO number → update work_order_register
- Mark progress claim gap as 'reviewed'
- Save finalised letter with clause citations

### High Risk — Always requires explicit approval + confirmation dialog
- Mark a WO as 'issued' and generate PDF
- Mark a letter as 'sent'

### Critical — Human only (no agent)
- Delete contract documents from knowledgebase
- Remove an approved email from whitelist
- Modify WO register historical entries

## Named Tools (server-side only)
- `extract_and_embed(file_path, doc_type)` — parse PDF, chunk, embed, store
- `rag_query(question, project_id)` — retrieve top chunks, generate answer
- `compare_quotations(file_paths[])` — extract line items, build comparison JSON
- `draft_work_order(wo_data, project_id)` — generate WO body referencing clauses
- `draft_letter(issue_text, project_id, recipient_party)` — generate letter citing clauses + party details

## Audit Log Fields
`user_id | action | object_type | object_id | metadata (input snapshot) | created_at`

Every named tool call writes one audit row. No tool runs without a logged user context.