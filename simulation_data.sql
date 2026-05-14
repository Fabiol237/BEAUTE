-- Script de simulation complète pour 5 mairies
-- Douala 1er, 2e, 3e, 4e, 5e

-- Nettoyage des projets existants pour la simulation
DELETE FROM suggestions;
DELETE FROM depenses;
DELETE FROM jalons;
DELETE FROM projets;

-- 1. PROJETS POUR DOUALA 1er (Centre des affaires)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique, visible_public, priorite, date_debut, date_fin_prevue) VALUES 
('Modernisation de l''Hôtel de Ville', 'Rénovation complète de la façade et digitalisation des services.', 85000000, 1, 1, 'en_cours', 4.0441, 9.6845, 35, true, 'normale', '2024-01-15', '2024-12-30'),
('Éclairage LED Boulevard de la Liberté', 'Installation de 500 lampadaires solaires intelligents.', 120000000, 4, 1, 'terminé', 4.0485, 9.6922, 100, true, 'haute', '2023-06-01', '2023-12-15'),
('Aménagement Jardin Public Bonanjo', 'Création d''espaces verts et aires de jeux.', 45000000, 1, 1, 'planifié', 4.0412, 9.6811, 0, true, 'basse', '2024-05-01', '2024-10-20');

-- 2. PROJETS POUR DOUALA 2e (New Bell)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique, visible_public, priorite, date_debut, date_fin_prevue) VALUES 
('Réhabilitation Marché Central', 'Assainissement et reconstruction des hangars.', 200000000, 1, 2, 'en_cours', 4.0322, 9.7045, 60, true, 'critique', '2023-10-01', '2024-08-15'),
('Centre de Santé New Bell Nord', 'Construction d''un pavillon de maternité.', 75000000, 2, 2, 'suspendu', 4.0288, 9.7122, 45, true, 'haute', '2023-08-15', '2024-03-30');

-- 3. PROJETS POUR DOUALA 3e (Logbaba)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique, visible_public, priorite, date_debut, date_fin_prevue) VALUES 
('Zone Industrielle - Accès Routier', 'Bitumage des voies d''accès à la zone industrielle de Logbaba.', 350000000, 1, 3, 'en_cours', 4.0455, 9.7522, 25, true, 'haute', '2024-02-01', '2025-02-28'),
('Extension École Publique Nyalla', 'Construction de 6 nouvelles salles de classe.', 40000000, 3, 3, 'terminé', 4.0511, 9.7679, 100, true, 'normale', '2023-07-01', '2023-11-30');

-- 4. PROJETS POUR DOUALA 4e (Bonabéri)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique, visible_public, priorite, date_debut, date_fin_prevue) VALUES 
('Drainage des Eaux de Pluie - Sodiko', 'Construction de caniveaux géants pour éviter les inondations.', 180000000, 5, 4, 'en_cours', 4.0722, 9.6545, 75, true, 'critique', '2023-11-15', '2024-07-30'),
('Pont Piétonnier sur la Route de l''Ouest', 'Passerelle de sécurité pour les écoliers.', 35000000, 1, 4, 'planifié', 4.0655, 9.6622, 0, true, 'haute', '2024-06-01', '2024-11-15');

-- 5. PROJETS POUR DOUALA 5e (Bonamoussadi)
INSERT INTO projets (titre, description, budget_actuel, type_projet_id, commune_id, statut, latitude, longitude, avancement_physique, visible_public, priorite, date_debut, date_fin_prevue) VALUES 
('Stade Municipal de Bonamoussadi', 'Modernisation de la pelouse et éclairage nocturne.', 150000000, 1, 5, 'en_cours', 4.0811, 9.7345, 85, true, 'normale', '2023-05-01', '2024-04-30'),
('Plateforme Digitale "Mairie Connectée"', 'Développement d''une application pour les services administratifs.', 25000000, 3, 5, 'en_cours', 4.0855, 9.7422, 90, true, 'basse', '2024-01-01', '2024-06-30');

-- 6. SIMULATION DE SIGNALEMENTS CITOYENS
INSERT INTO suggestions (titre, description, citoyen_nom, citoyen_email, mode, statut, quartier, commune_id, latitude, longitude, priorite) VALUES 
('Nid de poule dangereux', 'Un énorme trou s''est formé devant l''école.', 'Momo Jean', 'jean@mail.com', 'signalement', 'nouveau', 'Akwa', 1, 4.0485, 9.6922, 'haute'),
('Panne éclairage public', 'Toute la rue est dans le noir depuis 3 jours.', 'Ngo Marie', 'marie@mail.com', 'signalement', 'en_cours', 'Logbaba', 3, 4.0455, 9.7522, 'normale'),
('Suggestion Parc Sportif', 'Il serait bien d''avoir un parcours de santé ici.', 'Fosso Paul', 'paul@mail.com', 'suggestion', 'nouveau', 'Bonamoussadi', 5, 4.0811, 9.7345, 'basse');

-- 7. SIMULATION DE DÉPENSES
INSERT INTO depenses (projet_id, montant, description, validee, date_depense) VALUES 
(1, 15000000, 'Acompte travaux électricité', true, '2024-02-10'),
(2, 45000000, 'Paiement fournisseur lampadaires', true, '2023-11-20'),
(4, 25000000, 'Achat béton et fers', true, '2024-01-05');
