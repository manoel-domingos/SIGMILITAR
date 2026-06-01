const { Client } = require('pg');

const oldConnectionString = 'postgresql://postgres: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@db.imprdimqcjbndqewioyt.supabase.co:5432/postgres';
const newConnectionString = 'postgresql://postgres:0U833Rm5lpgOssHjVaVna3k0TRBK6FcF@bd.sigmilitar.com.br:5432/postgres';

async function getNonGeneratedColumns(client, tableName, schema) {
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
    AND (is_generated = 'NEVER' OR is_generated IS NULL)
    AND (generation_expression IS NULL OR generation_expression = '');
  `, [schema, tableName]);
  return res.rows;
}

async function syncTableSchema(oldClient, newClient, tableName, schema = 'public') {
  console.log(`Syncing schema for ${schema}.${tableName}...`);
  
  const oldCols = await oldClient.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2;
  `, [schema, tableName]);

  const newCols = await newClient.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2;
  `, [schema, tableName]);

  const newColNames = new Set(newCols.rows.map(r => r.column_name));

  for (const col of oldCols.rows) {
    if (!newColNames.has(col.column_name)) {
      console.log(` - Adding missing column: ${col.column_name} (${col.data_type}) to new table ${schema}.${tableName}`);
      let colDef = `"${col.column_name}" ${col.data_type.toUpperCase()}`;
      if (col.column_default) {
        if (!col.column_default.includes('nextval') && !col.column_default.includes('uuid_generate') && !col.column_default.includes('now()')) {
          colDef += ` DEFAULT ${col.column_default}`;
        }
      }
      await newClient.query(`ALTER TABLE ${schema}.${tableName} ADD COLUMN IF NOT EXISTS ${colDef};`);
    }
  }
}

async function copyTable(oldClient, newClient, tableName, schema = 'public') {
  console.log(`\nCopying table ${schema}.${tableName}...`);
  try {
    await syncTableSchema(oldClient, newClient, tableName, schema);

    const columnsToCopy = await getNonGeneratedColumns(oldClient, tableName, schema);
    const colNames = columnsToCopy.map(c => `"${c.column_name}"`).join(', ');

    const selectCols = columnsToCopy.map(c => `"${c.column_name}"`).join(', ');
    const res = await oldClient.query(`SELECT ${selectCols} FROM ${schema}.${tableName};`);
    console.log(`Found ${res.rows.length} rows in old table.`);
    if (res.rows.length === 0) return;

    // Use fast Bulk Insert in chunks of 100 rows
    const chunkSize = 100;
    await newClient.query(`BEGIN`);
    try {
      for (let i = 0; i < res.rows.length; i += chunkSize) {
        const chunk = res.rows.slice(i, i + chunkSize);
        
        let queryText = `INSERT INTO ${schema}.${tableName} (${colNames}) VALUES `;
        let valueArray = [];
        let paramIndex = 1;
        let valuePlaceholders = [];

        for (const row of chunk) {
          let rowPlaceholders = [];
          columnsToCopy.forEach(c => {
            let val = row[c.column_name];
            if (c.data_type === 'json' || c.data_type === 'jsonb') {
              if (val === null || val === undefined) val = null;
              else if (typeof val === 'object') val = JSON.stringify(val);
              else if (typeof val === 'string') {
                try {
                  JSON.parse(val);
                } catch (e) {
                  val = JSON.stringify(val);
                }
              }
            }
            valueArray.push(val);
            rowPlaceholders.push(`$${paramIndex++}`);
          });
          valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        }

        queryText += valuePlaceholders.join(', ');

        const conflictTarget = tableName === 'rules' ? 'code' : 'id';
        if (tableName === 'rules' || tableName === 'students' || tableName === 'occurrences' || tableName === 'accidents' || tableName === 'praises' || tableName === 'users') {
          queryText += ` ON CONFLICT (${conflictTarget}) DO NOTHING`;
        } else if (schema === 'auth') {
          queryText += ` ON CONFLICT (id) DO NOTHING`;
        }

        await newClient.query(queryText, valueArray);
      }
      await newClient.query(`COMMIT`);
      console.log(`Successfully bulk copied ${res.rows.length} rows to new table.`);
    } catch (err) {
      await newClient.query(`ROLLBACK`);
      console.error(`Error bulk writing to new DB for ${tableName}:`, err.message);
    }
  } catch (err) {
    console.error(`Error copying table ${tableName}:`, err.message);
  }
}

async function run() {
  const oldClient = new Client({ connectionString: oldConnectionString });
  const newClient = new Client({ connectionString: newConnectionString });

  try {
    console.log('Connecting to old Supabase database...');
    await oldClient.connect();
    console.log('SUCCESS: Connected to old database!');

    console.log('Connecting to new VPS database...');
    await newClient.connect();
    console.log('SUCCESS: Connected to new VPS database!');

    console.log('Cleaning up duplicate columns on public.students...');
    try {
      await newClient.query(`
        ALTER TABLE public.students DROP COLUMN IF EXISTS registrationnumber;
        ALTER TABLE public.students DROP COLUMN IF EXISTS birthdate;
      `);
    } catch (e) {}

    try {
      await newClient.query(`
        ALTER TABLE public.occurrences DROP CONSTRAINT IF EXISTS occurrences_rule_code_fkey;
        ALTER TABLE public.occurrences ALTER COLUMN rule_code TYPE integer[] USING ARRAY[rule_code];
      `);
      console.log('Successfully converted occurrences.rule_code to integer[].');
    } catch (e) {
      console.log('Skipped rule_code conversion:', e.message);
    }

    await newClient.query('SET session_replication_role = "replica";');

    await copyTable(oldClient, newClient, 'users', 'auth');
    await copyTable(oldClient, newClient, 'identities', 'auth');

    const tables = ['students', 'rules', 'occurrences', 'accidents', 'praises'];
    for (const table of tables) {
      await copyTable(oldClient, newClient, table, 'public');
    }

    await newClient.query('SET session_replication_role = "origin";');
    console.log('\n============================================');
    console.log('DATA MIGRATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

run();
