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

// User to create
const user = {
    email: 'Sean.Davy@est.org.uk',
    password: 'Password',
    fullName: 'Sean Davy',
    phone: null,
    role: 'admin',
    region: 'Central' // Default region, can be changed
};

async function seedUser() {
    console.log('🌱 Creating user account for Sean Davy...\n');

    const client = await pool.connect();

    try {
        // Check if user already exists in Supabase Auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.find(u => u.email === user.email);

        if (userExists) {
            console.log(`⚠️  User ${user.email} already exists in Supabase Auth`);
            console.log('   User ID:', userExists.id);

            // Check if profile exists
            const profileCheck = await client.query(
                'SELECT * FROM profiles WHERE id = $1',
                [userExists.id]
            );

            if (profileCheck.rows.length > 0) {
                console.log('✅ Profile already exists');
            } else {
                console.log('⚠️  Profile missing, creating...');
                await client.query(
                    `INSERT INTO profiles (id, email, full_name, phone, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                    [userExists.id, user.email, user.fullName, user.phone]
                );
                console.log('✅ Profile created');
            }

            // Check if role exists
            const roleCheck = await client.query(
                'SELECT * FROM staff_roles WHERE staff_id = $1 AND role = $2',
                [userExists.id, user.role]
            );

            if (roleCheck.rows.length > 0) {
                console.log('✅ Admin role already assigned');
            } else {
                console.log('⚠️  Admin role missing, assigning...');
                await client.query(
                    `INSERT INTO staff_roles (staff_id, role, region, created_at)
           VALUES ($1, $2, $3, NOW())`,
                    [userExists.id, user.role, user.region]
                );
                console.log('✅ Admin role assigned');
            }

            console.log('\n✨ User setup completed!');
            return;
        }

        // Create user in Supabase Auth
        console.log('Creating user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: user.fullName,
            }
        });

        if (authError) {
            throw authError;
        }

        console.log(`✅ Created auth user: ${user.email}`);
        console.log(`   User ID: ${authData.user.id}`);

        // Create profile in public.profiles
        console.log('Creating user profile...');
        await client.query(
            `INSERT INTO profiles (id, email, full_name, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [authData.user.id, user.email, user.fullName, user.phone]
        );

        console.log(`✅ Created profile: ${user.fullName}`);

        // Create staff role
        console.log('Assigning admin role...');
        await client.query(
            `INSERT INTO staff_roles (staff_id, role, region, created_at)
       VALUES ($1, $2, $3, NOW())`,
            [authData.user.id, user.role, user.region]
        );

        console.log(`✅ Assigned role: ${user.role} in ${user.region}\n`);

        console.log('🎉 User created successfully!\n');
        console.log('📋 Account Details:');
        console.log('┌─────────────────────────────┬───────────────────────────┐');
        console.log('│ Field                       │ Value                     │');
        console.log('├─────────────────────────────┼───────────────────────────┤');
        console.log(`│ Email                       │ ${user.email.padEnd(25)} │`);
        console.log(`│ Password                    │ ${user.password.padEnd(25)} │`);
        console.log(`│ Full Name                   │ ${user.fullName.padEnd(25)} │`);
        console.log(`│ Role                        │ ${user.role.padEnd(25)} │`);
        console.log(`│ Region                      │ ${user.region.padEnd(25)} │`);
        console.log('└─────────────────────────────┴───────────────────────────┘\n');
        console.log('✨ You can now sign in at: http://localhost:3000/auth');
        console.log('⚠️  Remember to change the password after first login!\n');

    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed user:', error);
        process.exit(1);
    });
