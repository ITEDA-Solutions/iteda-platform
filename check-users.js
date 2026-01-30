import { db } from './src/lib/db.js';
import { users, profiles, userRoles } from './src/lib/schema.js';
import { eq } from 'drizzle-orm';

async function checkUsers() {
    try {
        console.log('Checking users in database...\n');

        const allUsers = await db
            .select({
                id: users.id,
                email: users.email,
                createdAt: users.createdAt,
                fullName: profiles.fullName,
                role: userRoles.role,
            })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.id))
            .leftJoin(userRoles, eq(profiles.id, userRoles.userId));

        console.log(`Found ${allUsers.length} users:`);
        allUsers.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.fullName || 'N/A'}`);
            console.log(`   Role: ${user.role || 'N/A'}`);
            console.log(`   Created: ${user.createdAt}`);
        });

        if (allUsers.length === 0) {
            console.log('\n❌ No users found in the database!');
            console.log('You need to create an admin user first.');
        }
    } catch (error) {
        console.error('Error checking users:', error);
    }
    process.exit(0);
}

checkUsers();
