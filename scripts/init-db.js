#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Read and execute seed data
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Seeding database with sample data...');
    await pool.query(seedData);
    console.log('✅ Database seeded successfully');

    // Verify the setup
    const result = await pool.query('SELECT COUNT(*) as count FROM threat_data WHERE is_active = true');
    console.log(`✅ Database initialized with ${result.rows[0].count} active threat records`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };