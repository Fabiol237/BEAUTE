const postgres = require('postgres');

const sql = postgres('postgresql://postgres:Z0kof@ro123@db.somzygvplcazfytxalsd.supabase.co:5432/postgres', {
  ssl: 'require'
});

async function run() {
  console.log('🚀 Démarrage de la réparation de la base de données...');
  
  try {
    // 1. Réparation du schéma
    console.log('🛠️ Réparation du schéma (Projets)...');
    await sql`ALTER TABLE projets ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)`;
    await sql`ALTER TABLE projets ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)`;
    await sql`ALTER TABLE projets ADD COLUMN IF NOT EXISTS visible_public BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE projets ADD COLUMN IF NOT EXISTS date_debut DATE`;
    await sql`ALTER TABLE projets ADD COLUMN IF NOT EXISTS date_fin_prevue DATE`;
    
    console.log('🛠️ Réparation du schéma (Suggestions)...');
    await sql`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS commune_id INTEGER`;
    await sql`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)`;
    await sql`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)`;
    await sql`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS priorite TEXT DEFAULT 'normale'`;
    await sql`ALTER TABLE suggestions ALTER COLUMN categorie DROP NOT NULL`;

    // 2. Nettoyage
    console.log('🧹 Nettoyage des anciennes données...');
    await sql`DELETE FROM suggestions`;
    await sql`DELETE FROM depenses`;
    await sql`DELETE FROM projets`;

    // 3. Insertion des données (Simulation 5 Mairies)
    console.log('📥 Insertion des données de simulation...');
    const projets = [
      ['Mairie Douala 1er - Modernisation', 85000000, 1, 'en_cours', 35, true, 4.0441, 9.6845, '2024-01-15', '2024-12-30'],
      ['Mairie Douala 2e - Marché Central', 200000000, 2, 'en_cours', 60, true, 4.0322, 9.7045, '2023-10-01', '2024-08-15'],
      ['Mairie Douala 3e - Route Logbaba', 350000000, 3, 'en_cours', 25, true, 4.0455, 9.7522, '2024-02-01', '2025-02-28'],
      ['Mairie Douala 4e - Drainage Sodiko', 180000000, 4, 'en_cours', 75, true, 4.0722, 9.6545, '2023-11-15', '2024-07-30'],
      ['Mairie Douala 5e - Stade Municipal', 150000000, 5, 'en_cours', 85, true, 4.0811, 9.7345, '2023-05-01', '2024-04-30']
    ];

    for (const p of projets) {
      await sql`INSERT INTO projets (titre, budget_actuel, commune_id, statut, avancement_physique, visible_public, latitude, longitude, date_debut, date_fin_prevue) 
                VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, ${p[6]}, ${p[7]}, ${p[8]}, ${p[9]})`;
    }

    console.log('✨ Base de données prête et simulée avec succès !');
  } catch (err) {
    console.error('❌ Erreur critique :', err.message);
  } finally {
    await sql.end();
  }
}

run();
