-- Check Muhammad Usman's recent documents and photo status
SELECT 
  c.id as candidate_id,
  c.name,
  c.profile_photo_url,
  c.photo_received,
  d.id as doc_id,
  d.file_name,
  d.category,
  d.storage_path,
  d.mime_type,
  d.verification_status,
  d.created_at,
  d.updated_at
FROM candidates c
LEFT JOIN candidate_documents d ON d.candidate_id = c.id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
ORDER BY d.created_at DESC;

-- Also check parsing_jobs for recent uploads
SELECT 
  id,
  attachment_id,
  candidate_id,
  status,
  error_message,
  created_at,
  completed_at
FROM parsing_jobs
WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
ORDER BY created_at DESC
LIMIT 5;
