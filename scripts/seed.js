#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    
    // Check if data already exists
    const existingData = await pool.query('SELECT COUNT(*) as count FROM threat_data');
    const existingCount = parseInt(existingData.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} records`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to add more seed data? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Seeding cancelled');
        return;
      }
    }

    // Read and execute seed data
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Seeding database with sample data...');
    await pool.query(seedData);
    
    // Get final count
    const finalData = await pool.query('SELECT COUNT(*) as count FROM threat_data WHERE is_active = true');
    const finalCount = parseInt(finalData.rows[0].count);
    
    console.log(`✅ Database seeded successfully`);
    console.log(`✅ Total active threat records: ${finalCount}`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };