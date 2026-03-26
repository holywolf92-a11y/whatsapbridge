# WhatsApp Deterministic Document Ingestion (CTO Plan)

## Goals
- **Webhook SLA**: acknowledge Meta within ~3 seconds (avoid retries/backpressure).
- **Deterministic intake**: every inbound file becomes an immutable, auditable record.
- **Automated classification + identity extraction**: reuse existing AI verification pipeline.
- **Deterministic candidate binding (identity-first)**:
  - Store raw uploads first **without** binding/creating candidates.
  - Run AI to extract identity, then match deterministically:
    - **CNIC → Passport → Email → Phone (fallback) → Name+DOB → Name+Father → Name**.
  - **Only create candidates after AI extraction**, and only when a strong identity exists (CNIC/passport/email).
  - Conflicts (e.g., CNIC/passport match ≠ phone match) must be **explicitly flagged** for review.
- **No destructive overwrites**: store versions (unique storage paths).

## What exists today (confirmed in code)
- Webhook endpoint: `POST /api/webhooks/whatsapp` in `recruitment-portal-backend/src/routes/whatsapp.ts`.
- Inbox tables: `whatsapp_conversations`, `whatsapp_messages` with realtime enabled.
- Attachment storage + classification: `createAttachment()` in `src/services/inboxAttachmentService.ts` uses `DocumentClassifier` and enqueues `document-linking` for docs.
- Worker infrastructure: BullMQ + Redis, workers started when `RUN_WORKER=true` and `REDIS_URL` set.
- AI verification: `document-verification` worker in `src/workers/documentVerificationWorker.ts` (categorization + identity extraction + CandidateMatcher + audit logs).

## Proposed end-to-end flow (WhatsApp media)
### 1) Webhook: fast ACK (sync)
- Parse message + store:
  - Insert legacy `inbox_messages` row (source=whatsapp) for attachment traceability.
  - Insert `whatsapp_messages` row for the operator inbox.
- If media present: enqueue a job (`whatsapp-media`) containing:
  - `inboxMessageId`, `wamid`, `fromPhone`, `mediaId`, timestamp.
- Return `200` to Meta.

### 2) WhatsApp media worker (async)
- Fetch media metadata + download binary from Meta.
- **Raw-first storage (no binding here)**:
  - Store the binary to a raw audit path (e.g., `whatsapp/raw/<id>/<filename>`).
  - Create an `inbox_attachments` row using `createAttachment()` with `messageSource='whatsapp'` **without `candidate_id`**.
  - `attachment_type='cv'` → enqueue CV parsing.
  - `attachment_kind in ('document','unknown')` → enqueue WhatsApp **attachment pre-verification** (AI identity extraction + deterministic binding).

### 2.5) WhatsApp attachment pre-verification (async)
- Download the raw file from storage.
- Call Python AI categorization/identity extraction.
- Deterministically match candidate using identity-first priority.
  - If strong identity match found: bind to that candidate.
  - If no strong identity match:
    - If strong identity exists: create candidate (needs-review) and bind.
    - Else: do **not** create; place into `unmatched_documents` for manual review.
- **Conflict rule**:
  - If identity-match candidate differs from phone-match candidate, bind by CNIC/passport/email but set `candidate_documents.identity_conflict=true`.
- Copy-not-move:
  - Keep `inbox_attachments.storage_path` pointing to raw.
  - Copy the file into candidate storage path and create `candidate_documents` pointing to the candidate copy.

### 3) Document linking (async)
- `document-linking` worker processes `inbox_attachments`.
- For WhatsApp documents, linking happens **after** pre-verification chooses a candidate.
- Create `candidate_documents` record and enqueue `document-verification` if appropriate.

### 4) AI verification (async)
- `documentVerificationWorker` downloads from storage, calls Python AI endpoint, extracts identity, matches candidate, and writes:
  - `candidate_documents.detected_category`, `confidence`, `extracted_identity_json`, `verification_status`, etc.
  - Full audit trail to `document_verification_logs`.

## Deterministic rules
- **Idempotency**:
  - `whatsapp_messages.meta_message_id` prevents duplicate message insertion.
  - Media-level idempotency: enqueue `whatsapp-media` with deterministic BullMQ `jobId = whatsapp-media:<wamid>:<mediaId>` and enforce DB uniqueness on `(inbox_attachments.whatsapp_wamid, inbox_attachments.whatsapp_media_id)`.
  - `candidate_documents.inbox_attachment_id` is **link-once** (enforce with a unique constraint/index; skip if already linked).
  - Add `candidate_documents.identity_conflict` to flag identity vs phone clashes.
- **Hashing / audit**:
  - Store `inbox_attachments.sha256` for audit and optional dedupe queries (indexable, not necessarily unique).
- **Versioned storage paths**:
  - Candidate storage paths must include timestamps/unique suffixes to prevent overwrite.
- **Never delete originals**:
  - Preserve the initial upload location (raw) and copy into the candidate folder.

## Gaps / follow-ups (recommended)
1. **Explicit WhatsApp candidate fields** (optional but useful):
   - Add `candidates.whatsapp_phone` (or reuse `phone`) and `created_from_channel`.
2. **File-type allowlist + size limits**:
   - Enforce allowed mime types for PDFs/images; reject/flag unknown.
3. **Operational visibility**:
   - Dashboard/endpoint for queue depth + failures (BullMQ metrics).
4. **Backpressure**:
   - Rate limit media jobs per sender + per minute.
5. **Manual review UI**:
   - Surface `verification_status='needs_review'` and `unmatched_documents` clearly in Admin.

## Rollout plan
- Phase 1: Async media ingestion + queue worker + deterministic linking.
- Phase 2: Enforce strict allowlists and add admin review ergonomics.
- Phase 3: Harden idempotency + add alerting/metrics.

## Env requirements
- `RUN_WORKER=true`, `REDIS_URL=...`
- `WHATSAPP_ACCESS_TOKEN=...`
- `WHATSAPP_PHONE_NUMBER_ID=...` (for sending; ingestion can work without it)
- `PYTHON_CV_PARSER_URL`, `PYTHON_HMAC_SECRET` (for AI verification)
