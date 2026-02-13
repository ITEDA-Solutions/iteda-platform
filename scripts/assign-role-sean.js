const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase.com')
        ? { rejectUnauthorized: false }
        : false,
});

const userId = '1f448108-e695-4c39-9e9a-3c864b9f2100';
const role = 'admin';
const region = 'Central';

async function assignAdminRole() {
    const client = await pool.connect();

    try {
        console.log('🔧 Assigning admin role to Sean Davy...\n');

        // Check if role already exists
        const checkRole = await client.query(
            'SELECT * FROM staff_roles WHERE staff_id = $1 AND role = $2',
            [userId, role]
        );

        if (checkRole.rows.length > 0) {
            console.log('✅ Admin role already assigned!');
            return;
        }

        // Assign admin role
        await client.query(
            `INSERT INTO staff_roles (staff_id, role, region, created_at)
       VALUES ($1, $2, $3, NOW())`,
            [userId, role, region]
        );

        console.log('✅ Admin role assigned successfully!\n');
        console.log('📋 Role Details:');
        console.log(`   User ID: ${userId}`);
        console.log(`   Role: ${role}`);
        console.log(`   Region: ${region}\n`);
        console.log('✨ Sean Davy now has admin access!');

    } catch (error) {
        console.error('❌ Error assigning role:', error.message);
        throw error;
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
