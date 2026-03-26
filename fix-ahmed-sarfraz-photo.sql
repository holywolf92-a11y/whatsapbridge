-- Fix Ahmed Sarfraz's photo
-- Set profile_photo_url from his verified photo document

-- First, let's see the current state
SELECT 
  c.id as candidate_id,
  c.name,
  c.profile_photo_url as current_photo_url,
  c.photo_received,
  d.id as doc_id,
  d.file_name,
  d.file_url as photo_url,
  d.verification_status
FROM candidates c
LEFT JOIN candidate_documents d ON d.candidate_id = c.id AND d.category = 'photos'
WHERE c.name ILIKE '%SARFRAZ%' OR c.name ILIKE '%AHMED%'
ORDER BY c.created_at DESC
LIMIT 5;

-- Update Ahmed Sarfraz's profile_photo_url with his verified photo
UPDATE candidates c
SET 
  profile_photo_url = d.file_url,
  photo_received = true,
  updated_at = NOW()
FROM candidate_documents d
WHERE d.candidate_id = c.id
  AND d.category = 'photos'
  AND d.verification_status = 'verified'
  AND d.file_name = 'split_photos_1769543974813.pdf'
  AND (c.profile_photo_url IS NULL OR c.profile_photo_url = '')
RETURNING c.id, c.name, c.profile_photo_url;
