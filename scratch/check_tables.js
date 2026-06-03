const { pool } = require('../db.js');

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('=== TABLES DANS LA BASE ===');
  tables.rows.forEach(t => console.log(t.table_name));

  const photosCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'photos' 
    ORDER BY ordinal_position
  `);
  if (photosCols.rows.length > 0) {
    console.log('\n=== COLONNES TABLE photos ===');
    photosCols.rows.forEach(r => console.log(r.column_name, '-', r.data_type));
  } else {
    console.log('\n❌ Table "photos" non trouvée.');
  }

  const photosProjetsCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'photos_projets' 
    ORDER BY ordinal_position
  `);
  if (photosProjetsCols.rows.length > 0) {
    console.log('\n=== COLONNES TABLE photos_projets ===');
    photosProjetsCols.rows.forEach(r => console.log(r.column_name, '-', r.data_type));
  } else {
    console.log('\n❌ Table "photos_projets" non trouvée.');
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
