/**
 * Debug: Extract ALL images from the PDF to see what's in it
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hncvsextwmvjydcukdwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ'
);

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';

async function extractAllImages() {
  console.log('Getting current candidate photo URL...');
  
  const { data: candidate } = await supabase
    .from('candidates')
    .select('profile_photo_url')
    .eq('id', candidateId)
    .single();
  
  let pdfUrl = candidate.profile_photo_url;
  
  // If it's an image, we need to find the original PDF
  if (!pdfUrl.includes('.pdf')) {
    console.log('Current URL is an image, trying to find original PDF from documents...');
    // For now, use a known PDF URL
    pdfUrl = 'https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/sign/documents/candidates/25c2e464-359f-479d-a8b9-ac7bb9fec3b5/other_documents/1769597850750_split_photos_pages_1.pdf?token=...';
  }
  
  console.log('PDF URL:', pdfUrl.substring(0, 100));
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Download PDF
    console.log('\nDownloading PDF...');
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    console.log(`Downloaded ${buffer.byteLength} bytes`);
    
    // Save all pages as screenshots
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    
    const pdfDataUrl = 'data:application/pdf;base64,' + Buffer.from(buffer).toString('base64');
    await page.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Get page count
    const pageCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-page-number]').length;
    });
    
    console.log(`\nPDF has approximately ${pageCount} pages`);
    console.log('Capturing screenshots of first 3 pages...');
    
    for (let i = 0; i < Math.min(3, pageCount); i++) {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1200, height: 1600 } });
      const filename = `pdf_page_${i + 1}.jpg`;
      fs.writeFileSync(filename, screenshot);
      console.log(`  ✓ Saved ${filename} (${screenshot.length} bytes)`);
      
      // Scroll down for next page
      if (i < pageCount - 1) {
        await page.evaluate(() => window.scrollBy(0, 1600));
        await page.waitForTimeout(500);
      }
    }
    
    console.log('\nImages saved to current directory as pdf_page_*.jpg');
    console.log('Check these images to see what the PDF contains');
    
  } finally {
    if (browser) await browser.close();
  }
}

extractAllImages().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
