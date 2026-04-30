const https = require('https');

const SUPA = 'hncvsextwmvjydcukdwx.supabase.co';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: SUPA, path, method: 'GET',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Prefer': 'count=exact' }
    };
    let data = '';
    const req = https.request(opts, res => {
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ _raw: data, _err: e.message }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

  // Query parsing jobs directly by time + source (join approach)
  // Get failed parsing jobs in last 72h
  const failedJobs = await apiGet(
    `/rest/v1/parsing_jobs?status=eq.failed&created_at=gte.${since}&select=error_message,created_at&order=created_at.desc&limit=200`
  );

  if (!Array.isArray(failedJobs)) {
    console.log('Unexpected response:', JSON.stringify(failedJobs));
    return;
  }

  console.log(`Failed parsing jobs (72h): ${failedJobs.length}`);

  const byError = {};
  failedJobs.forEach(j => {
    const err = (j.error_message || '(no message)').slice(0, 150);
    byError[err] = (byError[err]||0)+1;
  });

  console.log('\nError breakdown:');
  Object.entries(byError).sort((a,b) => b[1]-a[1]).slice(0, 10).forEach(([e,c]) => {
    console.log(`  [${c}x] ${e}`);
  });

  // Also check queued
  const queued = await apiGet(
    `/rest/v1/parsing_jobs?status=eq.queued&select=id,created_at&order=created_at.asc&limit=20`
  );
  console.log(`\nQueued jobs (all time): ${Array.isArray(queued) ? queued.length : 'error'}`);
  if (Array.isArray(queued)) {
    queued.slice(0,5).forEach(j => console.log(`  id=${j.id} created=${j.created_at}`));
  }

  // Processing jobs
  const processing = await apiGet(
    `/rest/v1/parsing_jobs?status=eq.processing&select=id,created_at&order=created_at.asc&limit=20`
  );
  console.log(`\nProcessing jobs: ${Array.isArray(processing) ? processing.length : 'error'}`);
})();
