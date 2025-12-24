const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPostGIS() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing PostGIS extension...');
    
    // Check if PostGIS is installed
    const extensionResult = await pool.query(`
      SELECT * FROM pg_extension WHERE extname = 'postgis'
    `);
    
    if (extensionResult.rows.length === 0) {
      console.log('❌ PostGIS extension not found');
      console.log('Attempting to create PostGIS extension...');
      await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
      console.log('✅ PostGIS extension created');
    } else {
      console.log('✅ PostGIS extension found');
    }

    // Test PostGIS functions
    console.log('Testing PostGIS functions...');
    const result = await pool.query(`
      SELECT ST_MakeEnvelope(-180, -90, 180, 90, 4326) as envelope
    `);
    console.log('✅ PostGIS functions working');

    // Test our data
    console.log('Testing threat data query...');
    const threatResult = await pool.query(`
      SELECT COUNT(*) as count FROM threat_data 
      WHERE ST_Within(coordinates, ST_MakeEnvelope(-180, -90, 180, 90, 4326))
    `);
    console.log(`✅ Found ${threatResult.rows[0].count} threats in global bounds`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPostGIS();