-- Schéma Complet Robuste avec Données Initiales pour Supabase (PostgreSQL)

-- NETTOYAGE COMPLET
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Lecture pour tous" ON projets;
    DROP POLICY IF EXISTS "Modif pour admin" ON projets;
    DROP POLICY IF EXISTS "Lecture publique pour les projets visibles" ON projets;
    DROP POLICY IF EXISTS "Gestion complète pour les administrateurs" ON projets;
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- 1. Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

INSERT INTO roles (nom) VALUES 
('Administrateur'), ('Gestionnaire'), ('Lecteur')
ON CONFLICT (nom) DO NOTHING;

-- 2. Table des communes
CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

INSERT INTO communes (nom) VALUES 
('Douala 1er'), ('Douala 2e'), ('Douala 3e'), ('Douala 4e'), ('Douala 5e'), ('Douala 6e')
ON CONFLICT (nom) DO NOTHING;

-- 3. Table des types de projets
CREATE TABLE IF NOT EXISTS types_projets (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    couleur TEXT DEFAULT '#2563eb'
);

INSERT INTO types_projets (nom, couleur) VALUES 
('Infrastructures Routières', '#3b82f6'),
('Santé Publique', '#ef4444'),
('Éducation', '#10b981'),
('Éclairage Public', '#f59e0b'),
('Assainissement', '#6b7280')
ON CONFLICT (nom) DO NOTHING;

-- 4. Table des projets
CREATE TABLE IF NOT EXISTS projets (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    description TEXT,
    consignes TEXT,
    budget_initial DECIMAL(15,2) DEFAULT 0.00,
    budget_actuel DECIMAL(15,2) DEFAULT 0.00,
    budget_deja_utilise DECIMAL(15,2) DEFAULT 0.00,
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminé', 'suspendu', 'en_attente', 'planifié', 'annulé')),
    priorite TEXT DEFAULT 'normale',
    avancement_physique INTEGER DEFAULT 0 CHECK (avancement_physique >= 0 AND avancement_physique <= 100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    adresse TEXT,
    visible_public BOOLEAN DEFAULT TRUE,
    type_projet_id INTEGER REFERENCES types_projets(id) ON DELETE SET NULL,
    commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
    entreprise_executante TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_debut DATE,
    date_fin_prevue DATE,
    date_fin_reelle DATE
);

-- Données initiales pour les projets (Seed)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique) VALUES 
('Construction Hôpital de District', 'Construction d\'un nouvel hôpital moderne équipé.', 150000000.00, 2, 1, 'en_cours', 4.0511, 9.7679, 65),
('Réhabilitation Route Principale', 'Bitumage et éclairage de la route', 250000000.00, 1, 2, 'en_cours', 4.0611, 9.7779, 40),
('Éclairage Public Boulevard', 'Installation de lampadaires LED solaires.', 45000000.00, 4, 3, 'terminé', 4.0411, 9.7579, 100)
ON CONFLICT DO NOTHING;

-- 5. Table des jalons
CREATE TABLE IF NOT EXISTS jalons (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    date_prevue DATE,
    ordre INTEGER DEFAULT 0,
    statut TEXT DEFAULT 'en_attente',
    pourcentage_completion INTEGER DEFAULT 0
);

-- 6. Table des risques
CREATE TABLE IF NOT EXISTS risques (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    description TEXT,
    niveau TEXT DEFAULT 'moyen',
    ordre INTEGER DEFAULT 0
);

-- 7. Table des indicateurs (KPIs)
CREATE TABLE IF NOT EXISTS indicateurs (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    libelle TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    valeur_cible DECIMAL(10,2) DEFAULT 0
);

-- 8. Table des budgets
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    montant_initial DECIMAL(15,2) DEFAULT 0.00,
    source_financement TEXT,
    exercice_budgetaire INTEGER
);

-- 9. Table des dépenses
CREATE TABLE IF NOT EXISTS depenses (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    validee BOOLEAN DEFAULT TRUE,
    date_depense TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de quelques dépenses tests
INSERT INTO depenses (projet_id, montant, description, validee) VALUES 
(1, 15000000, 'Achat équipements médicaux', true),
(2, 45000000, 'Bitumage segment A', true),
(1, 5000000, 'Travaux second oeuvre', false)
ON CONFLICT DO NOTHING;

-- 10. Profils Utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    role_id INTEGER REFERENCES roles(id),
    statut TEXT DEFAULT 'actif',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projets' AND column_name='responsable_id') THEN
        ALTER TABLE projets ADD COLUMN responsable_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Activation de RLS
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Lecture pour tous" ON projets FOR SELECT USING (TRUE);
CREATE POLICY "Modif pour admin" ON projets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
);
