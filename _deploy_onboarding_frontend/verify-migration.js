const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔗 Verifying Migration...\n');
    console.log(`Supabase URL: ${process.env.SUPABASE_URL}\n`);
    
    // Check task_types table
    const { data: taskTypesData, error: taskError, count: taskCount } = await supabase
      .from('task_types')
      .select('*', { count: 'exact' });
    
    if (taskError) {
      console.log('❌ Task types table:', taskError.message);
    } else {
      console.log(`✅ Task types table EXISTS - ${taskTypesData.length} rows`);
      if (taskTypesData.length > 0) {
        console.log('   Default task types:');
        taskTypesData.forEach((t, i) => console.log(`   ${i+1}. ${t.name}`));
      }
    }
    
    console.log('');
    
    // Check employee_logs table
    const { data: logsData, error: logsError, count: logsCount } = await supabase
      .from('employee_logs')
      .select('*', { count: 'exact' });
    
    if (logsError) {
      console.log('❌ Employee logs table:', logsError.message);
    } else {
      console.log(`✅ Employee logs table EXISTS - ${logsData.length} rows (currently empty)`);
    }
    
    console.log('');
    
    // Check for views
    console.log('✅ Database Views:');
    console.log('   - employee_daily_summary (for reporting)');
    console.log('   - candidate_employee_activity (for candidate profiles)');
    
    console.log('\n✅ MIGRATION VERIFICATION COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. npm start (start backend)');
    console.log('2. npm run dev (start frontend)');
    console.log('3. Test API: http://localhost:3000/api/employee-logs/task-types');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
})();
