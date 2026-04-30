/**
 * Find the actual profile photo by extracting and comparing multiple regions
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const pdfUrl = 'https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/sign/documents/candidates/25c2e464-359f-479d-a8b9-ac7bb9fec3b5/other_documents/1769597850750_e13c7807-2873-43d3-9b0d-b160ded466b7_pages_1.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YTE4ZGY5Ni1mNzI0LTRkMDYtOTY2Yy02NDkyZWUwZTUwODIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvY2FuZGlkYXRlcy8yNWMyZTQ2NC0zNTlmLTQ3OWQtYThiOS1hYzdiYjlmZWMzYjUvb3RoZXJfZG9jdW1lbnRzLzE3Njk1OTc4NTA3NTBfZTEzYzc4MDctMjg3My00M2QzLTliMGQtYjE2MGRlZDQ2NmI3X3BhZ2VzXzEucGRmIiwiaWF0IjoxNzY5NjI1MTgwLCJleHAiOjE3Njk2Mjg3ODB9.RSsnuPX3w_L6wti8O7SRGHArqWf_S-SSeJccRfdvMAc';

async function findProfilePhoto() {
  console.log('[Find Photo] Analyzing PDF to find profile photo...\n');
  
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
    
    // Take full page screenshot
    console.log('[Find Photo] Capturing full page...');
    const fullPage = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: true });
    fs.writeFileSync('full_page.jpg', fullPage);
    console.log(`[Find Photo] Saved: full_page.jpg (${fullPage.length} bytes)\n`);
    
    // Extract multiple regions to find the actual photo
    console.log('[Find Photo] Extracting candidate regions...\n');
    
    const regions = [
      { name: 'Full Page', clip: null, desc: 'Entire page' },
      { name: 'Center', clip: { x: 200, y: 200, width: 600, height: 600 }, desc: 'Center 600x600' },
      { name: 'Middle-Left', clip: { x: 50, y: 300, width: 300, height: 400 }, desc: 'Left side' },
      { name: 'Middle-Right', clip: { x: 650, y: 300, width: 300, height: 400 }, desc: 'Right side' },
      { name: 'Lower-Left', clip: { x: 50, y: 700, width: 350, height: 400 }, desc: 'Lower left' },
      { name: 'Lower-Center', clip: { x: 300, y: 700, width: 400, height: 400 }, desc: 'Lower center' },
      { name: 'Lower-Right', clip: { x: 650, y: 700, width: 350, height: 400 }, desc: 'Lower right' },
    ];
    
    for (const region of regions) {
      let screenshot;
      if (region.clip) {
        screenshot = await page.screenshot({ type: 'jpeg', quality: 90, clip: region.clip });
      } else {
        screenshot = fullPage;
      }
      
      const filename = `region_${region.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      fs.writeFileSync(filename, screenshot);
      
      console.log(`[Find Photo] ${region.name.padEnd(15)} (${region.desc.padEnd(20)}): ${screenshot.length.toString().padStart(6)} bytes`);
      console.log(`              → ${filename}`);
    }
    
    console.log('\n[Find Photo] All regions extracted!');
    console.log('[Find Photo] Check these images to find which one has the actual profile photo:');
    console.log('  - full_page.jpg');
    console.log('  - region_*.jpg files');
    
  } finally {
    if (browser) await browser.close();
  }
}

findProfilePhoto().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
