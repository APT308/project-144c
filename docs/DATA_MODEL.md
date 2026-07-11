# Data Model

## projects
| Field | Type |
|---|---|
| id | uuid PK |
| user_id | uuid (nullable) |
| name | text |
| start_date | date |
| completion_date | date |
| ld_per_day | numeric |
| current_claim_amount | numeric |
| certified_amount | numeric |
| created_at | timestamptz |

## contract_documents
| id, user_id, created_at | — |
| project_id | uuid FK projects |
| doc_type | text ('conditions_of_contract','BOQ','drawings','other') |
| file_name | text |
| storage_path | text |
| parsed_text | text (extracted for RAG) |

## approved_emails
| id, user_id, created_at | — |
| email | text unique |
| approved_by | text |
| is_active | boolean default true |

## contractual_advice_requests
| id, user_id, created_at | — |
| project_id | uuid FK |
| question | text |
| answer | text — **AI field** |
| answer_source | text (clause refs) |
| answer_confidence | numeric |
| answer_review_status | text default 'unreviewed' |

## progress_claims
| id, user_id, created_at | — |
| project_id | uuid FK |
| claim_period | text |
| submitted_amount | numeric |
| certified_amount | numeric |
| gap_amount | numeric (computed) |
| submitted_file_path | text |
| certified_file_path | text |
| notes | text |

## quotations
| id, user_id, created_at | — |
| project_id | uuid FK |
| description | text |
| file_paths | text[] |
| comparison_output | jsonb — **AI field** |
| comparison_source | text |
| comparison_confidence | numeric |
| comparison_review_status | text default 'unreviewed' |
| recommendation | text — **AI field** |
| recommendation_source | text |
| recommendation_confidence | numeric |
| recommendation_review_status | text default 'unreviewed' |

## work_order_register
| id, user_id, created_at | — |
| project_id | uuid FK |
| wo_number | text unique |
| issued_date | date |
| issued_to | text |
| description | text |
| value | numeric |
| status | text default 'issued' |

## work_orders
| id, user_id, created_at | — |
| register_id | uuid FK work_order_register |
| project_id | uuid FK |
| draft_content | text — **AI field** |
| draft_source | text |
| draft_confidence | numeric |
| draft_review_status | text default 'unreviewed' |
| approved_at | timestamptz |
| pdf_path | text |

## contractual_letters
| id, user_id, created_at | — |
| project_id | uuid FK |
| issue_description | text |
| draft_content | text — **AI field** |
| draft_source | text (clauses cited) |
| draft_confidence | numeric |
| draft_review_status | text default 'unreviewed' |
| recipient_party | text |
| sent_at | timestamptz |

## party_details
| id, user_id, created_at | — |
| project_id | uuid FK |
| role | text ('client','architect','QS','contractor','consultant') |
| company_name | text |
| address | text |
| contact_name | text |
| contact_email | text |

## audit_logs
| id, created_at | — |
| user_id | uuid |
| action | text |
| object_type | text |
| object_id | uuid |
| metadata | jsonb |

## RLS Notes
- v1: permissive read/write for all tables (demo-first)
- Lock-down sprint: owner-scoped (`auth.uid() = user_id`) + approved_emails check