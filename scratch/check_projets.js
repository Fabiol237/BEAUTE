const { pool } = require('../db');

async function checkProjets() {
  try {
    const projets = await pool.query('SELECT COUNT(*) FROM projets');
    const communes = await pool.query('SELECT COUNT(*) FROM communes');
    const types = await pool.query('SELECT COUNT(*) FROM types_projets');
    const users = await pool.query('SELECT COUNT(*) FROM utilisateurs');

    console.log(`Projets: ${projets.rows[0].count}`);
    console.log(`Communes: ${communes.rows[0].count}`);
    console.log(`Types: ${types.rows[0].count}`);
    console.log(`Users: ${users.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkProjets();
