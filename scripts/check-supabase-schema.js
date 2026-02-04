#!/usr/bin/env node

/**
 * Check Supabase Schema
 * This script checks what tables, functions, and policies exist in your Supabase database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') 
    ? { rejectUnauthorized: false }
    : false,
});

async function checkSchema() {
  console.log('🔍 Checking Supabase Schema...\n');
  
  const client = await pool.connect();
  
  try {
    // Check tables
    console.log('📊 Tables:');
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name} (${row.column_count} columns)`);
    });
    console.log(`  Total: ${tables.rows.length} tables\n`);
    
    // Check views
    console.log('👁️  Views:');
    const views = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    if (views.rows.length > 0) {
      views.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('  None found');
    }
    console.log(`  Total: ${views.rows.length} views\n`);
    
    // Check functions
    console.log('⚙️  Functions:');
    const functions = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    if (functions.rows.length > 0) {
      functions.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.routine_name} (${row.routine_type})`);
      });
    } else {
      console.log('  None found');
    }
    console.log(`  Total: ${functions.rows.length} functions\n`);
    
    // Check Row Level Security Policies
    console.log('🔐 RLS Policies:');
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    if (policies.rows.length > 0) {
      let currentTable = '';
      policies.rows.forEach((row, index) => {
        if (row.tablename !== currentTable) {
          if (currentTable !== '') console.log('');
          console.log(`  Table: ${row.tablename}`);
          currentTable = row.tablename;
        }
        console.log(`    - ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('  None found');
    }
    console.log(`  Total: ${policies.rows.length} policies\n`);
    
    // Check indexes
    console.log('🗂️  Indexes:');
    const indexes = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    if (indexes.rows.length > 0) {
      let currentTable = '';
      let count = 0;
      indexes.rows.forEach((row) => {
        if (row.tablename !== currentTable) {
          if (currentTable !== '') console.log('');
          console.log(`  Table: ${row.tablename}`);
          currentTable = row.tablename;
          count = 0;
        }
        count++;
        console.log(`    ${count}. ${row.indexname}`);
      });
    } else {
      console.log('  None found');
    }
    console.log(`  Total: ${indexes.rows.length} indexes\n`);
    
    // Check migrations tracking
    console.log('📋 Migration History:');
    try {
      const migrations = await client.query(`
        SELECT migration_name, applied_at
        FROM schema_migrations
        ORDER BY applied_at
      `);
      if (migrations.rows.length > 0) {
        migrations.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ${row.migration_name} (${new Date(row.applied_at).toLocaleString()})`);
        });
      } else {
        console.log('  No migrations tracked yet');
      }
      console.log(`  Total: ${migrations.rows.length} migrations\n`);
    } catch (error) {
      console.log('  schema_migrations table does not exist yet\n');
    }
    
    console.log('✅ Schema check complete!');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
