-- Initialisation du schéma pour Supabase (PostgreSQL)

-- 1. Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

INSERT INTO roles (nom) VALUES 
('Administrateur'), 
('Gestionnaire'), 
('Lecteur')
ON CONFLICT (nom) DO NOTHING;

-- 2. Table des communes
CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

INSERT INTO communes (nom) VALUES 
('Douala 1er'),
('Douala 2e'),
('Douala 3e'),
('Douala 4e'),
('Douala 5e'),
('Douala 6e')
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
    budget_actuel DECIMAL(15,2) DEFAULT 0.00,
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminé', 'suspendu', 'en_attente', 'planifié', 'annulé')),
    priorite TEXT DEFAULT 'normale',
    avancement_physique INTEGER DEFAULT 0 CHECK (avancement_physique >= 0 AND avancement_physique <= 100),
    visible_public BOOLEAN DEFAULT TRUE,
    type_projet_id INTEGER REFERENCES types_projets(id) ON DELETE SET NULL,
    commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_debut DATE,
    date_fin_prevue DATE,
    date_fin_reelle DATE
);

-- 5. Table des jalons
CREATE TABLE IF NOT EXISTS jalons (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    statut TEXT DEFAULT 'en_attente'
);

-- 6. Table des risques
CREATE TABLE IF NOT EXISTS risques (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    impact TEXT DEFAULT 'moyen'
);

-- 7. Table des indicateurs (KPIs)
CREATE TABLE IF NOT EXISTS indicateurs (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    ordre INTEGER DEFAULT 0,
    valeur_actuelle DECIMAL(10,2) DEFAULT 0,
    valeur_cible DECIMAL(10,2) DEFAULT 0
);

-- 8. Table des budgets (par année)
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    montant_alloue DECIMAL(15,2) DEFAULT 0.00,
    annee INTEGER
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

-- 10. Table des photos
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    fichier_url TEXT NOT NULL,
    description TEXT,
    date_upload TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table des avancements (historique)
CREATE TABLE IF NOT EXISTS avancements (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    pourcentage INTEGER DEFAULT 0,
    commentaire TEXT,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Profils Utilisateurs (étendu pour Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    role_id INTEGER REFERENCES roles(id),
    statut TEXT DEFAULT 'actif',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activation de RLS (Row Level Security)
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité simples (Lecture pour tous les authentifiés)
CREATE POLICY "Lecture publique pour les projets visibles" ON projets
    FOR SELECT USING (visible_public = TRUE);

CREATE POLICY "Gestion complète pour les administrateurs" ON projets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role_id = (SELECT id FROM roles WHERE nom = 'Administrateur')
        )
    );
