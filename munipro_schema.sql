-- ============================================================
-- MuniPro — Schéma Complet de Base de Données
-- Projet de Suivi Numérique des Communes Urbaines du Littoral
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. RÔLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `roles` (
  `id`    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom`   VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `roles` (`nom`) VALUES ('admin'), ('agent'), ('lecteur');

-- ── 2. COMMUNES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `communes` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom`          VARCHAR(120) NOT NULL,
  `region`       VARCHAR(80)  NOT NULL DEFAULT 'Littoral',
  `email`        VARCHAR(150) NOT NULL UNIQUE,
  `telephone`    VARCHAR(30),
  `responsable`  VARCHAR(120),
  `adresse`      TEXT,
  `statut`       ENUM('actif','suspendu','inactif') NOT NULL DEFAULT 'actif',
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. UTILISATEURS (Agents des Communes) ─────────────────────
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `commune_id`         INT UNSIGNED NOT NULL,
  `role_id`            INT UNSIGNED NOT NULL DEFAULT 1,
  `nom`                VARCHAR(80)  NOT NULL,
  `prenom`             VARCHAR(80)  NOT NULL,
  `email`              VARCHAR(150) NOT NULL UNIQUE,
  `password_hash`      VARCHAR(255) NOT NULL,
  `role`               ENUM('admin','agent','lecteur') NOT NULL DEFAULT 'admin',
  `statut`             ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  `actif`              TINYINT(1) NOT NULL DEFAULT 1,
  `derniere_connexion` TIMESTAMP NULL,
  `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`)    REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. ADMINS MUNIPRO (Super Administrateurs) ─────────────────
CREATE TABLE IF NOT EXISTS `munipro_admins` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom`                VARCHAR(120) NOT NULL,
  `email`              VARCHAR(150) NOT NULL UNIQUE,
  `password_hash`      VARCHAR(255) NOT NULL,
  `role`               VARCHAR(50)  NOT NULL DEFAULT 'super_admin',
  `statut`             ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  `derniere_connexion` TIMESTAMP NULL,
  `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. TYPES DE PROJETS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `types_projets` (
  `id`      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom`     VARCHAR(80)  NOT NULL,
  `couleur` VARCHAR(10)  NOT NULL DEFAULT '#6366f1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `types_projets` (`nom`, `couleur`) VALUES
  ('Infrastructures', '#f59e0b'),
  ('Santé',           '#10b981'),
  ('Éducation',       '#2563eb'),
  ('Hydraulique',     '#0ea5e9'),
  ('Énergie',         '#8b5cf6'),
  ('Commerce',        '#ec4899'),
  ('Environnement',   '#14b8a6'),
  ('Voirie',          '#f97316'),
  ('Social',          '#a78bfa'),
  ('Autre',           '#64748b');

-- ── 6. PROJETS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projets` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `commune_id`          INT UNSIGNED NOT NULL,
  `type_projet_id`      INT UNSIGNED NOT NULL,
  `titre`               VARCHAR(200) NOT NULL,
  `description`         TEXT,
  `statut`              ENUM('planifié','en_cours','terminé','suspendu','annulé') NOT NULL DEFAULT 'planifié',
  `budget_previsionnel` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `budget_actuel`       DECIMAL(15,2) NOT NULL DEFAULT 0,
  `avancement_physique` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `date_debut`          DATE,
  `date_fin_prevue`     DATE,
  `date_fin_reelle`     DATE,
  `latitude`            DECIMAL(10,7),
  `longitude`           DECIMAL(10,7),
  `localisation`        VARCHAR(200),
  `photo`               VARCHAR(255),
  `visible_public`      TINYINT(1) NOT NULL DEFAULT 1,
  `created_by`          INT UNSIGNED,
  `created_at`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`commune_id`)     REFERENCES `communes`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`type_projet_id`) REFERENCES `types_projets`(`id`),
  FOREIGN KEY (`created_by`)     REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. DÉPENSES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `depenses` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `projet_id`      INT UNSIGNED NOT NULL,
  `libelle`        VARCHAR(150) NOT NULL,
  `description`    TEXT,
  `montant`        DECIMAL(15,2) NOT NULL,
  `date_depense`   DATE NOT NULL,
  `numero_facture` VARCHAR(50),
  `fournisseur`    VARCHAR(150),
  `saisi_par`      INT UNSIGNED,
  `validee`        TINYINT(1) NOT NULL DEFAULT 0,
  `validee_par`    INT UNSIGNED,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projet_id`)   REFERENCES `projets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`validee_par`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`saisi_par`)   REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ── 8. PHOTOS DES CHANTIERS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `photos_projets` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `projet_id`   INT UNSIGNED NOT NULL,
  `fichier`     VARCHAR(255) NOT NULL,
  `legende`     VARCHAR(200),
  `uploaded_by` INT UNSIGNED,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projet_id`)   REFERENCES `projets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. SIGNALEMENTS CITOYENS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `signalements` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `projet_id`   INT UNSIGNED,
  `commune_id`  INT UNSIGNED,
  `nom_citoyen` VARCHAR(120),
  `email`       VARCHAR(150),
  `message`     TEXT NOT NULL,
  `statut`      ENUM('nouveau','traité','rejeté') DEFAULT 'nouveau',
  `photo`       VARCHAR(255),
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projet_id`)  REFERENCES `projets`(`id`)  ON DELETE SET NULL,
  FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 10. JOURNAL D'ACTIVITÉ ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `journal` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT UNSIGNED,
  `action`       VARCHAR(100) NOT NULL,
  `description`  TEXT,
  `ip`           VARCHAR(45),
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 11. SUGGESTIONS CITOYENNES ────────────────────────────────
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `mode`               VARCHAR(20) NOT NULL DEFAULT 'suggestion',
  `citoyen_nom`        VARCHAR(120) NOT NULL,
  `citoyen_email`      VARCHAR(150) NOT NULL,
  `citoyen_telephone`  VARCHAR(30),
  `projet_id`          INT UNSIGNED,
  `categorie`          VARCHAR(80) NOT NULL,
  `titre`              VARCHAR(150),
  `description`        TEXT NOT NULL,
  `quartier`           VARCHAR(120),
  `priorite_citoyen`   ENUM('basse','haute') DEFAULT 'basse',
  `disponible_contact` TINYINT(1) DEFAULT 0,
  `adresse_probleme`   VARCHAR(255),
  `latitude`           DECIMAL(10,7),
  `longitude`          DECIMAL(10,7),
  `depuis_quand`       VARCHAR(80),
  `a_temoins`          TINYINT(1) DEFAULT 0,
  `priorite`           VARCHAR(20) DEFAULT 'basse',
  `date_soumission`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projet_id`) REFERENCES `projets`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 12. PHOTOS DES SIGNALEMENTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS `signalement_photos` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `suggestion_id` INT UNSIGNED NOT NULL,
  `fichier_url`   VARCHAR(255) NOT NULL,
  `fichier_nom`   VARCHAR(255) NOT NULL,
  `taille`        INT UNSIGNED,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`suggestion_id`) REFERENCES `suggestions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONNÉES D'EXEMPLE (à supprimer en production)
-- Mot de passe par défaut: munipro2024
-- Hash bcrypt généré: $2b$10$X.K5v0EHmWRn6hH3CzPW0.vVlF4n1H6lTHWkYrKFuvw6E1kCiVPpe
-- ============================================================

INSERT IGNORE INTO `munipro_admins` (`nom`, `email`, `password_hash`, `role`) VALUES
  ('MuniPro Admin', 'admin@munipro.cm', '$2b$10$tvd1fMf/4kWLunRpZ81.eeStrOeI8i6REsL7EYCNXsHZe9mj21oSi', 'super_admin');

-- Communes du Littoral
INSERT IGNORE INTO `communes` (`nom`, `region`, `email`, `telephone`, `responsable`, `statut`) VALUES
  ('Douala 1er',  'Littoral', 'admin@douala1.cm',  '+237 233 001 001', 'M. Jean MBARGA',    'actif'),
  ('Douala 2e',   'Littoral', 'admin@douala2.cm',  '+237 233 002 002', 'Mme Claire EBONGUE','actif'),
  ('Douala 3e',   'Littoral', 'admin@douala3.cm',  '+237 233 003 003', 'M. Paul NDOUMBE',   'actif'),
  ('Douala 4e',   'Littoral', 'admin@douala4.cm',  '+237 233 004 004', 'M. Henri BELLO',    'actif'),
  ('Douala 5e',   'Littoral', 'admin@douala5.cm',  '+237 233 005 005', 'Mme Sophie KOUM',   'actif'),
  ('Nkongsamba',  'Littoral', 'admin@nkongsamba.cm','+237 233 006 006', 'M. Louis ETOGA',   'actif');

-- Administrateurs des communes (mot de passe: commune2024)
INSERT IGNORE INTO `utilisateurs` (`commune_id`, `role_id`, `nom`, `prenom`, `email`, `password_hash`, `role`) VALUES
  (1, 1, 'MBARGA',  'Jean',    'admin@douala1.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (2, 1, 'EBONGUE', 'Claire',  'admin@douala2.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (3, 1, 'NDOUMBE', 'Paul',    'admin@douala3.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (4, 1, 'BELLO',   'Henri',   'admin@douala4.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (5, 1, 'KOUM',    'Sophie',  'admin@douala5.cm',   '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin'),
  (6, 1, 'ETOGA',   'Louis',   'admin@nkongsamba.cm','$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6', 'admin');

