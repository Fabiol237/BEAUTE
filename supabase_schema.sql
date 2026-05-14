-- Schéma Unifié et Robuste pour le Projet Municipal (Cameroun)
-- Ce fichier contient TOUT : Tables, RLS et Données de Test réalistes.

-- 1. NETTOYAGE (Optionnel, pour repartir à zéro)
-- DROP TABLE IF EXISTS signalement_photos CASCADE;
-- DROP TABLE IF EXISTS suggestions CASCADE;
-- DROP TABLE IF EXISTS depenses CASCADE;
-- DROP TABLE IF EXISTS budgets CASCADE;
-- DROP TABLE IF EXISTS indicateurs CASCADE;
-- DROP TABLE IF EXISTS risques CASCADE;
-- DROP TABLE IF EXISTS jalons CASCADE;
-- DROP TABLE IF EXISTS projets CASCADE;
-- DROP TABLE IF EXISTS types_projets CASCADE;
-- DROP TABLE IF EXISTS communes CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- 2. TABLES DE RÉFÉRENCE
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    region TEXT DEFAULT 'Littoral'
);

CREATE TABLE IF NOT EXISTS types_projets (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    couleur TEXT DEFAULT '#2563eb',
    icone TEXT DEFAULT 'package'
);

-- 3. TABLES PRINCIPALES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    role_id INTEGER REFERENCES roles(id),
    statut TEXT DEFAULT 'actif',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projets (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    description TEXT,
    budget_initial DECIMAL(15,2) DEFAULT 0.00,
    budget_actuel DECIMAL(15,2) DEFAULT 0.00,
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('planifié', 'en_cours', 'terminé', 'suspendu', 'annulé')),
    priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
    avancement_physique INTEGER DEFAULT 0 CHECK (avancement_physique >= 0 AND avancement_physique <= 100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    adresse TEXT,
    visible_public BOOLEAN DEFAULT TRUE,
    type_projet_id INTEGER REFERENCES types_projets(id) ON DELETE SET NULL,
    commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
    responsable_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_debut DATE,
    date_fin_prevue DATE
);

CREATE TABLE IF NOT EXISTS depenses (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    validee BOOLEAN DEFAULT TRUE,
    date_depense TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('suggestion', 'signalement')),
    citoyen_nom TEXT NOT NULL,
    citoyen_email TEXT NOT NULL,
    projet_id INTEGER REFERENCES projets(id) ON DELETE SET NULL,
    categorie TEXT NOT NULL,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    quartier TEXT,
    priorite_citoyen TEXT DEFAULT 'basse',
    statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'traité', 'archivé')),
    date_soumission TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ACTIVATION RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- 5. POLITIQUES DE SÉCURITÉ (RLS)

-- Roles & Communes & Types : Lecture publique
CREATE POLICY "Lecture publique roles" ON roles FOR SELECT USING (TRUE);
CREATE POLICY "Lecture publique communes" ON communes FOR SELECT USING (TRUE);
CREATE POLICY "Lecture publique types" ON types_projets FOR SELECT USING (TRUE);

-- Projets : Lecture publique pour ce qui est visible
CREATE POLICY "Lecture publique projets" ON projets FOR SELECT USING (visible_public = TRUE);
CREATE POLICY "Admin total projets" ON projets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
) WITH CHECK (TRUE);
-- AJOUT : Autoriser l'insertion pour le prototype (si non connecté)
CREATE POLICY "Insertion prototype projets" ON projets FOR INSERT WITH CHECK (TRUE);

-- Suggestions : Insertion publique, Lecture Admin
CREATE POLICY "Insertion publique suggestions" ON suggestions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Lecture admin suggestions" ON suggestions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
);

-- Profiles : Lecture propre ou Admin
CREATE POLICY "Lecture propre profil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin total profils" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
);

-- 6. DONNÉES INITIALES (SEED)

INSERT INTO roles (nom) VALUES ('Administrateur'), ('Gestionnaire'), ('Citoyen') ON CONFLICT DO NOTHING;

INSERT INTO communes (nom, region) VALUES 
('Douala 1er', 'Littoral'), 
('Douala 2e', 'Littoral'), 
('Douala 3e', 'Littoral'), 
('Douala 5e', 'Littoral'), 
('Yaoundé 1er', 'Centre'),
('Yaoundé 6e', 'Centre'),
('Limbe 1er', 'Sud-Ouest'),
('Bafoussam 1er', 'Ouest')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO types_projets (nom, couleur, icone) VALUES 
('Routes et Voiries', '#3b82f6', 'truck'),
('Santé et Hygiène', '#ef4444', 'heart'),
('Éducation', '#10b981', 'book'),
('Éclairage Public', '#f59e0b', 'sun'),
('Eau et Énergie', '#06b6d4', 'droplet'),
('Urbanisme', '#8b5cf6', 'map')
ON CONFLICT (nom) DO NOTHING;

-- Insertion de projets réalistes
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, avancement_physique, latitude, longitude) VALUES 
('Pavage Rue de la Joie', 'Aménagement et pavage de la rue de la joie à Deido.', 125000000.00, 1, 1, 'en_cours', 45, 4.0588, 9.7042),
('Forage Solaire Bépanda', 'Construction d''un forage à énergie solaire pour le quartier Bépanda.', 15000000.00, 5, 5, 'terminé', 100, 4.0620, 9.7250),
('Réhabilitation École Publique', 'Rénovation complète des bâtiments et clôture de l''école publique de New-Bell.', 85000000.00, 3, 2, 'en_cours', 20, 4.0320, 9.7150),
('Extension Éclairage LED', 'Installation de 200 lampadaires solaires sur l''axe principal de Bonamoussadi.', 210000000.00, 4, 4, 'planifié', 0, 4.0780, 9.7420),
('Nouveau Centre de Santé', 'Construction d''un centre de santé intégré à Akwa Nord.', 180000000.00, 2, 1, 'suspendu', 15, 4.0550, 9.6950)
ON CONFLICT DO NOTHING;

INSERT INTO suggestions (mode, citoyen_nom, citoyen_email, categorie, titre, description, quartier, priorite_citoyen) VALUES 
('signalement', 'Jean Ebollo', 'jean@gmail.com', 'Voirie', 'Nid de poule géant', 'Un énorme trou s''est formé devant la boulangerie ZEPOL.', 'Akwa', 'critique'),
('suggestion', 'Marie Ngo', 'marie.ngo@outlook.com', 'Environnement', 'Plus de poubelles', 'Il faudrait installer des bacs à ordures tous les 500m sur le boulevard.', 'Bonanjo', 'normale')
ON CONFLICT DO NOTHING;
