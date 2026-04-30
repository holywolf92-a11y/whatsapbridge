/**
 * Reset candidate photo back to original PDF for re-extraction
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hncvsextwmvjydcukdwx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';

// Get the list of documents for this candidate
async function getOriginalPdfUrl() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('url, document_type')
    .eq('candidate_id', candidateId)
    .in('document_type', ['passport', 'cv', 'other'])
    .limit(10);
  
  if (error) {
    console.error('Error fetching documents:', error);
    return null;
  }
  
  console.log('Found documents:');
  documents.forEach((doc, idx) => {
    console.log(`  ${idx + 1}. ${doc.document_type}: ${doc.url.substring(0, 80)}...`);
  });
  
  // Find the one that looks like a profile photo PDF
  const photoPdf = documents.find(d => d.url.includes('photos') || d.url.includes('passport'));
  if (photoPdf) {
    console.log('\nSelected PDF:', photoPdf.url.substring(0, 100));
    return photoPdf.url;
  }
  
  return documents[0]?.url;
}

async function reset() {
  const pdfUrl = await getOriginalPdfUrl();
  if (!pdfUrl) {
    console.error('No PDF found');
    process.exit(1);
  }
  
  // Generate a signed URL for it
  const storagePath = pdfUrl.split('documents/')[1];
  console.log('\nGenerating signed URL for:', storagePath);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 600);
  
  if (error) {
    console.error('Error generating signed URL:', error);
    process.exit(1);
  }
  
  const signedUrl = data.signedUrl;
  
  // Update candidate
  const { error: updateError } = await supabase
    .from('candidates')
    .update({ profile_photo_url: signedUrl })
    .eq('id', candidateId);
  
  if (updateError) {
    console.error('Error updating:', updateError);
    process.exit(1);
  }
  
  console.log('\n✓ Reset complete');
  console.log('Profile photo URL reset to PDF:', signedUrl.substring(0, 80) + '...');
}

reset();
