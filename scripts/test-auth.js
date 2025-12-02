const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAuth() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing authentication system...\n');
    
    // Check if admin user exists
    const userResult = await client.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      ['admin@smartdryers.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found in database');
      
      // Create admin user
      console.log('🔧 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newUserResult = await client.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
        ['admin@smartdryers.com', hashedPassword]
      );
      
      const userId = newUserResult.rows[0].id;
      
      // Create profile
      await client.query(
        'INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3)',
        [userId, 'admin@smartdryers.com', 'System Administrator']
      );
      
      // Create role
      await client.query(
        'INSERT INTO user_roles (user_id, role, region) VALUES ($1, $2, $3)',
        [userId, 'super_admin', 'Nairobi']
      );
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found in database');
      
      // Test password verification
      const user = userResult.rows[0];
      const isValidPassword = await bcrypt.compare('admin123', user.password);
      
      if (isValidPassword) {
        console.log('✅ Password verification successful');
      } else {
        console.log('❌ Password verification failed');
        
        // Update password
        console.log('🔧 Updating admin password...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await client.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [hashedPassword, 'admin@smartdryers.com']
        );
        
        console.log('✅ Password updated successfully');
      }
    }
    
    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3005/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@smartdryers.com',
          password: 'admin123'
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API signin successful');
        console.log('📧 User:', data.user.email);
        console.log('🔑 Token received:', data.token ? 'Yes' : 'No');
      } else {
        console.log('❌ API signin failed:', data.error);
      }
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
      console.log('💡 Make sure the Next.js server is running on port 3005');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

// Run the test
testAuth()
  .then(() => {
    console.log('\n✨ Authentication test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Authentication test failed:', error);
    process.exit(1);
  });
