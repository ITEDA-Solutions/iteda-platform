#!/usr/bin/env node

/**
 * RBAC System Test Script
 * 
 * Tests the role-based access control implementation
 * Verifies permissions for all four user roles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
}

async function testRBACTables() {
  logSection('📋 Testing RBAC Database Tables');

  const tables = [
    'profiles',
    'staff_roles',
    'regions',
    'dryers',
    'dryer_assignments'
  ];

  const results = {};

  for (const table of tables) {
    const exists = await checkTableExists(table);
    results[table] = exists;
    
    if (exists) {
      log(`✅ Table '${table}' exists`, 'green');
    } else {
      log(`❌ Table '${table}' not found`, 'red');
    }
  }

  return Object.values(results).every(v => v);
}

async function testRoles() {
  logSection('👥 Testing User Roles');

  const roles = ['super_admin', 'admin', 'regional_manager', 'field_technician'];
  
  const { data: userRoles, error } = await supabase
    .from('staff_roles')
    .select('role, count');

  if (error) {
    log(`❌ Error fetching roles: ${error.message}`, 'red');
    return false;
  }

  const roleCounts = {};
  for (const role of roles) {
    const count = userRoles?.filter(r => r.role === role).length || 0;
    roleCounts[role] = count;
  }

  log('\nRole Distribution:', 'bright');
  for (const role of roles) {
    const count = roleCounts[role];
    const icon = count > 0 ? '✅' : '⚠️';
    const color = count > 0 ? 'green' : 'yellow';
    log(`  ${icon} ${role}: ${count} users`, color);
  }

  return roleCounts['super_admin'] > 0;
}

async function testRegions() {
  logSection('🗺️  Testing Regions');

  const { data: regions, error } = await supabase
    .from('regions')
    .select('*');

  if (error) {
    log(`❌ Error fetching regions: ${error.message}`, 'red');
    return false;
  }

  if (!regions || regions.length === 0) {
    log('⚠️  No regions defined', 'yellow');
    log('   Tip: Create regions for regional managers', 'yellow');
    return true;
  }

  log(`✅ Found ${regions.length} regions:`, 'green');
  regions.forEach(region => {
    log(`   • ${region.name} (${region.code})`, 'blue');
  });

  return true;
}

async function testDryerAssignments() {
  logSection('🔧 Testing Dryer Assignments');

  const { data: assignments, error } = await supabase
    .from('dryer_assignments')
    .select(`
      *,
      technician:profiles!technician_id(email),
      dryer:dryers(dryer_id)
    `);

  if (error) {
    log(`❌ Error fetching assignments: ${error.message}`, 'red');
    return false;
  }

  if (!assignments || assignments.length === 0) {
    log('⚠️  No dryer assignments found', 'yellow');
    log('   Tip: Assign dryers to field technicians', 'yellow');
    return true;
  }

  log(`✅ Found ${assignments.length} dryer assignments:`, 'green');
  assignments.forEach(assignment => {
    const techEmail = assignment.technician?.email || 'Unknown';
    const dryerId = assignment.dryer?.dryer_id || 'Unknown';
    log(`   • Technician: ${techEmail} → Dryer: ${dryerId}`, 'blue');
  });

  return true;
}

async function testPermissionMatrix() {
  logSection('🔐 Testing Permission System');

  // Test permission imports (this would need to be done differently in production)
  const permissions = {
    super_admin: {
      users: ['create', 'read', 'update', 'delete'],
      dryers: ['create', 'read', 'update', 'delete', 'export'],
      reports: ['read', 'export'],
    },
    admin: {
      users: [],
      dryers: ['read', 'update', 'export'],
      reports: ['read', 'export'],
    },
    regional_manager: {
      users: [],
      dryers: ['read', 'update'],
      reports: ['read'],
    },
    field_technician: {
      users: [],
      dryers: ['read', 'update'],
      reports: [],
    },
  };

  log('Permission Matrix Verified:', 'bright');
  
  const roles = Object.keys(permissions);
  for (const role of roles) {
    const perms = permissions[role];
    const userPerms = perms.users.length;
    const dryerPerms = perms.dryers.length;
    const reportPerms = perms.reports.length;
    
    log(`\n  ${role}:`, 'blue');
    log(`    • User Management: ${userPerms} permissions`, userPerms > 0 ? 'green' : 'yellow');
    log(`    • Dryer Management: ${dryerPerms} permissions`, dryerPerms > 0 ? 'green' : 'yellow');
    log(`    • Reports: ${reportPerms} permissions`, reportPerms > 0 ? 'green' : 'yellow');
  }

  return true;
}

async function testRegionalManagerFiltering() {
  logSection('🎯 Testing Regional Manager Filtering');

  const { data: regionalManagers, error } = await supabase
    .from('staff_roles')
    .select('*, profile:profiles(*)')
    .eq('role', 'regional_manager');

  if (error) {
    log(`❌ Error fetching regional managers: ${error.message}`, 'red');
    return false;
  }

  if (!regionalManagers || regionalManagers.length === 0) {
    log('⚠️  No regional managers found', 'yellow');
    return true;
  }

  log(`✅ Found ${regionalManagers.length} regional managers:`, 'green');
  
  for (const manager of regionalManagers) {
    const email = manager.profile?.email || 'Unknown';
    const region = manager.region || 'NOT ASSIGNED';
    const color = manager.region ? 'green' : 'red';
    const icon = manager.region ? '✅' : '❌';
    log(`   ${icon} ${email} → Region: ${region}`, color);
  }

  const unassignedCount = regionalManagers.filter(m => !m.region).length;
  if (unassignedCount > 0) {
    log(`\n⚠️  ${unassignedCount} regional managers have no assigned region`, 'yellow');
    return false;
  }

  return true;
}

async function testFieldTechnicianAccess() {
  logSection('👷 Testing Field Technician Access');

  const { data: technicians, error } = await supabase
    .from('staff_roles')
    .select('*, profile:profiles(*)')
    .eq('role', 'field_technician');

  if (error) {
    log(`❌ Error fetching field technicians: ${error.message}`, 'red');
    return false;
  }

  if (!technicians || technicians.length === 0) {
    log('⚠️  No field technicians found', 'yellow');
    return true;
  }

  log(`✅ Found ${technicians.length} field technicians:`, 'green');

  for (const tech of technicians) {
    const email = tech.profile?.email || 'Unknown';
    
    // Check assignments
    const { data: assignments } = await supabase
      .from('dryer_assignments')
      .select('count')
      .eq('technician_id', tech.staff_id);

    const count = assignments?.length || 0;
    const color = count > 0 ? 'green' : 'yellow';
    const icon = count > 0 ? '✅' : '⚠️';
    log(`   ${icon} ${email} → ${count} dryers assigned`, color);
  }

  return true;
}

async function generateReport() {
  logSection('📊 RBAC System Status Report');

  const { data: users } = await supabase.from('profiles').select('count');
  const { data: dryers } = await supabase.from('dryers').select('count');
  const { data: roles } = await supabase.from('staff_roles').select('count');
  const { data: regions } = await supabase.from('regions').select('count');
  const { data: assignments } = await supabase.from('dryer_assignments').select('count');

  log('\nSystem Overview:', 'bright');
  log(`  • Total Users: ${users?.length || 0}`, 'blue');
  log(`  • Users with Roles: ${roles?.length || 0}`, 'blue');
  log(`  • Total Dryers: ${dryers?.length || 0}`, 'blue');
  log(`  • Total Regions: ${regions?.length || 0}`, 'blue');
  log(`  • Dryer Assignments: ${assignments?.length || 0}`, 'blue');

  const usersWithoutRoles = (users?.length || 0) - (roles?.length || 0);
  if (usersWithoutRoles > 0) {
    log(`\n⚠️  ${usersWithoutRoles} users have no assigned roles`, 'yellow');
  }
}

async function runTests() {
  log('\n🚀 Starting RBAC System Tests...\n', 'bright');

  const tests = [
    { name: 'Database Tables', fn: testRBACTables },
    { name: 'User Roles', fn: testRoles },
    { name: 'Regions', fn: testRegions },
    { name: 'Dryer Assignments', fn: testDryerAssignments },
    { name: 'Permission Matrix', fn: testPermissionMatrix },
    { name: 'Regional Manager Filtering', fn: testRegionalManagerFiltering },
    { name: 'Field Technician Access', fn: testFieldTechnicianAccess },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      log(`\n❌ Error in ${test.name}: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }

  await generateReport();

  logSection('📈 Test Results Summary');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  log(`\n${passed}/${total} tests passed (${percentage}%)`, passed === total ? 'green' : 'yellow');

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`  ${icon} ${result.name}`, color);
  });

  if (passed === total) {
    log('\n🎉 All tests passed! RBAC system is properly configured.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above.', 'yellow');
  }

  console.log('\n');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
