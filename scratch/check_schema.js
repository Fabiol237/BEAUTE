const { pool } = require('../db.js');

async function main() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'projets' 
    ORDER BY ordinal_position
  `);
  console.log('=== COLONNES TABLE projets ===');
  res.rows.forEach(r => console.log(r.column_name, '-', r.data_type));
  
  const res2 = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' 
    ORDER BY ordinal_position
  `);
  console.log('\n=== COLONNES TABLE utilisateurs ===');
  res2.rows.forEach(r => console.log(r.column_name));
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
