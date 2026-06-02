const { Client } = require('pg');

const oldConnectionString = 'postgresql://postgres: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@db.imprdimqcjbndqewioyt.supabase.co:5432/postgres';

async function checkAuthSchema() {
  const client = new Client({ connectionString: oldConnectionString });
  try {
    await client.connect();
    console.log('Connected to old Cloud database!');
    
    // Check tables in 'auth' schema
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('Tables in auth schema:', tablesRes.rows.map(r => r.table_name));

    // Let's check if there are other schemas related to config or auth
    // Note: Supabase stores some configurations in internal tables if they exist

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkAuthSchema();
