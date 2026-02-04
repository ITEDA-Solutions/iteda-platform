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

const sampleUsers = [
  {
    email: 'admin@smartdryers.com',
    password: 'admin123',
    fullName: 'System Administrator',
    phone: '+254700000001',
    role: 'super_admin',
    region: 'Nairobi'
  },
  {
    email: 'john.manager@smartdryers.com',
    password: 'manager123',
    fullName: 'John Kamau',
    phone: '+254700000002',
    role: 'admin',
    region: 'Central'
  },
  {
    email: 'mary.regional@smartdryers.com',
    password: 'regional123',
    fullName: 'Mary Wanjiku',
    phone: '+254700000003',
    role: 'regional_manager',
    region: 'Rift Valley'
  },
  {
    email: 'peter.tech@smartdryers.com',
    password: 'tech123',
    fullName: 'Peter Ochieng',
    phone: '+254700000004',
    role: 'field_technician',
    region: 'Western'
  },
  {
    email: 'grace.tech@smartdryers.com',
    password: 'tech123',
    fullName: 'Grace Muthoni',
    phone: '+254700000005',
    role: 'field_technician',
    region: 'Coast'
  },
  {
    email: 'samuel.manager@smartdryers.com',
    password: 'regional123',
    fullName: 'Samuel Kipchoge',
    phone: '+254700000006',
    role: 'regional_manager',
    region: 'Eastern'
  },
  {
    email: 'alice.tech@smartdryers.com',
    password: 'tech123',
    fullName: 'Alice Nyambura',
    phone: '+254700000007',
    role: 'field_technician',
    region: 'Nyanza'
  },
  {
    email: 'david.admin@smartdryers.com',
    password: 'admin123',
    fullName: 'David Mutua',
    phone: '+254700000008',
    role: 'admin',
    region: 'North Eastern'
  }
];

async function seedUsers() {
  console.log('🌱 Starting Supabase user seeding...\n');
  
  const client = await pool.connect();
  let created = 0;
  let skipped = 0;

  try {
    for (const user of sampleUsers) {
      try {
        // Check if user already exists in Supabase Auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.find(u => u.email === user.email);

        if (userExists) {
          console.log(`⏭️  Skipping ${user.email} (already exists in Supabase Auth)`);
          skipped++;
          continue;
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
          }
        });

        if (authError) {
          throw authError;
        }

        console.log(`✅ Created auth user: ${user.email}`);

        // Create profile in public.profiles
        await client.query(
          `INSERT INTO profiles (id, email, full_name, phone, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET 
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             updated_at = NOW()`,
          [authData.user.id, user.email, user.fullName, user.phone]
        );

        console.log(`✅ Created profile: ${user.fullName}`);

        // Get or create region
        const regionResult = await client.query(
          'SELECT id FROM regions WHERE name = $1',
          [user.region]
        );

        let regionId;
        if (regionResult.rows.length === 0) {
          const newRegion = await client.query(
            `INSERT INTO regions (name, code, created_at)
             VALUES ($1, $2, NOW())
             RETURNING id`,
            [user.region, user.region.toLowerCase().replace(/\s+/g, '_')]
          );
          regionId = newRegion.rows[0].id;
        } else {
          regionId = regionResult.rows[0].id;
        }

        // Create staff role
        await client.query(
          `INSERT INTO staff_roles (staff_id, role, region, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (staff_id, role) DO UPDATE SET
             region = EXCLUDED.region`,
          [authData.user.id, user.role, regionId]
        );

        console.log(`✅ Assigned role: ${user.role} in ${user.region}\n`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }

    console.log('\n🎉 User seeding completed!');
    console.log('📊 Summary:');
    console.log(`   - Created: ${created} users`);
    console.log(`   - Skipped: ${skipped} users (already exist)`);
    console.log(`   - Total: ${sampleUsers.length} users processed\n`);

    console.log('👥 User Accounts Created:');
    console.log('┌─────────────────────────────────┬──────────────────┬─────────────────┐');
    console.log('│ Email                           │ Role             │ Region          │');
    console.log('├─────────────────────────────────┼──────────────────┼─────────────────┤');
    sampleUsers.forEach(user => {
      console.log(
        `│ ${user.email.padEnd(31)} │ ${user.role.padEnd(16)} │ ${user.region.padEnd(15)} │`
      );
    });
    console.log('└─────────────────────────────────┴──────────────────┴─────────────────┘\n');

    console.log('🔑 Default Passwords:');
    console.log('   - Admins: admin123');
    console.log('   - Regional Managers: regional123 or manager123');
    console.log('   - Field Technicians: tech123\n');
    console.log('⚠️  IMPORTANT: Change these passwords in production!\n');
    console.log('✨ Seeding process completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed users:', error);
    process.exit(1);
  });
