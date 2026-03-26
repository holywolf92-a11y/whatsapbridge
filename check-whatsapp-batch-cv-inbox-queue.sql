-- WhatsApp batch: how many CV attachments are still showing "Queued" in CV Inbox?
--
-- CV Inbox logic (frontend):
-- - status = 'extracted' when inbox_attachments.candidate_id is NOT NULL
-- - otherwise it shows 'queued' unless a parsing_job exists and reports another status
--
-- EDIT THIS WINDOW to match your batch.
-- Option A (relative): last 24 hours
--   SELECT now() - interval '24 hours' AS since
-- Option B (absolute):
--   SELECT TIMESTAMPTZ '2026-02-23 00:00:00+00' AS since

WITH params AS (
  SELECT now() - interval '24 hours' AS since
),
base AS (
  SELECT
    a.id                  AS attachment_id,
    a.file_name,
    a.mime_type,
    a.storage_bucket,
    a.storage_path,
    a.attachment_type,
    a.attachment_kind,
    a.document_type,
    a.candidate_id,
    a.linked_candidate_id,
    a.created_at          AS attachment_created_at,
    m.id                  AS message_id,
    m.status              AS message_status,
    m.received_at         AS message_received_at
  FROM inbox_attachments a
  JOIN inbox_messages m ON m.id = a.inbox_message_id
  JOIN params p ON TRUE
  WHERE m.source = 'whatsapp'
    AND m.received_at >= p.since
    AND COALESCE(a.attachment_type, 'cv') = 'cv'
),
with_latest_job AS (
  SELECT
    b.*,
    pj.id     AS parsing_job_id,
    pj.status AS parsing_job_status,
    pj.created_at AS parsing_job_created_at
  FROM base b
  LEFT JOIN LATERAL (
    SELECT p.*
    FROM parsing_jobs p
    WHERE p.inbox_attachment_id = b.attachment_id
       OR p.attachment_id = b.attachment_id
    ORDER BY p.created_at DESC
    LIMIT 1
  ) pj ON TRUE
)

-- 1) Summary counts
SELECT
  COUNT(*) AS whatsapp_cvs_total,
  COUNT(*) FILTER (WHERE candidate_id IS NOT NULL) AS extracted_to_candidate,
  COUNT(*) FILTER (WHERE candidate_id IS NULL) AS showing_queued_in_cvinbox,
  COUNT(*) FILTER (WHERE candidate_id IS NULL AND parsing_job_id IS NULL) AS queued_missing_parsing_job,
  COUNT(*) FILTER (WHERE candidate_id IS NULL AND parsing_job_status = 'queued') AS queued_with_job_status_queued,
  COUNT(*) FILTER (WHERE candidate_id IS NULL AND parsing_job_status = 'processing') AS queued_with_job_status_processing,
  COUNT(*) FILTER (WHERE candidate_id IS NULL AND parsing_job_status = 'failed') AS queued_with_job_status_failed,
  COUNT(*) FILTER (WHERE candidate_id IS NULL AND parsing_job_status = 'extracted') AS queued_with_job_status_extracted
FROM with_latest_job;

-- 2) Details: the specific items still queued (most recent first)
--    (Helpful to confirm which ones are missing jobs vs just processing)
SELECT
  attachment_id,
  file_name,
  mime_type,
  attachment_kind,
  document_type,
  message_received_at,
  message_status,
  parsing_job_id,
  parsing_job_status,
  parsing_job_created_at,
  FLOOR(EXTRACT(EPOCH FROM (now() - message_received_at)) / 60) AS minutes_since_received
FROM with_latest_job
WHERE candidate_id IS NULL
ORDER BY message_received_at DESC
LIMIT 200;
