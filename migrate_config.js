const { query } = require('./db');

async function run() {
  try {
    await query(
      "CREATE TABLE IF NOT EXISTS munipro_config (" +
      "  id SERIAL PRIMARY KEY," +
      "  cle VARCHAR(100) UNIQUE NOT NULL," +
      "  valeur TEXT," +
      "  created_at TIMESTAMPTZ DEFAULT NOW()," +
      "  updated_at TIMESTAMPTZ DEFAULT NOW()" +
      ")"
    );
    console.log('✅ Table munipro_config créée');

    await query(
      "INSERT INTO munipro_config (cle, valeur) VALUES ('banniere_globale', '') ON CONFLICT (cle) DO NOTHING"
    );
    console.log('✅ Valeur par défaut insérée');
    process.exit(0);
  } catch (e) {
    console.error('❌ ERREUR:', e.message);
    process.exit(1);
  }
}
run();
