-- Simple query to check Muhammad Usman's photo status
SELECT 
  d.file_name,
  d.storage_path,
  d.mime_type,
  d.category,
  d.verification_status,
  d.created_at,
  c.profile_photo_url,
  CASE 
    WHEN d.mime_type = 'image/jpeg' AND d.storage_path LIKE '%.jpg' THEN '✅ JPEG - FIX WORKING!'
    WHEN d.mime_type = 'application/pdf' AND d.storage_path LIKE '%.pdf' THEN '❌ PDF - OLD CODE'
    ELSE '❓ Unknown: ' || COALESCE(d.mime_type, 'NULL')
  END as status,
  CASE
    WHEN d.storage_path = c.profile_photo_url THEN '✅ URL matches'
    WHEN c.profile_photo_url IS NULL THEN '⚠️ No URL set'
    ELSE '❌ URL mismatch'
  END as url_status
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
  AND d.category = 'photos'
ORDER BY d.created_at DESC
LIMIT 3;
