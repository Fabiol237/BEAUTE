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

async function createBucket() {
  const client = await pool.connect();
  try {
    console.log('🔄 Création du bucket "uploads" via SQL...');
    
    // Insert into storage.buckets
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('uploads', 'uploads', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);

    console.log('✅ Bucket "uploads" créé avec succès !');

    // Create a policy to allow public inserts
    await client.query(`
      CREATE POLICY "Allow public uploads" ON storage.objects
      FOR INSERT TO public WITH CHECK (bucket_id = 'uploads');
    `).catch(err => {
      if (err.message.includes('already exists') || err.message.includes('existe déjà')) console.log('Policy déjà existante (insert).');
      else console.error('Erreur policy insert:', err.message);
    });

    await client.query(`
      CREATE POLICY "Allow public select" ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'uploads');
    `).catch(err => {
      if (err.message.includes('already exists') || err.message.includes('existe déjà')) console.log('Policy déjà existante (select).');
      else console.error('Erreur policy select:', err.message);
    });

    console.log('✅ Politiques de sécurité créées.');

  } catch (err) {
    console.error('❌ Erreur lors de la création du bucket via SQL:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createBucket();
