<?php
/**
 * Portail Citoyen - Liste des projets
 * Affichage de tous les projets publics avec filtres
 */

require_once '../includes/config.php';
require_once '../includes/functions.php';

// Récupérer les filtres
$recherche = $_GET['q'] ?? '';
$commune_id = $_GET['commune'] ?? '';
$type_id = $_GET['type'] ?? '';
$statut = $_GET['statut'] ?? '';

// Construire la requête
$sql = "SELECT p.*, t.nom as type_nom, c.nom as commune_nom
        FROM projets p
        LEFT JOIN types_projets t ON p.type_projet_id = t.id
        LEFT JOIN communes c ON p.commune_id = c.id
        WHERE p.visible_public = TRUE";

$params = [];

if (!empty($recherche)) {
    $sql .= " AND (p.titre LIKE ? OR p.description LIKE ?)";
    $params[] = "%$recherche%";
    $params[] = "%$recherche%";
}

if (!empty($commune_id)) {
    $sql .= " AND p.commune_id = ?";
    $params[] = $commune_id;
}

if (!empty($type_id)) {
    $sql .= " AND p.type_projet_id = ?";
    $params[] = $type_id;
}

if (!empty($statut)) {
    $sql .= " AND p.statut = ?";
    $params[] = $statut;
}

$sql .= " ORDER BY p.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$projets = $stmt->fetchAll();

// Récupérer les options pour les filtres
$communes = $pdo->query("SELECT * FROM communes ORDER BY nom")->fetchAll();
$types = $pdo->query("SELECT * FROM types_projets ORDER BY nom")->fetchAll();

$page_title = 'Tous les projets';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page_title ?> - Portail Citoyen</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --cameroun-vert: #007A3D;
            --cameroun-jaune: #FCD116;
            --cameroun-rouge: #CE1126;
            --bg-light: #F8F9FA;
            --text-dark: #2C3E50;
            --text-muted: #6C757D;
        }
        
        * {
            font-family: 'Poppins', sans-serif;
        }
        
        body {
            background-color: var(--bg-light);
            color: var(--text-dark);
        }
        
        /* Navbar */
        .navbar-custom {
            background: linear-gradient(135deg, var(--cameroun-vert), #3d8b6f);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .navbar-custom .navbar-brand,
        .navbar-custom .nav-link {
            color: white !important;
            font-weight: 500;
        }
        
        .navbar-custom .nav-link:hover {
            color: var(--cameroun-jaune) !important;
        }
        
        /* Filtres */
        .filters-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            margin-bottom: 30px;
        }
        
        .filter-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-dark);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-control:focus,
        .form-select:focus {
            border-color: var(--cameroun-vert);
            box-shadow: 0 0 0 0.2rem rgba(45, 106, 79, 0.15);
        }
        
        .btn-filter {
            background: var(--cameroun-vert);
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 8px;
            font-weight: 500;
        }
        
        .btn-filter:hover {
            background: #245a42;
            color: white;
        }
        
        .btn-reset {
            background: var(--cameroun-rouge);
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 8px;
        }
        
        .btn-reset:hover {
            background: #a04f53;
            color: white;
        }
        
        /* Project cards */
        .project-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
            border-left: 4px solid var(--cameroun-vert);
        }
        
        .project-card:hover {
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            transform: translateY(-5px);
        }
        
        .project-card-body {
            padding: 25px;
        }
        
        .project-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--text-dark);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .project-description {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 15px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .project-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        
        .progress {
            height: 10px;
            border-radius: 10px;
            background-color: #E9ECEF;
            margin-bottom: 15px;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune));
            border-radius: 10px;
        }
        
        .badge-statut {
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.8rem;
        }
        
        .badge-planifie {
            background-color: rgba(108, 117, 125, 0.1);
            color: #6C757D;
        }
        
        .badge-en-cours {
            background-color: rgba(45, 106, 79, 0.1);
            color: var(--cameroun-vert);
        }
        
        .badge-termine {
            background-color: rgba(244, 164, 96, 0.1);
            color: var(--cameroun-jaune);
        }
        
        .btn-details {
            background: var(--cameroun-vert);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .btn-details:hover {
            background: #245a42;
            color: white;
            transform: translateX(3px);
        }
        
        .no-results {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 15px;
        }
        
        .no-results i {
            font-size: 4rem;
            color: var(--text-muted);
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-custom">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <img src="/projet-municipal/assets/images/logo.png" 
                    alt="Logo" 
                    style="height: 35px; width: 35px; object-fit: contain; margin-right: 10px; background: white; padding: 5px; border-radius: 8px;">
                Portail Citoyen
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">Accueil</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="projets.php">Projets</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="suggestion.php">Suggestions</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    
    <div class="container mt-5">
        <!-- Page header -->
        <div class="mb-4">
            <h1 class="display-5 fw-bold">
                <i class="bi bi-grid-3x3-gap" style="color: var(--cameroun-vert);"></i>
                Tous les Projets
            </h1>
            <p class="text-muted">
                <?= count($projets) ?> projet(s) trouvé(s)
            </p>
        </div>
        
        <!-- Filtres -->
        <div class="filters-card">
            <div class="filter-title">
                <i class="bi bi-funnel" style="color: var(--cameroun-vert);"></i>
                Filtrer les projets
            </div>
            
            <form method="GET" action="">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Recherche</label>
                        <input type="text" 
                               name="q" 
                               class="form-control" 
                               placeholder="Mot-clé..." 
                               value="<?= e($recherche) ?>">
                    </div>
                    
                    <div class="col-md-3">
                        <label class="form-label">Commune</label>
                        <select name="commune" class="form-select">
                            <option value="">Toutes les communes</option>
                            <?php foreach ($communes as $commune): ?>
                            <option value="<?= $commune['id'] ?>" <?= $commune_id == $commune['id'] ? 'selected' : '' ?>>
                                <?= e($commune['nom']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label class="form-label">Type</label>
                        <select name="type" class="form-select">
                            <option value="">Tous les types</option>
                            <?php foreach ($types as $type): ?>
                            <option value="<?= $type['id'] ?>" <?= $type_id == $type['id'] ? 'selected' : '' ?>>
                                <?= e($type['nom']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label class="form-label">Statut</label>
                        <select name="statut" class="form-select">
                            <option value="">Tous</option>
                            <option value="planifié" <?= $statut == 'planifié' ? 'selected' : '' ?>>Planifié</option>
                            <option value="en_cours" <?= $statut == 'en_cours' ? 'selected' : '' ?>>En cours</option>
                            <option value="terminé" <?= $statut == 'terminé' ? 'selected' : '' ?>>Terminé</option>
                        </select>
                    </div>
                </div>
                
                <div class="mt-4 d-flex gap-2">
                    <button type="submit" class="btn-filter">
                        <i class="bi bi-search"></i>
                        Filtrer
                    </button>
                    <a href="projets.php" class="btn-reset">
                        <i class="bi bi-x-circle"></i>
                        Réinitialiser
                    </a>
                </div>
            </form>
        </div>
        
        <!-- Liste des projets -->
        <?php if (count($projets) > 0): ?>
        <div class="row g-4">
            <?php foreach ($projets as $projet): ?>
            <div class="col-md-6">
                <div class="project-card">
                    <div class="project-card-body">
                        <h3 class="project-title"><?= e($projet['titre']) ?></h3>
                        
                        <?php if (!empty($projet['description'])): ?>
                        <p class="project-description"><?= e($projet['description']) ?></p>
                        <?php endif; ?>
                        
                        <div class="project-meta">
                            <span>
                                <i class="bi bi-geo-alt"></i>
                                <?= e($projet['commune_nom']) ?>
                            </span>
                            <span>
                                <i class="bi bi-tag"></i>
                                <?= e($projet['type_nom']) ?>
                            </span>
                            <span>
                                <i class="bi bi-cash"></i>
                                <?= number_format($projet['budget_actuel'], 0, ',', ' ') ?> FCFA
                            </span>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <small class="text-muted">Avancement</small>
                                <small class="fw-bold" style="color: var(--cameroun-vert);">
                                    <?= $projet['avancement_physique'] ?>%
                                </small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" 
                                     style="width: <?= $projet['avancement_physique'] ?>%">
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge-statut badge-<?= str_replace('_', '-', $projet['statut']) ?>">
                                <?= ucfirst(str_replace('_', ' ', $projet['statut'])) ?>
                            </span>
                            <a href="projet.php?id=<?= $projet['id'] ?>" class="btn-details">
                                Voir les détails
                                <i class="bi bi-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="no-results">
            <i class="bi bi-search"></i>
            <h3>Aucun projet trouvé</h3>
            <p class="text-muted">Essayez de modifier vos critères de recherche</p>
            <a href="projets.php" class="btn-filter mt-3">
                Voir tous les projets
            </a>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Footer simple -->
    <footer class="mt-5 py-4 text-center" style="background: var(--text-dark); color: white;">
        <div class="container">
            <p class="mb-0">
                &copy; <?= date('Y') ?> Communes Urbaines du Littoral - Cameroun
            </p>
            <p class="mb-0">
                <a href="index.php" style="color: var(--cameroun-jaune);">Accueil</a> |
                <a href="projets.php" style="color: var(--cameroun-jaune);">Projets</a> |
                <a href="suggestion.php" style="color: var(--cameroun-jaune);">Suggestions</a>
            </p>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
