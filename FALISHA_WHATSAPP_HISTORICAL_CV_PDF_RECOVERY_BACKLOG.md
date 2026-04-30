# Falisha WhatsApp Historical CV PDF Recovery Backlog

## Purpose

This document turns the safe historical WhatsApp CV PDF recovery plan into a phased implementation backlog for Falisha.

Target outcome:

- The official production WhatsApp number remains protected and continues to handle only new inbound traffic.
- Historical recovery is treated as a one-time migration, not a live bridge feature.
- Only likely CV PDF files are recovered.
- Recovery runs in 3-month windows with checkpoints, dedupe, and auditability.
- The existing Falisha ingestion pipeline remains the system of record after raw historical file capture.

## Delivery Principles

- Protect the official business WhatsApp number first.
- Do not run unstable historical scraping on the live production session.
- Keep the historical recovery flow isolated from the production bridge runtime.
- Prefer export/import over live historical traversal whenever possible.
- Restrict scope to PDF files that are likely CVs.
- Make reruns safe through idempotency and checkpoints.
- Stop immediately on signs of account, auth, or runtime instability.

## Recommended Delivery Order

1. Lock scope and safety rules.
2. Design the batch contract, checkpoint schema, and import metadata.
3. Build the raw historical PDF intake and dedupe layer.
4. Build the operator review queue.
5. Deliver the preferred export/import path.
6. Only if export/import is not viable, build the isolated fallback migration worker.
7. Run a pilot on one 3-month batch.

## Phase 0: Governance and Scope Lock

### Goal

Prevent the team from building a risky or overly broad historical recovery workflow.

### Tasks

1. Freeze scope to historical PDF CV recovery only.
2. Confirm the official production WhatsApp number is excluded from live history scraping.
3. Record non-negotiable safety rules for engineering and operations.
4. Define stop conditions:
   - auth abnormality
   - session instability
   - repeated fetch failures
   - repeated reconnects
   - unexpected volume spikes
5. Decide and document batch ownership and operator approval workflow.
6. Confirm whether export/import is available before building the fallback worker.

### Deliverables

- Approved scope document
- Safety rules
- Stop-condition checklist
- Decision record for preferred and fallback approach

### Acceptance Criteria

- Product, ops, and engineering agree that historical recovery is a migration-only flow.
- The team explicitly accepts that the production bridge is not part of the backfill runner.

### Estimate

- 0.5 to 1 day

## Phase 1: Technical Design and Data Contracts

### Goal

Define the data model, batch model, and processing contracts before implementation.

### Tasks

1. Define the historical file record contract:
   - `source`
   - `is_historical`
   - `batch_id`
   - `batch_window_start`
   - `batch_window_end`
   - `chat_id`
   - `sender_number`
   - `message_timestamp`
   - `message_id`
   - `original_filename`
   - `mime_type`
   - `sha256_hash`
   - `import_status`
   - `cv_confidence`
   - `review_required`
   - nullable `candidate_id`
2. Define batch parameters:
   - `start_date`
   - `end_date`
   - `pdf_only`
   - `cv_only`
   - `dry_run`
   - `allowed_chat_ids`
   - `max_files`
   - `max_chats`
   - `resume_from_checkpoint`
   - `batch_id`
   - `stop_on_error_threshold`
   - `throttle_ms_between_downloads`
3. Define dedupe rules:
   - exact file hash
   - same sender plus same filename plus near same timestamp
   - previously imported identical PDF
   - same candidate already owns same document hash
4. Define review queue fields and actions.
5. Define checkpoint schema and persistence location.
6. Define logging and audit event schema.

### Deliverables

- Historical import contract
- Batch configuration schema
- Checkpoint schema
- Review queue contract
- Audit and logging contract

### Acceptance Criteria

- Engineering can build the importer, review queue, and parser integration independently from one agreed contract.

### Estimate

- 1 to 2 days

## Phase 2: File Selection and CV Detection Layer

### Goal

Build a narrow and deterministic filter so only likely CV PDFs move deeper into the workflow.

### Tasks

1. Enforce file eligibility:
   - media exists
   - document exists
   - MIME type is `application/pdf`
2. Implement filename-based CV heuristics:
   - `cv`
   - `resume`
   - `biodata`
   - `bio data`
   - `curriculum vitae`
   - `profile`
3. Implement first-page and second-page text extraction for unclear filenames.
4. Implement CV-likelihood scoring based on terms like name, phone, email, education, experience, skills, passport, CNIC, summary, or objective.
5. Define low-confidence routing into manual review.
6. Add dry-run reporting for seen files versus accepted files.

### Deliverables

- PDF-only filter
- CV-likelihood scorer
- Manual-review routing rules
- Dry-run classification report

### Acceptance Criteria

- Non-PDF files are excluded before downstream processing.
- Unclear PDFs are reviewable rather than silently dropped.

### Estimate

- 1 to 2 days

## Phase 3: Raw Historical File Capture and Storage

### Goal

Store accepted historical PDFs safely before candidate binding or enrichment.

### Tasks

1. Implement raw historical file storage pathing.
2. Persist metadata for each accepted PDF.
3. Tag files as historical and batch-scoped.
4. Ensure candidate creation is not automatic at this stage unless confidence rules explicitly allow it.
5. Preserve original filename and source metadata for audit.
6. Add import status transitions such as:
   - discovered
   - accepted
   - stored_raw
   - duplicate
   - review_required
   - imported
   - failed

### Deliverables

- Raw file capture module
- Historical metadata persistence
- Import status lifecycle

### Acceptance Criteria

- Historical PDFs can be captured and stored without immediately modifying candidate records.

### Estimate

- 1 to 2 days

## Phase 4: Dedupe and Idempotency Layer

### Goal

Make reruns safe and prevent duplicate imports.

### Tasks

1. Compute and store SHA-256 for every stored historical PDF.
2. Implement duplicate detection using the agreed rules.
3. Mark duplicates without re-importing them.
4. Record duplicate match references for operator review.
5. Ensure reruns from the same batch and checkpoint are idempotent.
6. Add reporting counters for imported, duplicate, review, and failed items.

### Deliverables

- Dedupe service
- Idempotent batch processing behavior
- Duplicate reporting

### Acceptance Criteria

- Re-running the same batch does not create duplicate raw records or candidate documents.

### Estimate

- 1 to 2 days

## Phase 5: Candidate Matching and Review Queue

### Goal

Attach historical PDFs to candidates only when confidence is high, otherwise push them into review.

### Tasks

1. Implement candidate matching priority:
   - CNIC
   - Passport
   - Email
   - Phone
   - Name plus secondary info
2. Define match-confidence thresholds.
3. Route ambiguous items to review instead of auto-binding.
4. Create unassigned historical document records when there is no safe match.
5. Build or adapt the review queue with:
   - file preview
   - filename
   - sender number
   - timestamp
   - extracted text snippet
   - CV confidence
   - candidate suggestions
   - operator actions
6. Record all operator decisions in audit logs.

### Deliverables

- Historical candidate matcher
- Review queue
- Unassigned historical document flow
- Audit trail for manual actions

### Acceptance Criteria

- Ambiguous files are reviewable and do not auto-bind to the wrong candidate.

### Estimate

- 2 to 4 days

## Phase 6: Preferred Track A - Export/Import Pipeline

### Goal

Deliver the safest path for historical recovery using exported chat data and attached files.

### Tasks

1. Define supported export format.
2. Build manifest parser for exported files and metadata.
3. Normalize sender numbers and timestamps from export data.
4. Feed accepted PDFs into the raw historical capture flow.
5. Generate batch reports for import results.
6. Write an operator runbook for preparing exports and launching imports.

### Deliverables

- Export parser
- Manifest importer
- Batch runbook
- Import report format

### Acceptance Criteria

- A prepared export can be imported without touching the live production WhatsApp session.

### Estimate

- 2 to 4 days

## Phase 7: Fallback Track B - Isolated Migration Worker

### Goal

Provide a fallback only if export/import is not possible.

### Tasks

1. Build a separate migration worker isolated from the production bridge.
2. Restrict processing to 3-month windows.
3. Restrict processing to PDF-only and CV-only.
4. Add allowlisted chat support.
5. Add throttling and per-run caps.
6. Add checkpoint persistence after each successful unit of work.
7. Add immediate abort rules for instability.
8. Add dry-run mode.
9. Add verbose batch logs.

### Deliverables

- Isolated historical migration worker
- Throttle and cap controls
- Checkpoint persistence
- Abort-on-instability logic

### Acceptance Criteria

- The worker can process one bounded historical batch without sharing runtime state with the production bridge.
- The worker stops immediately on instability instead of forcing traversal.

### Estimate

- 3 to 5 days

## Phase 8: Pipeline Integration and Auditability

### Goal

Run historical PDFs through the existing Falisha extraction pipeline safely.

### Tasks

1. Pass imported historical PDFs into the existing document or CV extraction pipeline.
2. Preserve audit markers showing historical source and batch origin.
3. Prevent blind overwrite of critical identity fields.
4. Add summary reports for:
   - files seen
   - files accepted
   - files imported
   - duplicates
   - review items
   - failures
5. Validate that historical imports remain distinguishable from live inbound documents.

### Deliverables

- Pipeline integration
- Historical audit markers
- Batch summary report

### Acceptance Criteria

- Historical PDFs can be parsed and audited without being confused with live inbound traffic.

### Estimate

- 1 to 2 days

## Phase 9: Pilot Batch and Operational Handover

### Goal

Validate the approach on one small real batch before continuing quarter by quarter.

### Tasks

1. Select one low-risk 3-month window.
2. Run dry-run mode and review results.
3. Run one controlled production import batch.
4. Review imported files, duplicates, and review-queue items.
5. Verify candidate matching quality.
6. Verify audit completeness.
7. Approve or reject progression to the next 3-month batch.

### Deliverables

- Pilot batch results
- Operator sign-off
- Go or no-go decision for next quarter

### Acceptance Criteria

- One historical batch completes safely with clear reporting and no impact on the live production bridge.

### Estimate

- 1 to 2 days

## Total Estimate

### Preferred path: Export/Import

- Approximately 10.5 to 19 days

### Fallback path: Isolated migration worker

- Approximately 11.5 to 20 days

These estimates assume the current Falisha ingestion and attachment infrastructure can be reused as planned.

## Recommended Milestone Cut

### Milestone 1

- Phases 0 to 2
- Outcome: scope lock, contracts, and CV filter design

### Milestone 2

- Phases 3 to 5
- Outcome: raw capture, dedupe, candidate matching, and review queue

### Milestone 3A

- Phase 6 plus Phase 8
- Outcome: preferred export/import implementation integrated with existing pipeline

### Milestone 3B

- Phase 7 plus Phase 8
- Outcome: fallback isolated migration worker integrated with existing pipeline

### Milestone 4

- Phase 9
- Outcome: first real 3-month pilot batch and operator sign-off