const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    password: 'manager123',
    fullName: 'Samuel Kiprop',
    phone: '+254700000006',
    role: 'regional_manager',
    region: 'Eastern'
  },
  {
    email: 'alice.tech@smartdryers.com',
    password: 'tech123',
    fullName: 'Alice Nyong\'o',
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
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting user seeding...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [userData.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Insert user
        const userResult = await client.query(
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
          [userData.email, hashedPassword]
        );
        
        const userId = userResult.rows[0].id;
        
        // Insert profile
        await client.query(
          'INSERT INTO profiles (id, email, full_name, phone) VALUES ($1, $2, $3, $4)',
          [userId, userData.email, userData.fullName, userData.phone]
        );
        
        // Insert user role
        await client.query(
          'INSERT INTO user_roles (user_id, role, region) VALUES ($1, $2, $3)',
          [userId, userData.role, userData.region]
        );
        
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        createdCount++;
        
      } catch (userError) {
        console.error(`❌ Error creating user ${userData.email}:`, userError.message);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 User seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Created: ${createdCount} users`);
    console.log(`   - Skipped: ${skippedCount} users (already exist)`);
    console.log(`   - Total: ${sampleUsers.length} users processed`);
    
    // Display user summary
    console.log('\n👥 User Accounts Created:');
    console.log('┌─────────────────────────────────┬──────────────────┬─────────────────┐');
    console.log('│ Email                           │ Role             │ Region          │');
    console.log('├─────────────────────────────────┼──────────────────┼─────────────────┤');
    
    sampleUsers.forEach(user => {
      const email = user.email.padEnd(31);
      const role = user.role.padEnd(16);
      const region = user.region.padEnd(15);
      console.log(`│ ${email} │ ${role} │ ${region} │`);
    });
    
    console.log('└─────────────────────────────────┴──────────────────┴─────────────────┘');
    
    console.log('\n🔑 Default Passwords:');
    console.log('   - Admins: admin123');
    console.log('   - Regional Managers: regional123 or manager123');
    console.log('   - Field Technicians: tech123');
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
seedUsers()
  .then(() => {
    console.log('\n✨ Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });
