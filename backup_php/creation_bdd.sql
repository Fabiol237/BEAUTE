-- Création de la base de données
CREATE DATABASE IF NOT EXISTS suivi_projets_municipaux CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE suivi_projets_municipaux;

-- 1. Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO roles (id, nom) VALUES 
(1, 'Administrateur'), 
(2, 'Gestionnaire'), 
(3, 'Lecteur');

-- 2. Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    role_id INT DEFAULT 1,
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    actif TINYINT(1) DEFAULT 1,
    derniere_connexion DATETIME NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mot de passe par défaut : admin123 (généré avec password_hash PHP)
INSERT IGNORE INTO utilisateurs (id, nom, prenom, email, password_hash, role, role_id, statut, actif) VALUES 
(1, 'Admin', 'Système', 'admin@commune-littoral.cm', '$2y$10$wN./u.kZlH38a5S1J1V4UOHG21o1B/.F7.t0o49x9UjP3j6xW5S.e', 'admin', 1, 'actif', 1);

-- 3. Table des communes
CREATE TABLE IF NOT EXISTS communes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO communes (id, nom) VALUES 
(1, 'Douala 1er'),
(2, 'Douala 2e'),
(3, 'Douala 3e'),
(4, 'Douala 4e'),
(5, 'Douala 5e'),
(6, 'Douala 6e');

-- 4. Table des types de projets
CREATE TABLE IF NOT EXISTS types_projets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    couleur VARCHAR(7) DEFAULT '#2563eb'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO types_projets (id, nom, couleur) VALUES 
(1, 'Infrastructures Routières', '#3b82f6'),
(2, 'Santé Publique', '#ef4444'),
(3, 'Éducation', '#10b981'),
(4, 'Éclairage Public', '#f59e0b'),
(5, 'Assainissement', '#6b7280');

-- 5. Table des projets
CREATE TABLE IF NOT EXISTS projets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    budget_actuel DECIMAL(15,2) DEFAULT 0.00,
    statut ENUM('en_cours', 'terminé', 'suspendu', 'en_attente') DEFAULT 'en_cours',
    priorite VARCHAR(50) DEFAULT 'normale',
    avancement_physique INT DEFAULT 0,
    visible_public TINYINT(1) DEFAULT 1,
    type_projet_id INT,
    commune_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_debut DATE NULL,
    date_fin_prevue DATE NULL,
    date_fin_reelle DATE NULL,
    FOREIGN KEY (type_projet_id) REFERENCES types_projets(id) ON DELETE SET NULL,
    FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO projets (id, titre, description, budget_actuel, type_projet_id, commune_id, statut) VALUES 
(1, 'Construction Hôpital de District', 'Construction d\'un nouvel hôpital moderne équipé.', 150000000.00, 2, 1, 'en_cours'),
(2, 'Réhabilitation Route Principale', 'Bitumage et éclairage de la route', 250000000.00, 1, 2, 'en_cours');

-- 6. Table des jalons
CREATE TABLE IF NOT EXISTS jalons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    ordre INT DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'en_attente',
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Table des risques
CREATE TABLE IF NOT EXISTS risques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    ordre INT DEFAULT 0,
    impact VARCHAR(50) DEFAULT 'moyen',
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Table des indicateurs (KPIs)
CREATE TABLE IF NOT EXISTS indicateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    ordre INT DEFAULT 0,
    valeur_actuelle DECIMAL(10,2) DEFAULT 0,
    valeur_cible DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Table des budgets globaux
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    montant_alloue DECIMAL(15,2) DEFAULT 0.00,
    annee YEAR,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Table des dépenses (suivi budgétaire)
CREATE TABLE IF NOT EXISTS depenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    montant DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description VARCHAR(255) NULL,
    validee TINYINT(1) DEFAULT 1,
    date_depense DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Table des photos
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    fichier_url VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Table des avancements
CREATE TABLE IF NOT EXISTS avancements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projet_id INT NOT NULL,
    pourcentage INT DEFAULT 0,
    commentaire TEXT,
    date_mise_a_jour DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
