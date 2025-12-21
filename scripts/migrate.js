#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }

    // Check which migrations have already been applied
    const appliedResult = await pool.query(`
      SELECT version FROM schema_migrations 
      WHERE version IS NOT NULL
    `).catch(() => ({ rows: [] })); // Table might not exist yet

    const appliedMigrations = new Set(appliedResult.rows.map(row => row.version));

    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${appliedMigrations.size} migrations already applied`);

    // Run pending migrations
    let appliedCount = 0;
    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');
      
      if (appliedMigrations.has(version)) {
        console.log(`⏭️  Skipping ${version} (already applied)`);
        continue;
      }

      console.log(`🔄 Applying migration: ${version}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await pool.query(migrationSql);
        console.log(`✅ Applied migration: ${version}`);
        appliedCount++;
      } catch (error) {
        console.error(`❌ Failed to apply migration ${version}:`, error.message);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Successfully applied ${appliedCount} migrations`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };