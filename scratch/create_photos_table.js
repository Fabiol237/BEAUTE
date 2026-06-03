const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'db.aewdvkgozowfypbyliwt.supabase.co',
    user: 'postgres',
    password: 'Z0kof@ro123',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('Creating table photos...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        projet_id INTEGER NOT NULL,
        fichier_url VARCHAR(255) NOT NULL,
        fichier_nom VARCHAR(255),
        taille INTEGER,
        legende VARCHAR(200),
        date_prise DATE,
        uploaded_by INTEGER,
        date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES utilisateurs(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table "photos" created successfully!');

  } catch (err) {
    console.error('Error creating table:', err.message);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

main();
