const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupNeonDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please check your .env.local file');
    process.exit(1);
  }

  console.log('🔗 Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Setting up Neon database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating schema...');
    await pool.query(schema);
    console.log('✅ Schema created successfully');

    // Read and execute seed data
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    console.log('🌱 Seeding data...');
    await pool.query(seedData);
    console.log('✅ Data seeded successfully');

    // Check data count
    const result = await pool.query('SELECT COUNT(*) FROM threat_data');
    console.log(`📊 Total threats in database: ${result.rows[0].count}`);

    console.log('🎉 Neon database setup complete!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupNeonDatabase();
}

module.exports = { setupNeonDatabase };