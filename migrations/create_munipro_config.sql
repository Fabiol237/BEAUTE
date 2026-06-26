-- Table de configuration globale pour MuniPro
-- Stocke la bannière globale et d'autres paramètres système

CREATE TABLE IF NOT EXISTS munipro_config (
  id         SERIAL PRIMARY KEY,
  cle        VARCHAR(100) UNIQUE NOT NULL,
  valeur     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer une valeur par défaut pour la bannière globale (vide)
INSERT INTO munipro_config (cle, valeur)
VALUES ('banniere_globale', '')
ON CONFLICT (cle) DO NOTHING;
