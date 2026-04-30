/**
 * Smart PDF Photo Extraction - Extract the ACTUAL profile photo
 * Uses multiple strategies to find the real photo vs logos/watermarks
 */
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hncvsextwmvjydcukdwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ'
);

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';
const pdfUrl = 'https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/sign/documents/candidates/25c2e464-359f-479d-a8b9-ac7bb9fec3b5/other_documents/1769597850750_e13c7807-2873-43d3-9b0d-b160ded466b7_pages_1.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YTE4ZGY5Ni1mNzI0LTRkMDYtOTY2Yy02NDkyZWUwZTUwODIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvY2FuZGlkYXRlcy8yNWMyZTQ2NC0zNTlmLTQ3OWQtYThiOS1hYzdiYjlmZWMzYjUvb3RoZXJfZG9jdW1lbnRzLzE3Njk1OTc4NTA3NTBfZTEzYzc4MDctMjg3My00M2QzLTliMGQtYjE2MGRlZDQ2NmI3X3BhZ2VzXzEucGRmIiwiaWF0IjoxNzY5NjI1MTgwLCJleHAiOjE3Njk2Mjg3ODB9.RSsnuPX3w_L6wti8O7SRGHArqWf_S-SSeJccRfdvMAc';

async function extractProfilePhoto() {
  console.log('[Extract] Starting smart PDF photo extraction');
  console.log('[Extract] PDF: ' + pdfUrl.substring(0, 80) + '...\n');
  
  let browser;
  try {
    // Download PDF
    console.log('[Extract] Downloading PDF (61KB)...');
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`[Extract] Downloaded ${pdfBuffer.byteLength} bytes\n`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Strategy 1: Capture page 1 (where profile photos typically appear)
    console.log('[Extract] Strategy 1: Rendering PDF page 1...');
    await page.setViewport({ width: 1000, height: 1400 });
    
    const pdfDataUrl = 'data:application/pdf;base64,' + Buffer.from(pdfBuffer).toString('base64');
    await page.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Take full page screenshot
    const fullPageScreenshot = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: true });
    console.log(`[Extract] Full page screenshot: ${fullPageScreenshot.length} bytes`);
    
    // Strategy 2: Crop to profile photo region (typically top-left or top-right)
    console.log('\n[Extract] Strategy 2: Looking for profile photo in typical locations...');
    
    // Try top-left region first
    const topLeftPhoto = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      clip: { x: 30, y: 30, width: 250, height: 350 }
    });
    console.log(`[Extract] Top-left region: ${topLeftPhoto.length} bytes`);
    
    // Try top-right region
    const topRightPhoto = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      clip: { x: 700, y: 30, width: 250, height: 350 }
    });
    console.log(`[Extract] Top-right region: ${topRightPhoto.length} bytes`);
    
    // Use the larger one (more likely to be actual photo)
    const imageBuffer = topLeftPhoto.length > topRightPhoto.length ? topLeftPhoto : topRightPhoto;
    const region = topLeftPhoto.length > topRightPhoto.length ? 'top-left' : 'top-right';
    
    console.log(`[Extract] Selected ${region} region\n`);
    
    // Save to Supabase
    console.log('[Extract] Saving extracted image to Supabase...');
    const filename = `extracted_${Date.now()}.jpg`;
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
    
    console.log('[Extract] Uploaded to: documents/' + storagePath);
    
    // Generate signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 600);
    
    if (signError || !signedData) {
      console.error('[Extract] Sign error:', signError);
      process.exit(1);
    }
    
    const signedUrl = signedData.signedUrl;
    console.log('[Extract] Generated signed URL\n');
    
    // Update candidate
    console.log('[Extract] Updating candidate record...');
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ profile_photo_url: signedUrl })
      .eq('id', candidateId);
    
    if (updateError) {
      console.error('[Extract] Update error:', updateError);
      process.exit(1);
    }
    
    console.log('\n✓ SUCCESS: Profile photo extracted and saved!');
    console.log(`  Image: ${imageBuffer.length} bytes`);
    console.log(`  Region: ${region}`);
    console.log(`  Candidate updated with new photo URL`);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

extractProfilePhoto().catch(e => {
  console.error('[Extract] Fatal error:', e.message);
  process.exit(1);
});
