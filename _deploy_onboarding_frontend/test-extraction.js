const https = require('https');

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';
const baseUrl = 'recruitment-portal-backend.up.railway.app';

console.log('Testing extraction endpoint...\n');

// First, get current candidate data
const getReq = https.request({
  hostname: baseUrl,
  port: 443,
  path: `/api/candidates/${candidateId}`,
  method: 'GET',
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const candidate = JSON.parse(data);
      const photoUrl = candidate.profile_photo_url;
      const isPDF = photoUrl.includes('.pdf');
      console.log(`✓ Current profile_photo_url: ${photoUrl.substring(0, 80)}...`);
      console.log(`  Type: ${isPDF ? 'PDF' : 'IMAGE'}\n`);
      
      // Now call extraction
      console.log('Calling extraction endpoint...');
      const extractReq = https.request({
        hostname: baseUrl,
        port: 443,
        path: `/api/documents/candidates/${candidateId}/extract-photo`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (extractRes) => {
        let extractData = '';
        extractRes.on('data', chunk => { extractData += chunk; });
        extractRes.on('end', () => {
          console.log(`Status: ${extractRes.statusCode}`);
          try {
            const result = JSON.parse(extractData);
            if (extractRes.statusCode === 200) {
              console.log(`✓ Extraction successful!`);
              console.log(`  New URL: ${result.profile_photo_url.substring(0, 80)}...`);
            } else {
              console.log(`✗ Error: ${result.message || extractData}`);
            }
          } catch (e) {
            console.log(`Raw response: ${extractData}`);
          }
        });
      });
      
      extractReq.on('error', e => console.error('Request error:', e.message));
      extractReq.write(JSON.stringify({}));
      extractReq.end();
      
    } catch (e) {
      console.error('Parse error:', e.message, '\nResponse:', data.substring(0, 200));
    }
  });
});

getReq.on('error', e => console.error('Error:', e.message));
getReq.end();
