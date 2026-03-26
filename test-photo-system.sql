-- Test Photo System for Muhammad Usman
-- Check what photo documents exist and their details

-- 1. Check Muhammad Usman's details
SELECT 
  id,
  name,
  profile_photo_url,
  photo_received
FROM candidates 
WHERE id = '1260d8ea-03cf-4acc-b069-61f576229bcc';

-- 2. Check all his documents, especially photos
SELECT 
  id,
  file_name,
  category,
  mime_type,
  storage_bucket,
  storage_path,
  verification_status,
  created_at
FROM candidate_documents
WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
ORDER BY created_at DESC;

-- 3. Check specifically for photo category documents
SELECT 
  id,
  file_name,
  category,
  mime_type,
  storage_path,
  verification_status
FROM candidate_documents
WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
  AND category = 'photos';

-- 4. Check what document was just approved
SELECT 
  id,
  file_name,
  category,
  mime_type,
  storage_path,
  verification_status
FROM candidate_documents
WHERE id = '26194f78-ee9d-47a3-9851-1809affd3695';
