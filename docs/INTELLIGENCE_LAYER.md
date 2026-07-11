# Intelligence Layer

## Messy Inputs
- Unstructured contract PDFs (conditions, BOQ, drawings)
- Free-text contractual questions from team members
- Multiple quotation PDFs with inconsistent formats
- Issue descriptions for letter drafting in plain language

## Auto-Structure Schema (example — contractual advice)
```json
{
  "question": "What is the notice period for extension of time?",
  "retrieved_chunks": [
    { "clause": "Clause 23.1", "text": "The Contractor shall give notice...", "doc": "Conditions of Contract" }
  ],
  "answer": "Under Clause 23.1, the Contractor must give written notice within 28 days...",
  "source": "Conditions of Contract — Clause 23.1",
  "confidence": 0.91,
  "review_status": "unreviewed"
}
```

## Events to Track
- Contract document uploaded → trigger text extraction + embedding
- Contractual advice question submitted → RAG retrieval + answer generation
- Quotations uploaded → comparison + recommendation generation
- WO form submitted → draft WO body generation
- Letter issue described → draft letter generation

## Scoring Rules (rule-based first)
- Confidence = cosine similarity score of top retrieved chunk (0–1)
- If confidence < 0.7 → flag `review_status = 'needs_review'`; show warning banner
- Quotation recommendation: lowest total price + no missing terms = score 1; each missing term −0.1

## v1 vs Later
- **v1:** RAG advice, letter drafting, WO draft, quotation comparison (all server-side, user reviews output)
- **Later:** Clause bookmark library, proactive clause alert on new uploads, confidence trend dashboard