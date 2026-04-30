const https = require('https');

const SUPA = 'hncvsextwmvjydcukdwx.supabase.co';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: SUPA, path, method: 'GET',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    };
    let data = '';
    const req = https.request(opts, res => {
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
  const msgs = await apiGet(`/rest/v1/inbox_messages?source=eq.whatsapp&received_at=gte.${since}&select=id`);
  const msgIds = msgs.map(m => m.id).join(',');
  const atts = await apiGet(`/rest/v1/inbox_attachments?inbox_message_id=in.(${msgIds})&select=id,candidate_id,attachment_type`);
  const pending = atts.filter(a => (!a.attachment_type || a.attachment_type === 'cv') && !a.candidate_id);
  const pendingIds = pending.map(a => a.id).join(',');

  // Get failed jobs with error details
  const failedJobs = await apiGet(
    `/rest/v1/parsing_jobs?inbox_attachment_id=in.(${pendingIds})&status=eq.failed&select=inbox_attachment_id,error_message,created_at,updated_at&order=updated_at.desc&limit=200`
  );
  console.log(`\nFailed jobs: ${failedJobs.length}`);
  
  // Group by error message
  const byError = {};
  failedJobs.forEach(j => {
    const err = j.error_message ? j.error_message.slice(0, 120) : '(no error message)';
    byError[err] = (byError[err]||0)+1;
  });
  console.log('\nError breakdown:');
  Object.entries(byError).sort((a,b) => b[1]-a[1]).forEach(([e,c]) => console.log(`  [${c}x] ${e}`));

  // Show most recent failure
  if (failedJobs.length) {
    console.log('\nMost recent failed job:');
    const j = failedJobs[0];
    console.log(`  attachment_id: ${j.inbox_attachment_id}`);
    console.log(`  created_at:    ${j.created_at}`);
    console.log(`  updated_at:    ${j.updated_at}`);
    console.log(`  error:         ${j.error_message}`);
  }

  // Queued job details
  const queuedJobs = await apiGet(
    `/rest/v1/parsing_jobs?inbox_attachment_id=in.(${pendingIds})&status=eq.queued&select=inbox_attachment_id,created_at&limit=10`
  );
  console.log(`\nQueued jobs: ${queuedJobs.length}`);
  queuedJobs.forEach(j => console.log(`  ${j.inbox_attachment_id}  created: ${j.created_at}`));
})();
