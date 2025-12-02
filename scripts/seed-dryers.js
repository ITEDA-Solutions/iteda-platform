const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sampleOwners = [
  {
    name: 'Joseph Mwangi',
    phone: '+254722123456',
    email: 'joseph.mwangi@gmail.com',
    address: 'Kiambu County, Central Kenya',
    farmBusinessName: 'Mwangi Agribusiness Ltd',
    idNumber: '12345678'
  },
  {
    name: 'Sarah Chebet',
    phone: '+254733234567',
    email: 'sarah.chebet@yahoo.com',
    address: 'Eldoret, Rift Valley',
    farmBusinessName: 'Chebet Farm Enterprises',
    idNumber: '23456789'
  },
  {
    name: 'Michael Ouma',
    phone: '+254744345678',
    email: 'michael.ouma@gmail.com',
    address: 'Kisumu County, Nyanza',
    farmBusinessName: 'Ouma Agricultural Solutions',
    idNumber: '34567890'
  },
  {
    name: 'Grace Wanjiru',
    phone: '+254755456789',
    email: 'grace.wanjiru@hotmail.com',
    address: 'Meru County, Eastern Kenya',
    farmBusinessName: 'Wanjiru Cooperative Farm',
    idNumber: '45678901'
  },
  {
    name: 'David Kimani',
    phone: '+254766567890',
    email: 'david.kimani@gmail.com',
    address: 'Nakuru County, Rift Valley',
    farmBusinessName: 'Kimani Agro Processing',
    idNumber: '56789012'
  }
];

const generateDryers = (owners, regions) => {
  const dryers = [];
  const statuses = ['active', 'idle', 'offline', 'maintenance'];
  
  owners.forEach((owner, index) => {
    // Generate 1-3 dryers per owner
    const numDryers = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numDryers; i++) {
      const dryerNumber = String(index * 10 + i + 1).padStart(3, '0');
      const serialNumber = `SN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      dryers.push({
        dryerId: `DRY-2024-${dryerNumber}`,
        serialNumber: serialNumber,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        deploymentDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        locationLatitude: (-4 + Math.random() * 8).toFixed(6), // Kenya latitude range
        locationLongitude: (33 + Math.random() * 8).toFixed(6), // Kenya longitude range
        locationAddress: owner.address,
        regionId: regions[Math.floor(Math.random() * regions.length)].id,
        ownerId: owner.id,
        numTempSensors: 3,
        numHumiditySensors: 2,
        numFans: 1,
        numHeaters: 1,
        solarCapacityW: 200 + Math.floor(Math.random() * 300),
        batteryCapacityAh: 100 + Math.floor(Math.random() * 100),
        batteryLevel: Math.floor(Math.random() * 100),
        batteryVoltage: (11.5 + Math.random() * 2).toFixed(2),
        signalStrength: Math.floor(Math.random() * 100),
        totalRuntimeHours: Math.floor(Math.random() * 1000),
        lastCommunication: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Within last week
      });
    }
  });
  
  return dryers;
};

async function seedDryers() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting dryer and owner seeding...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get regions
    const regionsResult = await client.query('SELECT id, name FROM regions');
    const regions = regionsResult.rows;
    
    if (regions.length === 0) {
      throw new Error('No regions found. Please run the database setup script first.');
    }
    
    console.log(`📍 Found ${regions.length} regions`);
    
    // Insert owners
    console.log('\n👥 Creating dryer owners...');
    const createdOwners = [];
    
    for (const ownerData of sampleOwners) {
      // Check if owner already exists
      const existingOwner = await client.query(
        'SELECT id FROM dryer_owners WHERE email = $1',
        [ownerData.email]
      );
      
      if (existingOwner.rows.length > 0) {
        console.log(`⏭️  Owner ${ownerData.name} already exists, skipping...`);
        createdOwners.push({ ...ownerData, id: existingOwner.rows[0].id });
        continue;
      }
      
      const ownerResult = await client.query(
        `INSERT INTO dryer_owners (name, phone, email, address, farm_business_name, id_number) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [ownerData.name, ownerData.phone, ownerData.email, ownerData.address, ownerData.farmBusinessName, ownerData.idNumber]
      );
      
      const ownerId = ownerResult.rows[0].id;
      createdOwners.push({ ...ownerData, id: ownerId });
      
      console.log(`✅ Created owner: ${ownerData.name}`);
    }
    
    // Generate and insert dryers
    console.log('\n🏭 Creating dryers...');
    const dryers = generateDryers(createdOwners, regions);
    let dryersCreated = 0;
    
    for (const dryerData of dryers) {
      // Check if dryer already exists
      const existingDryer = await client.query(
        'SELECT id FROM dryers WHERE dryer_id = $1',
        [dryerData.dryerId]
      );
      
      if (existingDryer.rows.length > 0) {
        console.log(`⏭️  Dryer ${dryerData.dryerId} already exists, skipping...`);
        continue;
      }
      
      await client.query(
        `INSERT INTO dryers (
          dryer_id, serial_number, status, deployment_date, location_latitude, location_longitude,
          location_address, region_id, owner_id, num_temp_sensors, num_humidity_sensors,
          num_fans, num_heaters, solar_capacity_w, battery_capacity_ah, battery_level,
          battery_voltage, signal_strength, total_runtime_hours, last_communication
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          dryerData.dryerId, dryerData.serialNumber, dryerData.status, dryerData.deploymentDate,
          dryerData.locationLatitude, dryerData.locationLongitude, dryerData.locationAddress,
          dryerData.regionId, dryerData.ownerId, dryerData.numTempSensors, dryerData.numHumiditySensors,
          dryerData.numFans, dryerData.numHeaters, dryerData.solarCapacityW, dryerData.batteryCapacityAh,
          dryerData.batteryLevel, dryerData.batteryVoltage, dryerData.signalStrength,
          dryerData.totalRuntimeHours, dryerData.lastCommunication
        ]
      );
      
      console.log(`✅ Created dryer: ${dryerData.dryerId} (${dryerData.status})`);
      dryersCreated++;
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Dryer seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Owners: ${createdOwners.length}`);
    console.log(`   - Dryers: ${dryersCreated} created`);
    console.log(`   - Regions: ${regions.length} available`);
    
    // Show dryer summary by status
    const statusSummary = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM dryers 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 Dryer Status Summary:');
    statusSummary.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} dryers`);
    });
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
seedDryers()
  .then(() => {
    console.log('\n✨ Dryer seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Dryer seeding process failed:', error);
    process.exit(1);
  });
