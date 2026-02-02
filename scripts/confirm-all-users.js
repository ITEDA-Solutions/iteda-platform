#!/usr/bin/env node

/**
 * Confirm All Existing Users
 * This script confirms all unconfirmed users in Supabase Auth
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  console.log('🔧 Starting user confirmation process...\n');

  try {
    // Get all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${users.length} total users\n`);

    let confirmed = 0;
    let alreadyConfirmed = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (user.email_confirmed_at) {
          console.log(`✓ ${user.email} - Already confirmed`);
          alreadyConfirmed++;
          continue;
        }

        // Confirm the user
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ ${user.email} - Confirmed successfully`);
        confirmed++;

      } catch (error) {
        console.error(`❌ ${user.email} - Failed:`, error.message);
        failed++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Newly confirmed: ${confirmed}`);
    console.log(`   - Already confirmed: ${alreadyConfirmed}`);
    console.log(`   - Failed: ${failed}`);
    console.log('═══════════════════════════════════════\n');

    if (confirmed > 0) {
      console.log('✅ All unconfirmed users have been confirmed!');
      console.log('💡 Users can now sign in without email verification.\n');
    } else {
      console.log('✅ No users needed confirmation.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

confirmAllUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
