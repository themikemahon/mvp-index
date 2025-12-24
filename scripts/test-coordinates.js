const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testCoordinates() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing coordinate data format...');
    
    const result = await pool.query(`
      SELECT id, title, coordinates 
      FROM threat_data 
      LIMIT 3
    `);
    
    console.log('Sample data:');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Coordinates:`, JSON.stringify(row.coordinates, null, 2));
      console.log(`   Type: ${typeof row.coordinates}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCoordinates();