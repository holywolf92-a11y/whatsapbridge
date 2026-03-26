# WhatsApp Bridge Implementation Backlog

## Purpose

This document turns the WhatsApp Forwarding Bridge assessment into a phased implementation backlog for Falisha.

Target outcome:

- Meta WhatsApp Business API remains the long-term official intake path.
- A controlled bridge supports a small number of legacy business-owned WhatsApp accounts.
- Historical CV recovery is handled through export and import, not live history scraping.
- The existing Falisha CV parsing pipeline remains the system of record.

## Delivery Principles

- Keep automation inbound-only.
- Disable auto-reply by default.
- Avoid bulk outbound behavior.
- Treat whatsapp-web.js as a controlled migration adapter, not the permanent core platform.
- Add source traceability and deduplication from day one.
- Roll out with one account first, then expand only after a stable pilot.

## Current Falisha Alignment

The current backend already has the core ingestion pieces required for this initiative:

- WhatsApp webhook intake route already records inbound messages and enqueues media processing.
- WhatsApp media worker already stores media and queues CV parsing for CV-like files.
- WhatsApp inbox persistence and idempotency logic already exist.

This means the bridge should focus on controlled ingestion and metadata integrity rather than inventing a new parser flow.

## Phase 0: Governance and Scope Lock

### Goal

Prevent the team from building an operationally risky or policy-unsafe version of the bridge.

### Tasks

1. Define bridge policy scope.
2. Confirm which WhatsApp numbers are business-owned and approved for connection.
3. Decide whether the bridge is temporary migration infrastructure or a permanent limited adapter.
4. Write operating rules:
   - inbound-only automation
   - no bulk outbound messaging
   - no personal numbers
   - auto-reply disabled by default
   - no full-history scraping through live sessions
5. Define privacy and retention handling for CV documents.
6. Define stop conditions:
   - repeated disconnects
   - unusual account flags or warnings
   - duplicate spikes
   - repeated forwarding or ingestion failures

### Deliverables

- Operating policy document
- Approved account inventory
- Risk register
- Pilot go and no-go criteria

### Acceptance Criteria

- Product, ops, and engineering all agree on the allowed behavior.
- The team explicitly accepts the limits and risks of whatsapp-web.js.

### Estimate

- 1 to 2 days

## Phase 1: Technical Design and Data Contracts

### Goal

Define the bridge architecture and contracts before implementation begins.

### Tasks

1. Finalize short-term and medium-term ingestion paths:
   - short term: legacy account -> bridge -> Meta number -> existing webhook
   - medium term: legacy account -> bridge -> direct backend ingest endpoint
2. Define canonical bridge metadata:
   - source
   - bridge_account_id
   - session_id
   - original_sender_phone
   - original_sender_name
   - original_message_id
   - original_timestamp
   - file_hash
   - file_size
   - mime_type
   - original_filename
3. Define dedupe rules:
   - primary: bridge_account_id plus original_message_id
   - secondary: file_hash plus original_sender_phone
   - tertiary: short-window duplicate suppression
4. Define supported attachment rules:
   - pdf, doc, docx, jpg, jpeg, png
   - max size 10 MB initially
5. Define retry behavior for download, forward, and ingest failures.
6. Define admin controls:
   - pause account
   - resume account
   - reconnect session
   - disable forwarding
7. Define metrics and logging requirements.

### Deliverables

- Technical design document
- Sequence diagrams
- Bridge to backend data contract
- Dedupe specification

### Acceptance Criteria

- Backend and bridge work can proceed independently from the agreed contract.

### Estimate

- 2 to 3 days

## Phase 2: Bridge Service Skeleton

### Goal

Stand up a separate bridge service with the minimal runtime and operational shape.

### Tasks

1. Create a new module named whatsapp-bridge.
2. Add base project structure:
   - src/index.js
   - src/config/config.js
   - src/services/sessionManager.js
   - src/handlers/messageHandler.js
   - src/handlers/mediaHandler.js
   - src/handlers/cvDetector.js
   - src/services/forwardService.js
   - src/services/dedupeService.js
   - src/services/logService.js
3. Add environment variables for:
   - API destination number
   - max file size
   - allowed file types
   - bridge mode
   - auto reply toggle
   - Redis URL if used
4. Add PM2 process definition.
5. Add health and status endpoints.
6. Add structured logging.
7. Add persistent local session storage.

### Deliverables

- Runnable bridge service
- Environment template
- PM2 config
- Health check endpoints

### Acceptance Criteria

- Service boots cleanly.
- One disabled test client can initialize without processing messages.

### Estimate

- 2 to 3 days

## Phase 3: Session and Multi-Account Management

### Goal

Support multiple approved accounts safely with predictable lifecycle handling.

### Tasks

1. Implement one client instance per approved account.
2. Add QR generation and operator login flow.
3. Persist sessions on disk.
4. Implement reconnect logic after restart.
5. Add session states:
   - needs_qr
   - connecting
   - connected
   - degraded
   - paused
6. Add disconnect reason tracking.
7. Add admin actions:
   - connect
   - pause
   - resume
   - remove session
8. Add per-account concurrency and rate guardrails.

### Deliverables

- Session manager
- Account status view or CLI
- Reconnect handling
- Session lifecycle logs

### Acceptance Criteria

- One test account remains connected across service restart.
- A paused account does not process messages.
- A disconnect does not crash the bridge.

### Estimate

- 3 to 4 days

## Phase 4: Inbound Media Detection and Safe Filtering

### Goal

Accept likely CVs, reject noise, and log every decision path.

### Tasks

1. Listen for inbound messages containing media.
2. Download media with retry.
3. Validate file size.
4. Validate allowed mime types and extensions.
5. Implement CV detection heuristics using:
   - mime type
   - extension
   - filename keywords such as cv, resume, biodata
6. Reject unsupported media types such as video, audio, archives, and executables.
7. Add confidence labels:
   - likely_cv
   - possible_cv
   - not_cv
8. Log decision reason codes for review.
9. Sample false positives for tuning.

### Deliverables

- Media handler
- CV detector
- Validation layer
- Reviewable classification logs

### Acceptance Criteria

- Text-only chat and unsupported files are ignored.
- Common CV document formats are consistently detected.
- Rejections are visible with clear reasons.

### Estimate

- 3 to 4 days

## Phase 5A: Fastest Integration Through Meta Forwarding

### Goal

Get to a working pilot quickly by reusing the current Meta webhook path.

### Tasks

1. Forward accepted media to the Meta API number.
2. Add caption metadata containing:
   - original sender
   - source account
   - received time
   - bridge tag
3. Make sure forwarded files trigger the current webhook and worker flow.
4. Add bridge-specific markers so backend records can distinguish bridged uploads from native Meta uploads.
5. Validate end-to-end parser queueing.

### Deliverables

- Working bridge-to-Meta forwarding flow
- End-to-end validation logs
- Sample successful ingestions

### Acceptance Criteria

- A CV sent to a legacy account reaches Falisha and queues parsing.

### Estimate

- 2 to 3 days

## Phase 5B: Preferred Long-Term Direct Backend Ingest

### Goal

Remove the extra WhatsApp hop and preserve richer metadata.

### Tasks

1. Add a secure backend ingest endpoint for bridge uploads.
2. Reuse current attachment creation and CV queue logic.
3. Store bridge metadata alongside the attachment.
4. Authenticate bridge requests with service credentials.
5. Add idempotency at the API boundary.
6. Preserve original sender details without relying on caption text.

### Deliverables

- Direct bridge ingest endpoint
- Bridge upload client
- Auth and idempotency protection

### Acceptance Criteria

- A bridged CV enters the parser pipeline without needing WhatsApp-to-WhatsApp forwarding.

### Estimate

- 4 to 6 days

## Phase 6: Dedupe, Idempotency, and Candidate Safety

### Goal

Prevent duplicate processing and prevent unrelated candidates from being merged incorrectly.

### Tasks

1. Add bridge-level dedupe storage.
2. Compute SHA-256 for every accepted file.
3. Persist original message ID and source account ID.
4. Apply dedupe before forward or upload.
5. Add backend-side idempotency checks.
6. Add conservative candidate-linking rules for bridged WhatsApp uploads.
7. Protect against retry replays and restart reprocessing.
8. Log duplicate decisions for review.

### Deliverables

- Dedupe service
- Backend uniqueness strategy
- Duplicate metrics
- Review process for uncertain candidate matches

### Acceptance Criteria

- Retry loops do not create duplicate parser jobs.
- One shared sender cannot collapse multiple candidates incorrectly.

### Estimate

- 3 to 5 days

## Phase 7: Historical Backfill Pipeline

### Goal

Recover older CVs through export and import instead of live bridge replay.

### Tasks

1. Define historical intake format:
   - chat export ZIP
   - extracted files
   - manifest CSV
2. Build or adapt extraction scripts.
3. Normalize phone numbers from exports.
4. Compute file hashes for all historical files.
5. Bulk upload historical files directly to the backend.
6. Mark imported records with a dedicated source value such as whatsapp_old.
7. Deduplicate against live bridge and existing stored attachments.
8. Add progress tracking and failure reporting.
9. Create an operator runbook for batch imports.

### Deliverables

- Export and import pipeline
- Manifest schema
- Backfill runbook
- Duplicate report

### Acceptance Criteria

- Old exports can be processed without going through live bridge sessions.
- Re-runs are safe and idempotent.

### Estimate

- 4 to 6 days

## Phase 8: Operations, Monitoring, and Pilot Rollout

### Goal

Run the bridge safely in production and expand only after measurable stability.

### Tasks

1. Deploy the bridge to a stable server.
2. Add PM2 restart policy.
3. Add monitoring for:
   - per-account connectivity
   - messages seen
   - files accepted
   - files rejected
   - forward or upload success
   - retries
   - duplicates
4. Add alerting for:
   - disconnect spikes
   - ingest failures
   - parser backlog growth
5. Add account-level pause switch.
6. Add daily health review.
7. Run a one-account pilot for 7 to 10 days.
8. Review false positives, duplicate rates, and parser outcomes.
9. Expand to a second account only after passing pilot thresholds.

### Deliverables

- Production deployment
- Monitoring and alerts
- Pilot report
- Rollout decision memo

### Acceptance Criteria

- Pilot is stable.
- Duplicate rate remains low.
- No spam-like outbound behavior is introduced.
- Team can pause an account immediately.

### Estimate

- 1 week for pilot, then staged expansion

## Priority Breakdown

### P0

- Governance rules
- Session stability
- Attachment validation
- End-to-end ingest
- Dedupe and idempotency
- Pause and kill switch

### P1

- Direct backend ingest endpoint
- Monitoring and alerting
- Historical import tooling
- Admin status controls

### P2

- Optional receipt-style auto-reply
- AI-assisted CV detection improvements
- Richer dashboard
- Redis-backed scaling

## Suggested Sprint Sequence

### Sprint 1

1. Phase 0
2. Phase 1
3. Phase 2

### Sprint 2

1. Phase 3
2. Phase 4
3. Phase 5A

### Sprint 3

1. Phase 6
2. Phase 8 pilot start

### Sprint 4

1. Phase 5B
2. Phase 7
3. Phase 8 rollout expansion

## Recommended Team Split

### Backend

- Bridge ingest endpoint
- Attachment metadata model
- Dedupe and idempotency
- Parser queue integration
- Audit and reporting support

### Bridge Service

- Session manager
- Media download and validation
- CV detection
- Forward and upload services
- Account control handling

### Ops

- Server provisioning
- PM2 setup
- Secrets management
- Alerting and recovery

### Product and Operations

- Approved account list
- Operating SOP
- Pilot review process
- Exception handling process

## Definition of Done

The initiative is complete when all of the following are true:

1. One approved legacy WhatsApp account can receive a CV.
2. The bridge processes it exactly once.
3. Falisha stores it with full source traceability.
4. The parser queues and completes successfully.
5. Duplicates are suppressed.
6. The team can pause or disable the account instantly.
7. Historical CVs can be imported separately without using live bridge sessions.
8. No outbound spam behavior exists in the system.

## Recommended Execution Order

If speed and control both matter, use this order:

1. Build the bridge skeleton.
2. Connect one approved account.
3. Reuse the current Meta flow first.
4. Harden dedupe and idempotency.
5. Run a 7-day pilot.
6. Add direct backend ingest.
7. Build historical import tooling.
8. Expand account count slowly.

## Final Recommendation

Use the bridge as a controlled adapter, not as the permanent platform core.

The right long-term model is:

- official Meta number for future traffic
- bridge for a small set of legacy business-owned accounts
- export and import for historical recovery
- strong traceability and dedupe throughout