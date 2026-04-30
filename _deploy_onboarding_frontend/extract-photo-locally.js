/**
 * Direct PDF Photo Extraction - Run locally to test
 * This extracts the photo from Usman's PDF and saves it to Supabase
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://hncvsextwmvjydcukdwx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function extractPhotoFromPdf() {
  const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';
  
  console.log('[Extract] Starting PDF photo extraction for:', candidateId);
  
  // Step 1: Get candidate data
  console.log('\nStep 1: Fetching candidate data...');
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('profile_photo_url, name')
    .eq('id', candidateId)
    .single();
  
  if (candidateError) {
    console.error('[Extract] Error fetching candidate:', candidateError);
    process.exit(1);
  }
  
  const pdfUrl = candidate.profile_photo_url;
  console.log(`[Extract] Candidate: ${candidate.name || candidateId}`);
  console.log(`[Extract] Current photo URL: ${pdfUrl.substring(0, 80)}...`);
  
  if (!pdfUrl.includes('.pdf')) {
    console.log('[Extract] Already has image URL, skipping extraction');
    process.exit(0);
  }
  
  // Step 2: Download PDF and convert to image using Puppeteer
  console.log('\nStep 2: Extracting image from PDF...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    console.log('[Extract] Downloading PDF...');
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`[Extract] PDF downloaded (${pdfBuffer.byteLength} bytes)`);
    
    // Write to temp file for easier processing
    const tempPdfPath = require('path').join(require('os').tmpdir(), 'temp_' + Date.now() + '.pdf');
    require('fs').writeFileSync(tempPdfPath, Buffer.from(pdfBuffer));
    
    // Process with pdfjs to extract images
    console.log('[Extract] Loading PDF with pdfjs-dist...');
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
    
    const pdfDoc = await pdfjsLib.getDocument({ url: tempPdfPath }).promise;
    console.log(`[Extract] PDF has ${pdfDoc.numPages} pages`);
    
    let bestImage = null;
    let bestImageSize = 0;
    let bestImagePage = 0;
    
    // Iterate through pages to find images
    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 5); pageNum++) {
      try {
        console.log(`[Extract] Scanning page ${pageNum}...`);
        const page = await pdfDoc.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        
        const fnArray = operatorList.fnArray || [];
        const argsArray = operatorList.argsArray || [];
        
        for (let i = 0; i < fnArray.length; i++) {
          // 88 = paintImageXObject
          if (fnArray[i] === 88) {
            try {
              const imageName = argsArray[i][0];
              const image = await page.objs.get(imageName);
              
              if (image && image.data && image.width && image.height) {
                const imgSize = image.width * image.height;
                const pixelData = image.data;
                
                // Prefer larger images (actual photo vs logo/stamp)
                // Profile photos are typically at least 200x200 = 40,000 pixels
                if (imgSize > bestImageSize && imgSize > 40000) {
                  bestImage = pixelData;
                  bestImageSize = imgSize;
                  bestImagePage = pageNum;
                  console.log(`[Extract] Found image on page ${pageNum}: ${image.width}x${image.height} = ${imgSize} pixels`);
                }
              }
            } catch (e) {
              // Skip individual extraction errors
            }
          }
        }
      } catch (e) {
        console.warn(`[Extract] Error processing page ${pageNum}:`, e.message);
      }
    }
    
    // Clean up temp file
    require('fs').unlinkSync(tempPdfPath);
    
    if (!bestImage) {
      console.error('[Extract] No suitable images found in PDF');
      process.exit(1);
    }
    
    console.log(`[Extract] Best image found: ${bestImageSize} pixels on page ${bestImagePage}`);
    
    // Convert image data to JPEG using screenshot as fallback
    console.log('[Extract] Rendering to JPEG...');
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000 });
    
    // Use pdfjs screenshot
    const pdfUrl_file = 'file:///' + tempPdfPath.replace(/\\/g, '/');
    await page.goto(pdfUrl_file, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: false });
    console.log(`[Extract] Screenshot captured (${screenshot.length} bytes)`);

    
    // Step 3: Save image to Supabase storage
    console.log('\nStep 3: Saving image to Supabase...');
    const filename = `extracted_${Date.now()}.jpg`;
    const storagePath = `candidates/${candidateId}/profile_photos/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, screenshot, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('[Extract] Upload error:', uploadError);
      process.exit(1);
    }
    
    console.log('[Extract] Image uploaded to documents/' + storagePath);
    
    // Step 4: Generate signed URL
    console.log('\nStep 4: Generating signed URL...');
    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 600); // 10 minute TTL
    
    if (signError || !signedData) {
      console.error('[Extract] Sign error:', signError);
      process.exit(1);
    }
    
    const signedUrl = signedData.signedUrl;
    console.log(`[Extract] Signed URL: ${signedUrl.substring(0, 80)}...`);
    
    // Step 5: Update candidate record
    console.log('\nStep 5: Updating candidate profile photo URL...');
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ profile_photo_url: signedUrl })
      .eq('id', candidateId);
    
    if (updateError) {
      console.error('[Extract] Update error:', updateError);
      process.exit(1);
    }
    
    console.log('\n✓ SUCCESS: Photo extraction complete!');
    console.log(`  Extracted image saved: documents/${storagePath}`);
    console.log(`  Candidate profile photo updated with image URL`);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run
extractPhotoFromPdf().catch(e => {
  console.error('[Extract] Fatal error:', e);
  process.exit(1);
});
