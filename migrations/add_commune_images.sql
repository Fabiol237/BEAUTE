-- Ajouter la colonne image_url à la table communes si elle n'existe pas
ALTER TABLE communes 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_public_id TEXT DEFAULT NULL;

-- Ajouter les indexes
CREATE INDEX IF NOT EXISTS idx_communes_image_url ON communes(image_url);
