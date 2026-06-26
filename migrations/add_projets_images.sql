-- Ajouter les colonnes image aux tables projets
ALTER TABLE projets 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_public_id TEXT DEFAULT NULL;

-- Ajouter les indexes
CREATE INDEX IF NOT EXISTS idx_projets_image_url ON projets(image_url);
CREATE INDEX IF NOT EXISTS idx_projets_image_public_id ON projets(image_public_id);
