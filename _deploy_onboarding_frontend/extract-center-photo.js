/**
 * Extract the CENTER region of the PDF as the profile photo
 * (Most likely to contain the actual photo based on analysis)
 */
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hncvsextwmvjydcukdwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ'
);

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';
const pdfUrl = 'https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/sign/documents/candidates/25c2e464-359f-479d-a8b9-ac7bb9fec3b5/other_documents/1769597850750_e13c7807-2873-43d3-9b0d-b160ded466b7_pages_1.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YTE4ZGY5Ni1mNzI0LTRkMDYtOTY2Yy02NDkyZWUwZTUwODIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvY2FuZGlkYXRlcy8yNWMyZTQ2NC0zNTlmLTQ3OWQtYThiOS1hYzdiYjlmZWMzYjUvb3RoZXJfZG9jdW1lbnRzLzE3Njk1OTc4NTA3NTBfZTEzYzc4MDctMjg3My00M2QzLTliMGQtYjE2MGRlZDQ2NmI3X3BhZ2VzXzEucGRmIiwiaWF0IjoxNzY5NjI1MTgwLCJleHAiOjE3Njk2Mjg3ODB9.RSsnuPX3w_L6wti8O7SRGHArqWf_S-SSeJccRfdvMAc';

async function extractFromCenter() {
  console.log('[Extract] Extracting profile photo from center region of PDF\n');
  
  let browser;
  try {
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1400 });
    
    const pdfDataUrl = 'data:application/pdf;base64,' + Buffer.from(pdfBuffer).toString('base64');
    await page.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Extract center region (most likely to have the actual photo)
    console.log('[Extract] Capturing center region...');
    const imageBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      clip: { x: 200, y: 200, width: 600, height: 600 }
    });
    
    console.log(`[Extract] Extracted ${imageBuffer.length} bytes\n`);
    
    // Save to Supabase
    console.log('[Extract] Saving to Supabase...');
    const filename = `extracted_center_${Date.now()}.jpg`;
    const storagePath = `candidates/${candidateId}/profile_photos/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('[Extract] Upload failed:', uploadError);
      process.exit(1);
    }
    
    // Generate signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 600);
    
    if (signError || !signedData) {
      console.error('[Extract] Sign error:', signError);
      process.exit(1);
    }
    
    // Update candidate
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ profile_photo_url: signedData.signedUrl })
      .eq('id', candidateId);
    
    if (updateError) {
      console.error('[Extract] Update error:', updateError);
      process.exit(1);
    }
    
    console.log('[Extract] Updated candidate profile\n');
    console.log('✓ SUCCESS: Extracted photo from center region');
    console.log(`  Size: ${imageBuffer.length} bytes`);
    console.log(`  File: ${filename}`);
    
  } finally {
    if (browser) await browser.close();
  }
}

extractFromCenter().catch(e => {
  console.error('[Extract] Error:', e.message);
  process.exit(1);
});
