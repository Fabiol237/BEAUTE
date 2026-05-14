USE suivi_projets_municipaux;

ALTER TABLE types_projets 
ADD COLUMN couleur VARCHAR(7) DEFAULT '#2563eb';

UPDATE types_projets SET couleur = '#ef4444' WHERE id = 2;

ALTER TABLE projets 
CHANGE date_creation created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE date_fin date_fin_prevue DATE NULL,
ADD COLUMN date_fin_reelle DATE NULL,
ADD COLUMN avancement_physique INT DEFAULT 0,
ADD COLUMN priorite VARCHAR(50) DEFAULT 'normale';
