const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:0U833Rm5lpgOssHjVaVna3k0TRBK6FcF@bd.sigmilitar.com.br:5432/postgres';

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to VPS Postgres Database successfully!');

    // 1. Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Get already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations;');
    const appliedSet = new Set(appliedRes.rows.map(r => r.version));

    // 3. Get all migration files on disk
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sorts chronologically

    console.log(`Found ${files.length} migrations on disk.`);

    // If initial run failed but some tables were created, let's manually mark 0001 and 0002 as applied
    // if the students table already exists to avoid duplicate table/type creation errors.
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'students'
      );
    `);
    const studentsTableExists = tableCheck.rows[0].exists;
    if (studentsTableExists) {
      if (!appliedSet.has('0001_initial_schema.sql')) {
        await client.query("INSERT INTO schema_migrations (version) VALUES ('0001_initial_schema.sql') ON CONFLICT DO NOTHING;");
        appliedSet.add('0001_initial_schema.sql');
        console.log('Detected existing tables. Marked 0001_initial_schema.sql as already applied.');
      }
      if (!appliedSet.has('0002_occurrence_measures.sql')) {
        await client.query("INSERT INTO schema_migrations (version) VALUES ('0002_occurrence_measures.sql') ON CONFLICT DO NOTHING;");
        appliedSet.add('0002_occurrence_measures.sql');
        console.log('Detected existing measures column. Marked 0002_occurrence_measures.sql as already applied.');
      }
    }

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`\n--------------------------------------------`);
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Run migration inside transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`SUCCESS: ${file} executed successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`ERROR running ${file}:`, err.message);
        console.error('Rolling back migration.');
        throw err;
      }
    }

    console.log('\n============================================');
    console.log('ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('\nMigration run failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
