#!/usr/bin/env node

/**
 * Assign Admin Role to User
 * This script assigns super_admin role to a user by email
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') 
    ? { rejectUnauthorized: false }
    : false,
});

async function assignAdminRole() {
  const email = process.argv[2];
  const role = process.argv[3] || 'super_admin';
  const regionName = process.argv[4] || 'Nairobi';

  if (!email) {
    console.log('Usage: npm run assign-admin <email> [role] [region]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run assign-admin user@example.com');
    console.log('  npm run assign-admin user@example.com super_admin');
    console.log('  npm run assign-admin user@example.com admin "Central"');
    console.log('  npm run assign-admin user@example.com regional_manager "Rift Valley"');
    console.log('  npm run assign-admin user@example.com field_technician "Western"');
    console.log('');
    console.log('Available roles:');
    console.log('  - super_admin (full access)');
    console.log('  - admin (manage dryers and users)');
    console.log('  - regional_manager (manage region dryers)');
    console.log('  - field_technician (assigned dryers only)');
    process.exit(0);
  }

  console.log('👤 Assigning role to user...\n');

  const client = await pool.connect();

  try {
    // Get user from Supabase Auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('💡 Available users:');
      users.forEach(u => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   User ID: ${user.id}\n`);

    // Ensure profile exists
    const profile = await client.query(
      'SELECT id FROM profiles WHERE id = $1',
      [user.id]
    );

    if (profile.rows.length === 0) {
      console.log('📝 Creating profile...');
      await client.query(
        `INSERT INTO profiles (id, email, full_name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [user.id, user.email, user.user_metadata?.full_name || user.email]
      );
      console.log('✅ Profile created\n');
    }

    // Get or create region
    let regionResult = await client.query(
      'SELECT id FROM regions WHERE name = $1',
      [regionName]
    );

    let regionId;
    if (regionResult.rows.length === 0) {
      console.log(`📍 Creating region: ${regionName}`);
      const newRegion = await client.query(
        `INSERT INTO regions (name, code, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [regionName, regionName.toLowerCase().replace(/\s+/g, '_')]
      );
      regionId = newRegion.rows[0].id;
      console.log('✅ Region created\n');
    } else {
      regionId = regionResult.rows[0].id;
    }

    // Assign role
    console.log(`🔑 Assigning role: ${role}`);
    await client.query(
      `INSERT INTO staff_roles (staff_id, role, region, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (staff_id, role) 
       DO UPDATE SET region = EXCLUDED.region, created_at = NOW()`,
      [user.id, role, regionId]
    );

    console.log(`✅ Role assigned successfully!\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('📊 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${role}`);
    console.log(`   Region: ${regionName}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✅ User can now sign in with full access!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

assignAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
