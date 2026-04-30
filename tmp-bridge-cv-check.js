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

  // 1. Get whatsapp messages
  const msgs = await apiGet(`/rest/v1/inbox_messages?source=eq.whatsapp&received_at=gte.${since}&select=id`);
  console.log(`WhatsApp messages (72h): ${msgs.length}`);
  if (!msgs.length) return;

  const msgIds = msgs.map(m => m.id).join(',');

  // 2. Get CV attachments
  const atts = await apiGet(`/rest/v1/inbox_attachments?inbox_message_id=in.(${msgIds})&select=id,candidate_id,attachment_type`);
  const cvAtts = atts.filter(a => !a.attachment_type || a.attachment_type === 'cv');
  const pending = cvAtts.filter(a => !a.candidate_id);
  const extracted = cvAtts.filter(a => a.candidate_id);
  console.log(`CV attachments: ${cvAtts.length} total, ${extracted.length} extracted, ${pending.length} pending`);

  if (!pending.length) return;

  // 3. Check parsing jobs for pending
  const pendingIds = pending.map(a => a.id).join(',');
  const jobs = await apiGet(`/rest/v1/parsing_jobs?inbox_attachment_id=in.(${pendingIds})&select=status,created_at&limit=500`);
  console.log(`\nParsing jobs found for pending CVs: ${jobs.length}`);
  const byStatus = {};
  jobs.forEach(j => { byStatus[j.status] = (byStatus[j.status]||0)+1; });
  Object.entries(byStatus).forEach(([s,c]) => console.log(`  ${s}: ${c}`));

  const withJob = new Set(jobs.map(j => j.id));
  const noJob = pending.length - withJob.size;
  console.log(`  No parsing job at all: ${noJob}`);
})();
