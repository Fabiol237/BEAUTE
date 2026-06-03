/**
 * Migration : ajout des colonnes banniere (communes) et photo (projets)
 * Exécutez ce script UNE SEULE FOIS : node migrate_bannieres.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connexion à la base de données...');

    // 1. Ajouter la colonne "banniere" dans la table communes
    const res1 = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'communes' AND column_name = 'banniere'
    `);
    if (res1.rows.length === 0) {
      await client.query(`ALTER TABLE communes ADD COLUMN banniere VARCHAR(255)`);
      console.log('✅ Colonne "banniere" ajoutée à la table "communes".');
    } else {
      console.log('ℹ️  Colonne "banniere" déjà présente dans "communes".');
    }

    // 2. Ajouter la colonne "photo" dans la table projets (si absente)
    const res2 = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'projets' AND column_name = 'photo'
    `);
    if (res2.rows.length === 0) {
      await client.query(`ALTER TABLE projets ADD COLUMN photo VARCHAR(255)`);
      console.log('✅ Colonne "photo" ajoutée à la table "projets".');
    } else {
      console.log('ℹ️  Colonne "photo" déjà présente dans "projets".');
    }

    // 3. Ajouter la colonne "priorite" dans projets si absente (bonus)
    const res3 = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'projets' AND column_name = 'priorite'
    `);
    if (res3.rows.length === 0) {
      await client.query(`ALTER TABLE projets ADD COLUMN priorite VARCHAR(20) DEFAULT 'normale'`);
      console.log('✅ Colonne "priorite" ajoutée à la table "projets".');
    } else {
      console.log('ℹ️  Colonne "priorite" déjà présente dans "projets".');
    }

    console.log('\n🎉 Migration terminée avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
