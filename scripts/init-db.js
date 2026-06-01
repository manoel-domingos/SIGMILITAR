const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres: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@db.imprdimqcjbndqewioyt.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase successfully!');
    
    // Read and execute database.sql
    if (fs.existsSync('database.sql')) {
      console.log('Skipping database.sql, already executed.');
    }

    // Read and execute update_schema.sql
    if (fs.existsSync('update_schema.sql')) {
      const updateSql = fs.readFileSync('update_schema.sql', 'utf8');
      console.log('Executing update_schema.sql...');
      await client.query(updateSql);
      console.log('Successfully executed update_schema.sql');
    }

  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
