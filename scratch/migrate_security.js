const { pool } = require('../db');

async function migrateSecurity() {
  try {
    // 1. Add doit_changer_mdp column
    await pool.query(`
      ALTER TABLE utilisateurs 
      ADD COLUMN IF NOT EXISTS doit_changer_mdp BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log('✅ doit_changer_mdp column added');

    // 2. Ensure journal table exists with commune_id and ip
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal (
        id SERIAL PRIMARY KEY,
        utilisateur_id INTEGER,
        commune_id INTEGER,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
        FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE SET NULL
      );
    `);

    // Add commune_id if missing
    await pool.query(`
      ALTER TABLE journal ADD COLUMN IF NOT EXISTS commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL;
    `).catch(() => {});

    console.log('✅ journal table ready');

    // 3. Ensure roles table has gestionnaire/lecteur
    await pool.query(`
      INSERT INTO roles (nom) VALUES ('gestionnaire'), ('lecteur')
      ON CONFLICT (nom) DO NOTHING;
    `);
    console.log('✅ roles updated');

    console.log('\n✅ Migration done!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateSecurity();
