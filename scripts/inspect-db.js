const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Mala%3A730591@db.yzzzcoxeqazfebyfukty.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase successfully!');
    
    // 1. Inspect table columns for occurrences
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'occurrences';
    `);
    console.log('\n--- Columns of table "occurrences" ---');
    colRes.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // 2. Query occurrences created by 'andrade'
    console.log('\n--- Occurrences by registered_by = "andrade" ---');
    const andradeRes = await client.query(`
      SELECT id, student_id, date, registered_by, school_id 
      FROM occurrences 
      WHERE registered_by = 'andrade';
    `);
    console.log(`Found ${andradeRes.rows.length} occurrences created by 'andrade'.`);
    andradeRes.rows.forEach(row => {
      console.log(`ID: ${row.id}, StudentID: ${row.student_id}, Date: ${row.date}, RegisteredBy: ${row.registered_by}, SchoolID: ${row.school_id}`);
    });

  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
