const https = require('https');

const candidateId = '25c2e464-359f-479d-a8b9-ac7bb9fec3b5';

const req = https.request({
  hostname: 'recruitment-portal-backend.up.railway.app',
  path: `/api/documents/candidates/${candidateId}/documents`,
  method: 'GET',
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.data && Array.isArray(result.data)) {
        console.log('Documents:');
        result.data.forEach((doc, idx) => {
          console.log(`\n${idx + 1}. Type: ${doc.document_type}`);
          console.log(`   URL: ${doc.file_url.substring(0, 100)}...`);
        });
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', e => console.error('Error:', e.message));
req.end();
