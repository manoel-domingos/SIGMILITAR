const { Client } = require('pg');
const oldConnectionString = 'postgresql://postgres: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@db.imprdimqcjbndqewioyt.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: oldConnectionString });
  try {
    await client.connect();
    console.log('Connected to old database successfully!');
    
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'students';
    `);
    
    console.log('\n--- Columns of old "students" table ---');
    res.rows.forEach(r => {
      console.log(`- ${r.column_name}: ${r.data_type}`);
    });
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
