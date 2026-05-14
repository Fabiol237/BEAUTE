const postgres = require('postgres');

const sql = postgres('postgresql://postgres:Z0kof@ro123@db.somzygvplcazfytxalsd.supabase.co:5432/postgres', {
  ssl: 'require'
});

async function run() {
  try {
    await sql`UPDATE projets SET type_projet_id = 1 WHERE type_projet_id IS NULL`;
    console.log('Fixed type_projet_id');
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
