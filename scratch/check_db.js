const { pool } = require('../db');

async function checkDB() {
  try {
    const projetsCount = await pool.query('SELECT COUNT(*) FROM projets');
    const budgetsCount = await pool.query('SELECT COUNT(*) FROM budget_lignes');
    const communesCount = await pool.query('SELECT COUNT(*) FROM communes');
    
    console.log(`Projets: ${projetsCount.rows[0].count}`);
    console.log(`Budgets: ${budgetsCount.rows[0].count}`);
    console.log(`Communes: ${communesCount.rows[0].count}`);

    const allProjets = await pool.query('SELECT id, commune_id, statut FROM projets LIMIT 5');
    console.log('Sample projets:', allProjets.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

checkDB();
