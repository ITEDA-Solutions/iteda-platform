import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkUsers() {
    try {
        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase environment variables');
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        console.log('Checking users in database...\n');

        // Get all profiles with their roles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                created_at,
                staff_roles(role, region)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        console.log(`Found ${profiles?.length || 0} users:`);
        profiles?.forEach((user, index) => {
            const role = user.staff_roles?.[0];
            console.log(`\n${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.full_name || 'N/A'}`);
            console.log(`   Role: ${role?.role || 'N/A'}`);
            console.log(`   Region: ${role?.region || 'N/A'}`);
            console.log(`   Created: ${user.created_at}`);
        });

        if (!profiles || profiles.length === 0) {
            console.log('\n❌ No users found in the database!');
            console.log('\nℹ️  You need to create an admin user first.');
            console.log('   Create a user through the signup page.');
        }
    } catch (error) {
        console.error('Error checking users:', error);
    }
    process.exit(0);
}

checkUsers();
