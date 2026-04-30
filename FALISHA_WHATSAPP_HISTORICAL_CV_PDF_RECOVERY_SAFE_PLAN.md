# Falisha WhatsApp Historical CV PDF Recovery - Safe Plan for Official Business Number

## Objective

We need a one-time historical recovery of old PDF CV files only from WhatsApp, processed in 3-month batches, without putting the official production WhatsApp number at risk.

This WhatsApp number is the business's official and critical number, so protecting the account is more important than aggressive extraction.

## Non-Negotiable Rule

Do not run unstable historical scraping against the live production WhatsApp session.

The current live bridge is suitable for new inbound messages, but old-history traversal is already failing due to unstable WhatsApp Web internals. Existing errors such as `waitForChatLoading`, `getChat`, `Chat`, execution-context resets, and `TargetCloseError` confirm that the historical replay path is not reliable.

This is a historical migration problem, not a normal live bridge feature.

## Safety Position

We must assume that:

- unofficial WhatsApp automation paths can create account risk,
- WhatsApp explicitly warns that unofficial apps or websites can lead to temporary or permanent bans or restrictions,
- linking an account to unofficial apps or websites can also create ban risk,
- scraping or harvesting style behavior is higher risk than normal real-time message handling.

Because of that, the historical recovery approach must be conservative.

## What We Will Not Do

- We will not perform broad old-chat scraping on the live production session.
- We will not run whole-account history replay through unstable `whatsapp-web.js` browser internals.
- We will not scan all old messages, all media types, or all chats blindly.
- We will not do anything that could destabilize the official business WhatsApp number.

## What We Will Do

We will build a separate historical PDF-CV migration flow with a very narrow scope:

- PDF files only
- likely CVs only
- 3-month batches only
- separate runner or migration worker only
- checkpointed and resumable
- deduplicated
- isolated from the production live inbound bridge

## Architecture

### 1. Keep Production Bridge Strictly for New Messages

The live bridge must continue doing only:

- new inbound message receiving,
- webhook or media handling for fresh messages,
- normal production operations.

Production bridge must not be used for historical backfill runs.

### 2. Treat Historical Recovery as a One-Time Migration

Historical CV extraction must be implemented as a separate migration module, not as part of the normal WhatsApp inbox service.

Two acceptable options exist.

### Preferred Option A - Export/Import Path

Use exported chat data plus attachment files, then import only PDF CV files into Falisha.

This is the safest option because it avoids unstable live history scraping.

### Option B - Separate Controlled Migration Worker

If export/import is not possible, create a separate isolated migration worker with very tight controls:

- batch by 3 months,
- PDF-only,
- allowlisted chats only,
- download caps,
- resumable checkpoints,
- idempotent reruns,
- strict throttling,
- immediate stop on instability.

Never share runtime, process, or browser context with the live production bridge.

## Scope of Historical Recovery

We only want:

- old PDF attachments,
- likely CV or resume PDFs,
- processed in 3-month windows,
- imported into the backend as historical records.

We do not want:

- text messages,
- images,
- voice notes,
- videos,
- all document types,
- full chat replay,
- whole-account scraping.

This reduced scope is important for safety and stability.

## Batch Strategy

Process historical recovery in 3-month windows only.

Examples:

- Jan 1 to Mar 31
- Apr 1 to Jun 30
- Jul 1 to Sep 30
- Oct 1 to Dec 31

For each window:

1. start the migration run,
2. inspect only candidate media records in that date range,
3. keep only PDFs,
4. classify likely CV PDFs,
5. download and store them,
6. dedupe,
7. import into Falisha,
8. checkpoint progress,
9. stop,
10. review output before the next batch.

Do not run multiple large windows in parallel for the same account.

## File Selection Rules

Only consider files where:

- media exists,
- document exists,
- MIME type is `application/pdf`.

Ignore everything else.

After that, apply a CV-likelihood filter.

### First-pass filename filter

Accept as likely CV if the filename contains terms like:

- `cv`
- `resume`
- `biodata`
- `bio data`
- `curriculum vitae`
- `profile`

Matching should be case-insensitive.

### Second-pass content filter

If the filename is unclear:

- extract text from the first 1 to 2 pages,
- detect CV-like content such as name, phone, email, education, experience, skills, passport or CNIC references, summary, or objective.

If confidence is high, mark as CV.

If uncertain, send it to a manual review queue instead of rejecting it permanently.

## Account Safety Rules

This section is critical.

### Absolute rules

- No aggressive scraping.
- No whole-account deep replay.
- No uncontrolled chat traversal.
- No concurrency spikes.
- No repeated reconnect loops.
- No session tampering.
- No browser-runtime hacks on the official number.
- No unofficial automation experiments on the live account.

### Operational limits

- Process only one small batch at a time.
- Use throttling between downloads.
- Use caps per run.
- Stop on repeated fetch failures.
- Stop on session or navigation instability.
- Stop on auth or session abnormality immediately.

### Escalation rule

If a batch shows instability:

- abort the run,
- persist checkpoint,
- do not retry aggressively,
- review manually before resuming.

## Falisha Import Workflow

### Stage 1 - Raw Historical File Capture

For every accepted PDF:

- store the raw file,
- store metadata,
- do not create a candidate immediately unless confidence is high,
- mark source as historical backfill.

Required metadata:

- `source = whatsapp_backfill_pdf`
- `is_historical = true`
- `batch_id`
- `batch_window_start`
- `batch_window_end`
- `chat_id`
- `sender_number`
- `message_timestamp`
- `message_id` if available
- `original_filename`
- `mime_type`
- `sha256_hash`
- `import_status`
- `cv_confidence`
- `candidate_id` nullable
- `review_required` boolean

### Stage 2 - Dedupe Layer

Before importing into candidate folders, check for duplicates using:

- exact file hash,
- same sender plus same filename plus near same timestamp,
- same PDF already imported previously,
- same candidate already has the same document hash.

If duplicate:

- do not re-import,
- mark it as duplicate,
- log the matching document id.

### Stage 3 - Candidate Matching

Only after raw file storage and dedupe:

Match candidate using Falisha identity priority:

- CNIC
- Passport
- Email
- Phone
- Name plus supporting secondary info

If confident match:

- attach document to the candidate record or folder.

If ambiguous:

- send to review queue.

If no match:

- create an unassigned historical document record,
- allow admin assignment later.

### Stage 4 - Existing Ingestion Pipeline

After storing the historical PDF:

- run the existing Falisha document or CV extraction pipeline,
- parse data,
- enrich candidate if match is confirmed,
- never overwrite critical identity fields blindly,
- keep a full audit trail of all changes.

## Technical Runner Requirements

The historical migration runner must support these parameters:

- `start_date`
- `end_date`
- `pdf_only = true`
- `cv_only = true`
- `dry_run = true|false`
- `allowed_chat_ids = []`
- `max_files`
- `max_chats`
- `resume_from_checkpoint`
- `batch_id`
- `stop_on_error_threshold`
- `throttle_ms_between_downloads`

Mandatory behaviors:

- resumable,
- idempotent,
- checkpointed,
- verbose logs,
- safe shutdown,
- duplicate-aware,
- isolated from the production service.

## Checkpointing

The runner must save progress after every successful unit of work.

Checkpoint data should include:

- current batch id,
- current date window,
- last processed chat,
- last processed message timestamp or id,
- imported file count,
- duplicate count,
- review count,
- error count.

This allows clean restart without rescanning everything.

## Admin Review Queue

Some PDFs will not confidently map to a candidate or may not clearly be CVs.

Create a review queue with:

- file preview,
- filename,
- sender number,
- timestamp,
- extracted text snippet,
- CV confidence,
- candidate suggestions,
- action buttons for:
  - attach to candidate,
  - create candidate,
  - mark not CV,
  - ignore,
  - duplicate.

## Logging and Audit

Every historical import must be auditable.

Log:

- batch start and end,
- batch operator,
- batch window,
- files seen,
- files downloaded,
- files imported,
- duplicates skipped,
- review items,
- candidate matches,
- failures.

No destructive operations.

No silent overwrites.

## Fallback Decision Tree

### If export/import is possible

Use it.

This is the safest path.

### If export/import is not possible

Use a separate isolated migration worker with strict throttling and small windows.

### If the migration worker shows instability

Stop immediately and do not continue forcing history traversal on the official number.

## Final Engineering Decision

For Falisha, old WhatsApp CV PDF recovery must be treated as a controlled historical migration, not a live bridge feature.

## Final Implementation Rule

- Production official WhatsApp = live inbound only
- Historical old CV PDFs = separate migration flow only
- Scope = PDF CVs only
- Execution = 3-month batches
- Safety = conservative, throttled, resumable, deduplicated, isolated

## One-Line Instruction For Dev

Build a separate, resumable, PDF-CV-only historical import worker that processes old WhatsApp files in 3-month batches with strict throttling, dedupe, checkpointing, and zero interference with the official production WhatsApp session.

See the phased implementation backlog in `FALISHA_WHATSAPP_HISTORICAL_CV_PDF_RECOVERY_BACKLOG.md`.