const { pool } = require('../db');

async function applyMissingTables() {
  console.log('Début de la création des tables manquantes...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Jalons (Phases)
    console.log('Création de la table jalons...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS jalons (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER NOT NULL,
        titre VARCHAR(200) NOT NULL,
        date_prevue DATE,
        statut VARCHAR(50) DEFAULT 'non_commencé',
        pourcentage_completion INTEGER DEFAULT 0,
        ordre INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
      )
    `);

    // 2. Risques
    console.log('Création de la table risques...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS risques (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        niveau VARCHAR(50) DEFAULT 'moyen',
        ordre INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
      )
    `);

    // 3. Indicateurs
    console.log('Création de la table indicateurs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS indicateurs (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER NOT NULL,
        libelle VARCHAR(200) NOT NULL,
        valeur_cible VARCHAR(100),
        ordre INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
      )
    `);

    // 4. Avancements
    console.log('Création de la table avancements...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS avancements (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER NOT NULL,
        utilisateur_id INTEGER NOT NULL,
        pourcentage INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        observations TEXT,
        date_constat DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
      )
    `);

    // 5. Modification de la table journal pour ajouter commune_id si non existant
    console.log('Vérification de la table journal...');
    const journalCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'journal' AND column_name = 'commune_id'
    `);
    if (journalCols.rows.length === 0) {
      console.log('Ajout de la colonne commune_id à la table journal...');
      await client.query(`ALTER TABLE journal ADD COLUMN commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL`);
    }

    // Note: photos table was checked and it already exists with the correct schema,
    // so we don't need to recreate it here.

    await client.query('COMMIT');
    console.log('Toutes les tables ont été créées et mises à jour avec succès !');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création des tables:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

applyMissingTables();
