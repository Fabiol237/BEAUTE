require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.aewdvkgozowfypbyliwt.supabase.co',
  user: 'postgres',
  password: process.env.DB_PASS,
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== SUPER ADMINS (munipro_admins) ===');
    const admins = await client.query('SELECT id, nom, email, role, statut FROM munipro_admins');
    console.table(admins.rows);

    console.log('\n=== UTILISATEURS COMMUNES ===');
    const users = await client.query('SELECT id, nom, prenom, email, role, commune_id FROM utilisateurs ORDER BY commune_id');
    console.table(users.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
