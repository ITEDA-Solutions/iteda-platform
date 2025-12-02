const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function showDatabaseSummary() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Smart Dry Monitor Database Summary');
    console.log('=====================================\n');
    
    // Users summary
    const usersResult = await client.query(`
      SELECT 
        u.email,
        p.full_name,
        ur.role,
        ur.region
      FROM users u
      JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON p.id = ur.user_id
      ORDER BY ur.role, p.full_name
    `);
    
    console.log('👥 USERS (' + usersResult.rows.length + ' total)');
    console.log('┌─────────────────────────────────┬─────────────────────┬──────────────────┬─────────────────┐');
    console.log('│ Email                           │ Full Name           │ Role             │ Region          │');
    console.log('├─────────────────────────────────┼─────────────────────┼──────────────────┼─────────────────┤');
    
    usersResult.rows.forEach(user => {
      const email = (user.email || '').padEnd(31);
      const name = (user.full_name || '').padEnd(19);
      const role = (user.role || '').padEnd(16);
      const region = (user.region || '').padEnd(15);
      console.log(`│ ${email} │ ${name} │ ${role} │ ${region} │`);
    });
    
    console.log('└─────────────────────────────────┴─────────────────────┴──────────────────┴─────────────────┘\n');
    
    // Dryer owners summary
    const ownersResult = await client.query(`
      SELECT 
        name,
        farm_business_name,
        phone,
        email
      FROM dryer_owners
      ORDER BY name
    `);
    
    console.log('🏢 DRYER OWNERS (' + ownersResult.rows.length + ' total)');
    console.log('┌─────────────────────┬─────────────────────────┬─────────────────┬─────────────────────────┐');
    console.log('│ Name                │ Business Name           │ Phone           │ Email                   │');
    console.log('├─────────────────────┼─────────────────────────┼─────────────────┼─────────────────────────┤');
    
    ownersResult.rows.forEach(owner => {
      const name = (owner.name || '').padEnd(19);
      const business = (owner.farm_business_name || '').padEnd(23);
      const phone = (owner.phone || '').padEnd(15);
      const email = (owner.email || '').padEnd(23);
      console.log(`│ ${name} │ ${business} │ ${phone} │ ${email} │`);
    });
    
    console.log('└─────────────────────┴─────────────────────────┴─────────────────┴─────────────────────────┘\n');
    
    // Dryers summary
    const dryersResult = await client.query(`
      SELECT 
        d.dryer_id,
        d.status,
        d.battery_level,
        owners.name as owner_name,
        r.name as region_name
      FROM dryers d
      LEFT JOIN dryer_owners owners ON d.owner_id = owners.id
      LEFT JOIN regions r ON d.region_id = r.id
      ORDER BY d.dryer_id
    `);
    
    console.log('🏭 DRYERS (' + dryersResult.rows.length + ' total)');
    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────────────┬─────────────────┐');
    console.log('│ Dryer ID        │ Status      │ Battery %   │ Owner               │ Region          │');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────────────┼─────────────────┤');
    
    dryersResult.rows.forEach(dryer => {
      const id = (dryer.dryer_id || '').padEnd(15);
      const status = (dryer.status || '').padEnd(11);
      const battery = (dryer.battery_level ? dryer.battery_level + '%' : 'N/A').padEnd(11);
      const owner = (dryer.owner_name || '').padEnd(19);
      const region = (dryer.region_name || '').padEnd(15);
      console.log(`│ ${id} │ ${status} │ ${battery} │ ${owner} │ ${region} │`);
    });
    
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────────────┴─────────────────┘\n');
    
    // Status distribution
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM dryers 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('📈 DRYER STATUS DISTRIBUTION');
    statusResult.rows.forEach(row => {
      const percentage = ((row.count / dryersResult.rows.length) * 100).toFixed(1);
      console.log(`   ${row.status.padEnd(12)}: ${row.count.toString().padStart(2)} dryers (${percentage}%)`);
    });
    
    // Regions summary
    const regionsResult = await client.query(`
      SELECT 
        r.name,
        r.code,
        COUNT(d.id) as dryer_count
      FROM regions r
      LEFT JOIN dryers d ON r.id = d.region_id
      GROUP BY r.id, r.name, r.code
      ORDER BY dryer_count DESC, r.name
    `);
    
    console.log('\n🗺️  REGIONS (' + regionsResult.rows.length + ' total)');
    regionsResult.rows.forEach(region => {
      console.log(`   ${region.name.padEnd(15)} (${region.code}): ${region.dryer_count} dryers`);
    });
    
    // Presets summary
    const presetsResult = await client.query(`
      SELECT crop_type, COUNT(*) as count
      FROM presets
      WHERE is_active = true
      GROUP BY crop_type
      ORDER BY count DESC
    `);
    
    console.log('\n🌾 ACTIVE PRESETS BY CROP');
    presetsResult.rows.forEach(preset => {
      console.log(`   ${preset.crop_type.padEnd(10)}: ${preset.count} presets`);
    });
    
    console.log('\n🔑 LOGIN CREDENTIALS');
    console.log('===================');
    console.log('Super Admin: admin@smartdryers.com / admin123');
    console.log('Admin:       john.manager@smartdryers.com / manager123');
    console.log('Regional:    mary.regional@smartdryers.com / regional123');
    console.log('Technician:  peter.tech@smartdryers.com / tech123');
    console.log('\n⚠️  Remember to change passwords in production!');
    
  } catch (error) {
    console.error('❌ Error getting database summary:', error);
  } finally {
    client.release();
  }
}

// Run the summary
showDatabaseSummary()
  .then(() => {
    console.log('\n✨ Database summary completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database summary failed:', error);
    process.exit(1);
  });
