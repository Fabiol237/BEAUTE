USE suivi_projets_municipaux;

-- Mise à jour de la table projets
ALTER TABLE projets 
ADD COLUMN consignes TEXT AFTER description,
ADD COLUMN responsable_id INT AFTER commune_id,
ADD COLUMN entreprise_executante VARCHAR(255) AFTER responsable_id,
ADD COLUMN budget_initial DECIMAL(15,2) DEFAULT 0.00 AFTER entreprise_executante,
ADD COLUMN budget_deja_utilise DECIMAL(15,2) DEFAULT 0.00 AFTER budget_actuel,
ADD COLUMN latitude DECIMAL(10,8) AFTER avancement_physique,
ADD COLUMN longitude DECIMAL(11,8) AFTER latitude,
ADD COLUMN adresse VARCHAR(255) AFTER longitude;

-- Mise à jour de la table budgets
ALTER TABLE budgets 
ADD COLUMN montant_initial DECIMAL(15,2) DEFAULT 0.00 AFTER projet_id,
ADD COLUMN source_financement VARCHAR(255) AFTER montant_initial,
ADD COLUMN exercice_budgetaire YEAR AFTER source_financement,
DROP COLUMN montant_alloue,
DROP COLUMN annee;

-- Mise à jour de la table jalons
ALTER TABLE jalons 
ADD COLUMN date_prevue DATE AFTER titre,
ADD COLUMN pourcentage_completion INT DEFAULT 0 AFTER statut;

-- Mise à jour de la table risques
ALTER TABLE risques 
CHANGE titre description TEXT,
ADD COLUMN niveau VARCHAR(50) DEFAULT 'moyen' AFTER description,
DROP COLUMN impact;

-- Mise à jour de la table indicateurs
ALTER TABLE indicateurs 
CHANGE titre libelle VARCHAR(255),
DROP COLUMN valeur_actuelle;

-- Ajout de contraintes de clés étrangères manquantes (si nécessaire)
ALTER TABLE projets ADD CONSTRAINT fk_projets_responsable FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;
