const { pool } = require('./db.js');

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS avancements (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER REFERENCES projets(id) ON DELETE CASCADE,
        utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
        pourcentage SMALLINT,
        description TEXT,
        observations TEXT,
        date_constat DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table avancements créée ou déjà existante.');
  } catch (err) {
    console.error('Erreur lors de la création de la table :', err.message);
  } finally {
    process.exit(0);
  }
}

createTable();
