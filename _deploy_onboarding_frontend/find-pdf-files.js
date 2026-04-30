const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hncvsextwmvjydcukdwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ'
);

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';

async function findPdfs() {
  console.log('Searching for PDFs in storage...\n');
  
  // List all files in the candidate's documents folder
  const { data: files, error } = await supabase.storage
    .from('documents')
    .list(`candidates/${candidateId}/other_documents`);
  
  if (error) {
    console.error('Error listing files:', error);
    return;
  }
  
  console.log(`Found ${files.length} files:\n`);
  
  const pdfFiles = files.filter(f => f.name.includes('.pdf'));
  pdfFiles.forEach(file => {
    console.log(`  - ${file.name}`);
  });
  
  if (pdfFiles.length === 0) {
    console.log('  (No PDFs found)');
    return;
  }
  
  // Generate signed URL for the first PDF
  if (pdfFiles.length > 0) {
    const pdfName = pdfFiles[0].name;
    const path = `candidates/${candidateId}/other_documents/${pdfName}`;
    
    console.log(`\nGenerating signed URL for: ${pdfName}`);
    const { data, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600);
    
    if (error || !data) {
      console.error('Error creating signed URL:', signError);
      return;
    }
    
    console.log(`\nSigned URL:\n${data.signedUrl}\n`);
    
    // Test fetch
    console.log('Testing fetch...');
    const response = await fetch(data.signedUrl);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    const buffer = await response.arrayBuffer();
    console.log(`Size: ${buffer.byteLength} bytes`);
  }
}

findPdfs();
