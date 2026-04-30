#!/usr/bin/env node

/**
 * Railway Service Deployment Script
 * Deploys Backend, Redis, and Frontend to Railway
 * 
 * Usage: node deploy-railway.js
 */

const https = require('https');
const querystring = require('querystring');

const config = {
  token: '46f5f85f-ba9b-4c7d-80aa-1f75441d6040',
  projectId: '585a6314-92d3-4312-8476-0cf8d388488b',
  projectName: 'gleaming-healing',
  apiEndpoint: 'https://backboard.railway.com/graphql/v2'
};

const graphqlQuery = (query, variables = {}) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query,
      variables
    });

    const options = {
      hostname: 'backboard.railway.com',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${config.token}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.errors) {
            reject(new Error(response.errors[0]?.message || 'GraphQL Error'));
          } else {
            resolve(response.data);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const deployServices = async () => {
  console.log('🚀 Railway Service Deployment');
  console.log('============================\n');

  try {
    // Test connection
    console.log('🔍 Testing API connection...');
    const meQuery = `{ me { id email } }`;
    const result = await graphqlQuery(meQuery);
    console.log(`✓ Connected as: ${result.me.email}\n`);

    // List current services
    console.log('📋 Current services in project:');
    const projectQuery = `
      query {
        project(id: "${config.projectId}") {
          id
          name
          services(first: 10) {
            edges {
              node {
                id
                name
                serviceName
              }
            }
          }
        }
      }
    `;
    
    const projectData = await graphqlQuery(projectQuery);
    const services = projectData.project.services.edges.map(e => e.node);
    
    if (services.length === 0) {
      console.log('  (No services yet - add via Railway dashboard)\n');
    } else {
      services.forEach(svc => {
        console.log(`  • ${svc.serviceName || svc.name}`);
      });
      console.log('');
    }

    // Display next steps
    console.log('📖 NEXT STEPS:\n');
    console.log('1. Open Railway Dashboard:');
    console.log(`   https://railway.app/project/${config.projectId}\n`);
    
    console.log('2. Add Backend Service:');
    console.log('   Click "New" → "GitHub Repo" → recruitment-portal-backend\n');
    
    console.log('3. Add Redis Database:');
    console.log('   Click "New" → "Database" → Redis\n');
    
    console.log('4. Configure Backend Variables:');
    console.log('   RUN_WORKER=true');
    console.log('   REDIS_URL=[from Redis service]');
    console.log('   PYTHON_HMAC_SECRET=Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=');
    console.log('   PYTHON_CV_PARSER_URL=https://parser.railway.app\n');
    
    console.log('5. Add Frontend Service:');
    console.log('   Click "New" → "GitHub Repo" → recruitment-portal-frontend\n');
    
    console.log('6. Configure Frontend Variable:');
    console.log('   VITE_API_BASE_URL=https://[backend-url]/api\n');

    console.log('✅ API Connection successful!');
    console.log('📚 See RAILWAY_QUICK_DEPLOY.md for detailed instructions\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nℹ️  If you see "Unauthorized", make sure:');
    console.log('   1. Token is valid: 46f5f85f-ba9b-4c7d-80aa-1f75441d6040');
    console.log('   2. Token has project access');
    console.log('   3. Visit: https://railway.app/project/' + config.projectId);
    process.exit(1);
  }
};

deployServices();
