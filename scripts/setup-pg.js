const { Client } = require('pg');

const client = new Client({
  host: 'db.somzygvplcazfytxalsd.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Z0kof@ro123',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const ddl = `
  CREATE OR REPLACE FUNCTION curdate() RETURNS date AS 'SELECT CURRENT_DATE;' LANGUAGE SQL IMMUTABLE;

  CREATE OR REPLACE FUNCTION date_format(ts timestamp, format text)
  RETURNS text AS \\$\\$
  DECLARE
    res text := format;
  BEGIN
    res := replace(res, '%Y', 'YYYY');
    res := replace(res, '%m', 'MM');
  RETURNS text AS $$
  DECLARE
    res text := format;
  BEGIN
    res := replace(res, '%Y', 'YYYY');
    res := replace(res, '%m', 'MM');
    res := replace(res, '%d', 'DD');
    res := replace(res, '%H', 'HH24');
    res := replace(res, '%i', 'MI');
    res := replace(res, '%s', 'SS');
    RETURN to_char(ts, res);
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  CREATE OR REPLACE FUNCTION date_format(ts timestamptz, format text)
  RETURNS text AS $$
  DECLARE
    res text := format;
  BEGIN
    res := replace(res, '%Y', 'YYYY');
    res := replace(res, '%m', 'MM');
    res := replace(res, '%d', 'DD');
    res := replace(res, '%H', 'HH24');
    res := replace(res, '%i', 'MI');
    res := replace(res, '%s', 'SS');
    RETURN to_char(ts, res);
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    commune_id INTEGER,
    role_id INTEGER,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'lecteur',
    statut VARCHAR(20) DEFAULT 'actif',
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS munipro_admins (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin',
    statut VARCHAR(20) DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS journal (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
  );

  INSERT INTO munipro_admins (nom, email, password_hash, role) VALUES
    ('MuniPro Admin', 'admin@munipro.cm', '$2b$10$tvd1fMf/4kWLunRpZ81.eeStrOeI8i6REsL7EYCNXsHZe9mj21oSi', 'super_admin')
    ON CONFLICT (email) DO NOTHING;

  INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, password_hash, role) VALUES
    (1, 1, 'MBARGA',  'Jean',    'admin@douala1.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
    (2, 1, 'EBONGUE', 'Claire',  'admin@douala2.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
    (3, 1, 'NDOUMBE', 'Paul',    'admin@douala3.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
    (4, 1, 'BELLO',   'Henri',   'admin@douala4.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
    (5, 1, 'KOUM',    'Sophie',  'admin@douala5.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
    (6, 1, 'ETOGA',   'Louis',   'admin@nkongsamba.cm','$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin')
    ON CONFLICT (email) DO NOTHING;
`;

async function main() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');
  await client.query(ddl);
  console.log('TABLES_AND_SEEDS_CREATED_SUCCESSFULLY');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
