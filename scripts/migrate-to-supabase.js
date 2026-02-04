#!/usr/bin/env node

/**
 * Migration Script for Supabase
 * 
 * This script applies all SQL migrations to your Supabase database.
 * It reads migration files from supabase/migrations/ and executes them in order.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase connection using the pooled connection URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

// Migration files in order
const MIGRATION_FILES = [
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

async function runMigrations() {
  console.log('🚀 Starting Supabase Migration Process...\n');
  
  const client = await pool.connect();
  
  try {
    // Test connection
    console.log('📡 Testing connection to Supabase...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to Supabase at:', result.rows[0].now);
    console.log('');
    
    // Create migrations tracking table if it doesn't exist
    console.log('📋 Setting up migrations tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Migrations tracking table ready\n');
    
    // Get already applied migrations
    const appliedMigrations = await client.query(
      'SELECT migration_name FROM schema_migrations'
    );
    const appliedSet = new Set(appliedMigrations.rows.map(row => row.migration_name));
    
    // Apply each migration
    for (const migrationFile of MIGRATION_FILES) {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migrationFile}`);
        continue;
      }
      
      if (appliedSet.has(migrationFile)) {
        console.log(`⏭️  Skipping (already applied): ${migrationFile}`);
        continue;
      }
      
      console.log(`📦 Applying migration: ${migrationFile}`);
      
      try {
        // Read migration file
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Start transaction
        await client.query('BEGIN');
        
        // Execute migration
        await client.query(migrationSQL);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [migrationFile]
        );
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`✅ Successfully applied: ${migrationFile}\n`);
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error(`❌ Error applying ${migrationFile}:`, error.message);
        console.error('Migration rolled back. Stopping process.\n');
        throw error;
      }
    }
    
    console.log('🎉 All migrations applied successfully!');
    console.log('\n📊 Migration Summary:');
    const summary = await client.query(
      'SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at'
    );
    summary.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.migration_name} (${new Date(row.applied_at).toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✅ Migration process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });
