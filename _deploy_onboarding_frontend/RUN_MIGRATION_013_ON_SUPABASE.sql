-- 📋 MIGRATION 013 DEPLOYMENT INSTRUCTIONS
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"
-- This will add profile photo support and unmatched documents table

-- ============================================================================
-- STEP 1: Add Profile Photo Columns to Candidates Table
-- ============================================================================

DO $$
BEGIN
  -- Add profile_photo_bucket column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'profile_photo_bucket'
  ) THEN
    ALTER TABLE candidates ADD COLUMN profile_photo_bucket TEXT;
    RAISE NOTICE 'Added profile_photo_bucket column';
  ELSE
    RAISE NOTICE 'profile_photo_bucket column already exists';
  END IF;

  -- Add profile_photo_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'profile_photo_path'
  ) THEN
    ALTER TABLE candidates ADD COLUMN profile_photo_path TEXT;
    RAISE NOTICE 'Added profile_photo_path column';
  ELSE
    RAISE NOTICE 'profile_photo_path column already exists';
  END IF;

  -- Add profile_photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE candidates ADD COLUMN profile_photo_url TEXT;
    RAISE NOTICE 'Added profile_photo_url column';
  ELSE
    RAISE NOTICE 'profile_photo_url column already exists';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN candidates.profile_photo_bucket IS 'Supabase storage bucket for profile photo (e.g., "documents")';
COMMENT ON COLUMN candidates.profile_photo_path IS 'Storage path to profile photo file (e.g., "candidates/{id}/photo/filename.jpg")';
COMMENT ON COLUMN candidates.profile_photo_url IS 'Optional direct URL to profile photo';

-- ============================================================================
-- STEP 2: Create Unmatched Documents Table for Auto-Linking
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES candidate_documents(id) ON DELETE CASCADE,
  
  -- Match attempt metadata
  match_reason TEXT NOT NULL, -- 'no_match' | 'multiple_matches' | 'ambiguous' | 'cross_candidate_conflict'
  match_details JSONB, -- Store potential matches and their scores
  
  -- Document classification
  document_type TEXT, -- From DocumentClassifier
  extracted_cnic TEXT,
  extracted_email TEXT,
  extracted_phone TEXT,
  extracted_name TEXT,
  extracted_father_name TEXT,
  
  -- Manual review
  needs_manual_review BOOLEAN DEFAULT TRUE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  resolution_action TEXT, -- 'linked_to_candidate' | 'created_new_candidate' | 'rejected'
  linked_candidate_id UUID REFERENCES candidates(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unmatched_documents_needs_review 
  ON unmatched_documents(needs_manual_review) 
  WHERE needs_manual_review = TRUE;

CREATE INDEX IF NOT EXISTS idx_unmatched_documents_match_reason 
  ON unmatched_documents(match_reason);

CREATE INDEX IF NOT EXISTS idx_unmatched_documents_document_id 
  ON unmatched_documents(document_id);

-- ============================================================================
-- STEP 4: Enable Row Level Security and Add Policies
-- ============================================================================

ALTER TABLE unmatched_documents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (will be restricted when auth is implemented)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'unmatched_documents' AND policyname = 'unmatched_documents_select'
  ) THEN
    CREATE POLICY unmatched_documents_select ON unmatched_documents
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'unmatched_documents' AND policyname = 'unmatched_documents_insert'
  ) THEN
    CREATE POLICY unmatched_documents_insert ON unmatched_documents
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'unmatched_documents' AND policyname = 'unmatched_documents_update'
  ) THEN
    CREATE POLICY unmatched_documents_update ON unmatched_documents
      FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'unmatched_documents' AND policyname = 'unmatched_documents_delete'
  ) THEN
    CREATE POLICY unmatched_documents_delete ON unmatched_documents
      FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add Table Comments
-- ============================================================================

COMMENT ON TABLE unmatched_documents IS 'Stores documents that could not be automatically linked to candidates during upload. Used for manual review of ambiguous matches, multiple matches, or no matches.';
COMMENT ON COLUMN unmatched_documents.match_reason IS 'Reason document needs manual review: no_match (no candidate found), multiple_matches (2+ candidates matched), ambiguous (low confidence), cross_candidate_conflict (uploaded from candidate A but belongs to candidate B)';
COMMENT ON COLUMN unmatched_documents.match_details IS 'JSON object with match scores and potential candidate IDs for manual review context';

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run separately to verify)
-- ============================================================================

-- Check if profile photo columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'candidates' 
-- AND column_name LIKE 'profile_photo%';

-- Check if unmatched_documents table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'unmatched_documents';

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'unmatched_documents';

-- Check RLS policies
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE tablename = 'unmatched_documents';

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 013 completed successfully!';
  RAISE NOTICE 'Profile photo columns added to candidates table';
  RAISE NOTICE 'Unmatched documents table created';
  RAISE NOTICE 'Next step: Deploy backend and frontend to Railway';
END $$;
