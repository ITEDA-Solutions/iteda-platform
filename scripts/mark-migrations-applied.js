#!/usr/bin/env node

/**
 * Mark Migrations as Applied
 * This script marks all existing migrations as applied in the schema_migrations table
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') 
    ? { rejectUnauthorized: false }
    : false,
});

const MIGRATIONS = [
  '20240128_rbac_system.sql',
  '20240128_dryer_management.sql',
  '20240128_data_collection.sql',
  '20240128_alerts_notifications.sql',
  '20240128_alerts_fix.sql',
  '20240129_seed_presets.sql',
  '20240129_system_settings.sql',
  '20251121080345_8432fcf4-4059-4d14-ae3f-9ab27c7b6453.sql',
  '20251121080354_f37cd982-2767-4500-9ef4-292d9e88e263.sql',
];

async function markMigrationsAsApplied() {
  console.log('📝 Marking migrations as applied...\n');
  
  const client = await pool.connect();
  
  try {
    for (const migration of MIGRATIONS) {
      try {
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
          [migration]
        );
        console.log(`✅ Marked as applied: ${migration}`);
      } catch (error) {
        console.error(`❌ Error marking ${migration}:`, error.message);
      }
    }
    
    console.log('\n✅ All migrations marked as applied!');
    
    // Show current migration status
    const result = await client.query(
      'SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at'
    );
    console.log('\n📋 Migration History:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.migration_name} (${new Date(row.applied_at).toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

markMigrationsAsApplied()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
