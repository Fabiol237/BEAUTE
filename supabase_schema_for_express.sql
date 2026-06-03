-- ============================================================
-- MuniPro — Schéma PostgreSQL pour Supabase
-- Conversion du schéma MySQL original
-- ============================================================

-- ── FONCTIONS DE COMPATIBILITÉ MYSQL ────────────────────────
CREATE OR REPLACE FUNCTION curdate() RETURNS date AS 'SELECT CURRENT_DATE;' LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION date_format(ts timestamp, format text)
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

-- ── 1. RÔLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (nom) VALUES ('admin'), ('agent'), ('lecteur') ON CONFLICT (nom) DO NOTHING;

-- ── 2. COMMUNES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communes (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  region VARCHAR(80) NOT NULL DEFAULT 'Littoral',
  email VARCHAR(150) NOT NULL UNIQUE,
  telephone VARCHAR(30),
  responsable VARCHAR(120),
  adresse TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. UTILISATEURS (Agents des Communes) ─────────────────────
CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  commune_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL DEFAULT 1,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  statut VARCHAR(20) NOT NULL DEFAULT 'actif',
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  derniere_connexion TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ── 4. ADMINS MUNIPRO (Super Administrateurs) ─────────────────
CREATE TABLE IF NOT EXISTS munipro_admins (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
  statut VARCHAR(20) NOT NULL DEFAULT 'actif',
  derniere_connexion TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. TYPES DE PROJETS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS types_projets (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(80) NOT NULL UNIQUE,
  couleur VARCHAR(10) NOT NULL DEFAULT '#6366f1'
);

INSERT INTO types_projets (nom, couleur) VALUES
  ('Infrastructures', '#f59e0b'),
  ('Santé',           '#10b981'),
  ('Éducation',       '#2563eb'),
  ('Hydraulique',     '#0ea5e9'),
  ('Énergie',         '#8b5cf6'),
  ('Commerce',        '#ec4899'),
  ('Environnement',   '#14b8a6'),
  ('Voirie',          '#f97316'),
  ('Social',          '#a78bfa'),
  ('Autre',           '#64748b')
ON CONFLICT (nom) DO NOTHING;

-- ── 6. PROJETS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projets (
  id SERIAL PRIMARY KEY,
  commune_id INTEGER NOT NULL,
  type_projet_id INTEGER NOT NULL,
  titre VARCHAR(200) NOT NULL,
  description TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'planifié',
  budget_previsionnel DECIMAL(15,2) NOT NULL DEFAULT 0,
  budget_actuel DECIMAL(15,2) NOT NULL DEFAULT 0,
  avancement_physique SMALLINT NOT NULL DEFAULT 0,
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  localisation VARCHAR(200),
  photo VARCHAR(255),
  visible_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE CASCADE,
  FOREIGN KEY (type_projet_id) REFERENCES types_projets(id),
  FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ── 7.5 JALONS ─────────────────────────────────────────────────
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
);

-- ── 7.6 RISQUES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risques (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  niveau VARCHAR(50) DEFAULT 'moyen',
  ordre INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
);

-- ── 7.7 INDICATEURS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS indicateurs (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  valeur_cible VARCHAR(100),
  ordre INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
);

-- ── 7.8 AVANCEMENTS ─────────────────────────────────────────────
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
);

-- ── 7. DÉPENSES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS depenses (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL,
  libelle VARCHAR(150) NOT NULL,
  description TEXT,
  montant DECIMAL(15,2) NOT NULL,
  date_depense DATE NOT NULL,
  numero_facture VARCHAR(50),
  fournisseur VARCHAR(150),
  saisi_par INTEGER,
  validee BOOLEAN NOT NULL DEFAULT FALSE,
  validee_par INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
  FOREIGN KEY (validee_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (saisi_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ── 8. PHOTOS DES CHANTIERS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER NOT NULL,
  fichier_url VARCHAR(255) NOT NULL,
  fichier_nom VARCHAR(255) NOT NULL,
  taille INTEGER,
  legende VARCHAR(200),
  date_prise DATE,
  uploaded_by INTEGER,
  date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ── 9. SIGNALEMENTS CITOYENS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS signalements (
  id SERIAL PRIMARY KEY,
  projet_id INTEGER,
  commune_id INTEGER,
  nom_citoyen VARCHAR(120),
  email VARCHAR(150),
  message TEXT NOT NULL,
  statut VARCHAR(20) DEFAULT 'nouveau',
  photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
  FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE SET NULL
);

-- ── 10. JOURNAL D'ACTIVITÉ ────────────────────────────────────
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

-- ── 11. SUGGESTIONS CITOYENNES ────────────────────────────────
CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  mode VARCHAR(20) NOT NULL DEFAULT 'suggestion',
  citoyen_nom VARCHAR(120) NOT NULL,
  citoyen_email VARCHAR(150) NOT NULL,
  citoyen_telephone VARCHAR(30),
  projet_id INTEGER,
  categorie VARCHAR(80),
  titre VARCHAR(150),
  description TEXT NOT NULL,
  quartier VARCHAR(120),
  priorite_citoyen VARCHAR(20) DEFAULT 'basse',
  disponible_contact BOOLEAN DEFAULT FALSE,
  adresse_probleme VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  depuis_quand VARCHAR(80),
  a_temoins BOOLEAN DEFAULT FALSE,
  priorite VARCHAR(20) DEFAULT 'basse',
  date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL
);

-- ── 12. PHOTOS DES SIGNALEMENTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS signalement_photos (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER NOT NULL,
  fichier_url VARCHAR(255) NOT NULL,
  fichier_nom VARCHAR(255) NOT NULL,
  taille INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
);

-- ============================================================
-- DONNÉES D'EXEMPLE
-- Mot de passe: commune2024 / munipro2024
-- ============================================================

INSERT INTO munipro_admins (nom, email, password_hash, role) VALUES
  ('MuniPro Admin', 'admin@munipro.cm', '$2b$10$tvd1fMf/4kWLunRpZ81.eeStrOeI8i6REsL7EYCNXsHZe9mj21oSi', 'super_admin')
  ON CONFLICT (email) DO NOTHING;

INSERT INTO communes (nom, region, email, telephone, responsable, statut) VALUES
  ('Douala 1er',  'Littoral', 'admin@douala1.cm',  '+237 233 001 001', 'M. Jean MBARGA',    'actif'),
  ('Douala 2e',   'Littoral', 'admin@douala2.cm',  '+237 233 002 002', 'Mme Claire EBONGUE','actif'),
  ('Douala 3e',   'Littoral', 'admin@douala3.cm',  '+237 233 003 003', 'M. Paul NDOUMBE',   'actif'),
  ('Douala 4e',   'Littoral', 'admin@douala4.cm',  '+237 233 004 004', 'M. Henri BELLO',    'actif'),
  ('Douala 5e',   'Littoral', 'admin@douala5.cm',  '+237 233 005 005', 'Mme Sophie KOUM',   'actif'),
  ('Nkongsamba',  'Littoral', 'admin@nkongsamba.cm','+237 233 006 006', 'M. Louis ETOGA',   'actif')
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, password_hash, role) VALUES
  (1, 1, 'MBARGA',  'Jean',    'admin@douala1.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (2, 1, 'EBONGUE', 'Claire',  'admin@douala2.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (3, 1, 'NDOUMBE', 'Paul',    'admin@douala3.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (4, 1, 'BELLO',   'Henri',   'admin@douala4.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (5, 1, 'KOUM',    'Sophie',  'admin@douala5.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (6, 1, 'ETOGA',   'Louis',   'admin@nkongsamba.cm','$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin')
ON CONFLICT (email) DO NOTHING;
