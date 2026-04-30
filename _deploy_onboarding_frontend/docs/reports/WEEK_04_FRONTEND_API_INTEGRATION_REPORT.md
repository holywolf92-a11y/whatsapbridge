# Week 4 Frontend Integration Report (CV Processing)

Date: 2026-01-12

Goal: Replace mock CV inbox and fake extraction with real backend APIs, wired for the Week 4 queue + parser flow.

---

## Files Changed

- src/components/CVInbox.tsx
  - Removed `mockIncomingCVs` and fake auto-processing
  - Loads real data: lists inbox messages and their attachments via backend APIs
  - Adds "Process CV" action that calls parsing job endpoint and starts polling
  - Shows real statuses: queued, processing, extracted, failed (with retry)
  - Gracefully handles missing endpoints (error badge with message)

- src/components/CVParser.tsx
  - Removed mock extraction loop
  - Added polling of parsing job status when `jobId` prop is provided
  - Shows progress, transitions to review on completion, or error fallback if job fails/unavailable

- src/lib/apiClient.ts (new)
  - Centralized API client using `VITE_API_BASE_URL`
  - Exposes helpers: `listInboxMessages`, `listAttachments`, `triggerParsing`, `getParsingJob`

---

## Endpoints Used

- GET /api/cv-inbox?limit=25&offset=0
  - Lists inbox messages (source, payload, received_at)

- GET /api/cv-inbox/:messageId/attachments
  - Lists attachments for a message (file_name, candidate_id, etc.)

- POST /api/cv-inbox/attachments/:attachmentId/process
  - Triggers CV parsing job (expected to return `{ job_id, status }`)

- GET /api/parsing-jobs/:jobId
  - Returns job status: `queued | processing | completed | failed`, with `progress`, `result`, `error_message`, optional `candidate_id`

Base prefix `/api` is taken from backend server (server.ts mounts routes under `/api`).

---

## Missing Backend Endpoints (to enable full flow)

- POST /api/cv-inbox/attachments/:attachmentId/process
  - Not present in current backend (no `parsingJobs` or processing route in `backend/src/routes`)
  - Frontend handles absence by showing an error on trigger attempt

- GET /api/parsing-jobs/:jobId
  - Not present in current backend
  - Frontend polling will fail gracefully and render an error fallback

Recommendation: Implement queue service + worker and add these endpoints per Week 4 plan to unlock end-to-end processing.

---

## Configuration

- Frontend expects `VITE_API_BASE_URL` to point to backend base (e.g., `https://gleaming-healing-production-601c.up.railway.app/api`).
- If not set, defaults to `/api` (same-origin proxy or production under same domain path).

---

## Notes

- Source mapping for UI: `whatsapp -> WhatsApp`, `email -> Email`, `web -> Web Form`, else `Unknown`.
- Attachments without `candidate_id` display as `queued` until processed.
- Manual upload button remains a placeholder (requires a separate upload flow to backend).
- Once Week 4 backend endpoints are added, no further UI work should be needed beyond wiring jobId from trigger response.
