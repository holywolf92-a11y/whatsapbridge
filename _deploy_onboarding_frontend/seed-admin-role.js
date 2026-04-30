const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdminRole() {
  console.log('🔄 Updating admin user with role metadata...');
  
  try {
    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const adminUser = users.users.find(u => u.email === 'admin@falisha.com');

    if (!adminUser) {
      console.log('❌ Admin user (admin@falisha.com) not found');
      process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);
    console.log(`Current metadata:`, adminUser.user_metadata);

    // Update admin user with role in metadata
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: {
          ...adminUser.user_metadata,
          role: 'admin'
        }
      }
    );

    if (updateError) {
      console.error('❌ Error updating user:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Admin user updated successfully!');
    console.log(`New metadata:`, data.user.user_metadata);
    console.log('\n📝 Next steps:');
    console.log('1. Log out from your current session');
    console.log('2. Log in again as admin (admin@falisha.com / admin123)');
    console.log('3. You should now see the "Admin Panel" button in the sidebar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedAdminRole();
