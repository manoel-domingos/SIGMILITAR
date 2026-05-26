const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Mala%3A730591@db.yzzzcoxeqazfebyfukty.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database successfully!');

    // 1. Audit before migration
    const beforeRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM occurrences 
      WHERE registered_by = 'andrade' AND school_id = 'joaobatista';
    `);
    const countBefore = parseInt(beforeRes.rows[0].count, 10);
    console.log(`Found ${countBefore} occurrences by 'andrade' in school 'joaobatista' before migration.`);

    if (countBefore === 0) {
      console.log('No occurrences found matching the criteria. Migration might have already been executed.');
      return;
    }

    // 2. Perform migration
    console.log('Migrating occurrences from school "joaobatista" to "heliodoro"...');
    const updateRes = await client.query(`
      UPDATE occurrences 
      SET school_id = 'heliodoro' 
      WHERE registered_by = 'andrade' AND school_id = 'joaobatista';
    `);
    
    console.log(`Migration successful! Affected rows: ${updateRes.rowCount}`);

    // 3. Audit after migration
    const afterRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM occurrences 
      WHERE registered_by = 'andrade' AND school_id = 'joaobatista';
    `);
    const countAfter = parseInt(afterRes.rows[0].count, 10);
    console.log(`Audit: occurrences remaining in 'joaobatista' = ${countAfter}`);

  } catch (err) {
    console.error('Error executing database migration:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
