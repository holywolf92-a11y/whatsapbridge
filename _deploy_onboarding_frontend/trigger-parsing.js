#!/usr/bin/env node

// Trigger parsing for Abdullah and Sharafat CVs using direct API calls via HTTP module
const http = require('http');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const attachments = [
  { id: '0a4a0050-a28a-457c-a65f-b631b9a768ab', name: 'Sharafat Updated.pdf' },
  { id: 'c2d06014-201a-4ec0-9f20-614c485d8ede', name: 'Abdullah cv.pdf' }
];

function makeRequest(attachmentId, fileName) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/api/cv-inbox/attachments/${attachmentId}/process`);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 2
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n✅ ${fileName}`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`Job ID: ${json.job_id}`);
          console.log(`Status: ${json.status}`);
        } catch (e) {
          console.log('Response:', data.substring(0, 100));
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ ${fileName}: ${error.message}`);
      reject(error);
    });

    req.write('{}');
    req.end();
  });
}

async function main() {
  console.log('Triggering parsing for uploaded CVs...\n');
  for (const att of attachments) {
    await makeRequest(att.id, att.name);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n✅ Parsing triggered. Jobs should appear in database within moments.');
}

main().catch(console.error);
