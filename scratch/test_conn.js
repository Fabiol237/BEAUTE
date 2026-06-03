const { Client } = require('pg');

async function test(host, user, password, database, port) {
  console.log(`\nTesting connection with host=${host}, user=${user}...`);
  const client = new Client({
    host,
    user,
    password,
    database,
    port,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // 5 seconds timeout
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS! Connected to host=${host}, user=${user}`);

    console.log('Running tables query...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));

    console.log('Checking columns for photos...');
    const photos = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'photos'
    `);
    console.log(`Columns in "photos":`, photos.rows.map(c => c.column_name).join(', '));

    console.log('Checking columns for photos_projets...');
    const photos_projets = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'photos_projets'
    `);
    console.log(`Columns in "photos_projets":`, photos_projets.rows.map(c => c.column_name).join(', '));

    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ FAILED for host=${host}, user=${user}. Error: ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const password = 'Z0kof@ro123';
  const database = 'postgres';
  const port = 5432;

  // Configuration 1 (from .env)
  await test('aws-0-eu-west-3.pooler.supabase.com', 'postgres.aewdvkgozowfypbyliwt', password, database, port);

  // Configuration 2 (from check-accounts.js / config.js fallback)
  await test('db.aewdvkgozowfypbyliwt.supabase.co', 'postgres', password, database, port);

  // Configuration 3 (direct host with pooler user)
  await test('db.aewdvkgozowfypbyliwt.supabase.co', 'postgres.aewdvkgozowfypbyliwt', password, database, port);

  process.exit(0);
}

main().catch(err => console.error('GLOBAL ERROR:', err.message));
