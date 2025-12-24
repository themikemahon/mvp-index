const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing Neon connection with pg package...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  console.log('Connection string:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting to connect...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      console.log('Error closing pool:', e.message);
    }
  }
}

testConnection();