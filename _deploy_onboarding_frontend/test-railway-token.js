#!/usr/bin/env node

/**
 * Railway API Test - Account Token
 * New token: 3a57bff9-1ceb-4922-baf4-7ed5d2a2a4a9
 */

const https = require('https');

const token = '3a57bff9-1ceb-4922-baf4-7ed5d2a2a4a9';
const projectId = '585a6314-92d3-4312-8476-0cf8d388488b';

console.log('\n🔐 Railway API - Account Token Test');
console.log('=====================================\n');
console.log(`Token: ${token.substring(0, 8)}...`);
console.log(`Project: ${projectId}\n`);

const query = JSON.stringify({
  query: '{ me { id email name } }'
});

const options = {
  hostname: 'backboard.railway.com',
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(query)
  }
};

console.log('📡 Sending request to Railway API...\n');

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(body);

      if (response.errors) {
        console.log('❌ API Error:');
        response.errors.forEach(err => {
          console.log(`   ${err.message}`);
        });
      } else if (response.data) {
        console.log('✅ SUCCESS! Connected to Railway API\n');
        console.log('Account Details:');
        console.log(`  ID: ${response.data.me.id}`);
        console.log(`  Email: ${response.data.me.email}`);
        console.log(`  Name: ${response.data.me.name}`);
        
        console.log('\n✨ Your Account-level token is VALID!\n');
        console.log('You can now:');
        console.log('  ✓ Access all projects');
        console.log('  ✓ Create new services');
        console.log('  ✓ Manage databases');
        console.log('  ✓ Configure variables');
        console.log('\nNext: Follow deployment guides to add services.');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:');
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.log(`❌ Connection Error: ${e.message}`);
});

req.write(query);
req.end();
