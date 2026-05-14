-- Tables pour les Suggestions et Signalements Citoyens

CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('suggestion', 'signalement')),
    citoyen_nom TEXT NOT NULL,
    citoyen_email TEXT NOT NULL,
    citoyen_telephone TEXT,
    projet_id INTEGER REFERENCES projets(id) ON DELETE SET NULL,
    categorie TEXT NOT NULL,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    quartier TEXT,
    priorite_citoyen TEXT DEFAULT 'basse',
    disponible_contact BOOLEAN DEFAULT FALSE,
    adresse_probleme TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    depuis_quand TEXT,
    a_temoins BOOLEAN DEFAULT FALSE,
    priorite TEXT DEFAULT 'basse',
    date_soumission TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'traité', 'archivé'))
);

CREATE TABLE IF NOT EXISTS signalement_photos (
    id SERIAL PRIMARY KEY,
    suggestion_id INTEGER REFERENCES suggestions(id) ON DELETE CASCADE,
    fichier_url TEXT NOT NULL,
    fichier_nom TEXT,
    taille INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Politiques RLS pour les suggestions
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signalement_photos ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde à insérer (public)
CREATE POLICY "Insertion publique pour suggestions" ON suggestions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Insertion publique pour photos" ON signalement_photos FOR INSERT WITH CHECK (TRUE);

-- Seuls les admins peuvent lire
CREATE POLICY "Lecture admin pour suggestions" ON suggestions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
);
CREATE POLICY "Lecture admin pour photos" ON signalement_photos FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE nom = 'Administrateur'))
);
