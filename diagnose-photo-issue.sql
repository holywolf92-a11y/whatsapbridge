-- Comprehensive diagnostic for photo upload issue
-- Run this in Supabase SQL Editor

-- 1. Check ALL recent documents for Muhammad Usman (not just photos category)
SELECT 
  d.file_name,
  d.category,
  d.storage_path,
  d.mime_type,
  d.created_at,
  d.verification_status,
  CASE 
    WHEN d.category = 'photos' AND d.mime_type = 'image/jpeg' THEN '✅ Photo as JPEG - v2.1 WORKING!'
    WHEN d.category = 'photos' AND d.mime_type = 'application/pdf' THEN '❌ Photo as PDF - v2.1 FAILED or not used'
    WHEN d.category = 'other_documents' AND d.file_name ILIKE '%photo%' THEN '⚠️ Photo in wrong category!'
    WHEN d.category = 'other_documents' AND d.mime_type = 'application/pdf' THEN '📄 Other document (not photo)'
    ELSE '❓ Unknown'
  END as diagnosis
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
  AND d.created_at > NOW() - INTERVAL '1 hour'  -- Only recent uploads
ORDER BY d.created_at DESC;

-- 2. Check specifically for the file you mentioned
SELECT 
  d.file_name,
  d.category,
  d.detected_category,
  d.storage_path,
  d.mime_type,
  d.confidence,
  d.created_at,
  CASE 
    WHEN d.file_name LIKE '%1769547782938%' THEN '⏰ OLD UPLOAD (before v2.1)'
    WHEN d.created_at > '2026-01-28 02:05:00+00' THEN '✅ NEW UPLOAD (after v2.1)'
    ELSE '❓ Check timestamp'
  END as timing
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
  AND (d.file_name ILIKE '%photo%' OR d.category = 'photos' OR d.detected_category = 'photos')
ORDER BY d.created_at DESC
LIMIT 5;

-- 3. Check if any JPEG photos exist at all (to verify v2.1 works)
SELECT 
  COUNT(*) as jpeg_photo_count,
  MIN(created_at) as first_jpeg_photo,
  MAX(created_at) as latest_jpeg_photo
FROM candidate_documents
WHERE category = 'photos' 
  AND mime_type = 'image/jpeg';
