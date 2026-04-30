const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

db.from('job_candidate_recommendations').select('id').limit(1).then(r => {
  if (r.error && r.error.code === '42P01') {
    console.log('TABLE_NOT_EXISTS');
  } else if (!r.error) {
    console.log('TABLE_EXISTS');
  } else {
    console.log('OTHER:', r.error.message, r.error.code);
  }
});
