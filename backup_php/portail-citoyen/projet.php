<?php
/**
 * Portail Citoyen - Détails d'un projet
 * Affichage public des informations d'un projet
 */

require_once '../includes/config.php';
require_once '../includes/functions.php';

$projet_id = $_GET['id'] ?? 0;

// Récupérer le projet
$stmt = $pdo->prepare("
    SELECT p.*, t.nom as type_nom, c.nom as commune_nom,
           CONCAT(u.prenom, ' ', u.nom) as responsable_nom
    FROM projets p
    LEFT JOIN types_projets t ON p.type_projet_id = t.id
    LEFT JOIN communes c ON p.commune_id = c.id
    LEFT JOIN utilisateurs u ON p.responsable_id = u.id
    WHERE p.id = ? AND p.visible_public = TRUE
");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

if (!$projet) {
    header('Location: projets.php');
    exit;
}

// Récupérer les photos
$photos = $pdo->prepare("SELECT * FROM photos WHERE projet_id = ? ORDER BY date_upload DESC LIMIT 6");
$photos->execute([$projet_id]);
$photos_list = $photos->fetchAll();

$page_title = $projet['titre'];
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($page_title) ?> - Portail Citoyen</title>
    
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
        
        .navbar-custom {
            background: linear-gradient(135deg, var(--cameroun-vert), #3d8b6f);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .navbar-custom .navbar-brand,
        .navbar-custom .nav-link {
            color: white !important;
            font-weight: 500;
        }
        
        .project-header {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            border-left: 6px solid var(--cameroun-vert);
        }
        
        .project-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 20px;
        }
        
        .project-meta-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid #E9ECEF;
        }
        
        .project-meta-item:last-child {
            border-bottom: none;
        }
        
        .project-meta-item i {
            font-size: 1.3rem;
            color: var(--cameroun-vert);
            width: 30px;
        }
        
        .card-custom {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            margin-bottom: 30px;
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-dark);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .progress-large {
            height: 30px;
            border-radius: 15px;
            background-color: #E9ECEF;
            margin: 20px 0;
        }
        
        .progress-bar-large {
            background: linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune));
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        
        .stat-item {
            text-align: center;
            padding: 20px;
            background: var(--bg-light);
            border-radius: 12px;
            border-left: 4px solid var(--cameroun-vert);
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--cameroun-vert);
        }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .photo-item {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .photo-item:hover {
            transform: scale(1.05);
        }
        
        .photo-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        
        .badge-large {
            padding: 10px 20px;
            font-size: 1rem;
            font-weight: 500;
            border-radius: 25px;
        }
        
        .btn-suggestion {
            background: linear-gradient(135deg, var(--cameroun-vert), var(--cameroun-jaune));
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        
        .btn-suggestion:hover {
            transform: translateY(-3px);
            color: white;
            box-shadow: 0 8px 20px rgba(45, 106, 79, 0.3);
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
                        <a class="nav-link" href="projets.php">Projets</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="suggestion.php">Suggestions</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    
    <div class="container mt-5">
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php" style="color: var(--cameroun-vert);">Accueil</a></li>
                <li class="breadcrumb-item"><a href="projets.php" style="color: var(--cameroun-vert);">Projets</a></li>
                <li class="breadcrumb-item active"><?= e($projet['titre']) ?></li>
            </ol>
        </nav>
        
        <!-- En-tête du projet -->
        <div class="project-header">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="project-title"><?= e($projet['titre']) ?></h1>
                    
                    <div class="project-meta-item">
                        <i class="bi bi-geo-alt-fill"></i>
                        <div>
                            <strong>Commune :</strong>
                            <?= e($projet['commune_nom']) ?>
                        </div>
                    </div>
                    
                    <div class="project-meta-item">
                        <i class="bi bi-tag-fill"></i>
                        <div>
                            <strong>Type :</strong>
                            <?= e($projet['type_nom']) ?>
                        </div>
                    </div>
                    
                    <?php if (!empty($projet['adresse'])): ?>
                    <div class="project-meta-item">
                        <i class="bi bi-pin-map-fill"></i>
                        <div>
                            <strong>Localisation :</strong>
                            <?= e($projet['adresse']) ?>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
                
                <div class="col-md-4 text-center">
                    <span class="badge-large" style="background: <?= $projet['statut'] == 'en_cours' ? 'var(--cameroun-vert)' : 'var(--cameroun-jaune)' ?>;">
                        <?= ucfirst(str_replace('_', ' ', $projet['statut'])) ?>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="row">
            <!-- Colonne principale -->
            <div class="col-lg-8">
                <!-- Description -->
                <?php if (!empty($projet['description'])): ?>
                <div class="card-custom">
                    <h2 class="card-title">
                        <i class="bi bi-file-text" style="color: var(--cameroun-vert);"></i>
                        Description du projet
                    </h2>
                    <p style="line-height: 1.8; text-align: justify;">
                        <?= nl2br(e($projet['description'])) ?>
                    </p>
                </div>
                <?php endif; ?>
                
                <!-- Avancement -->
                <div class="card-custom">
                    <h2 class="card-title">
                        <i class="bi bi-graph-up-arrow" style="color: var(--cameroun-vert);"></i>
                        Avancement du projet
                    </h2>
                    
                    <div class="progress-large">
                        <div class="progress-bar-large" style="width: <?= $projet['avancement_physique'] ?>%">
                            <?= $projet['avancement_physique'] ?>%
                        </div>
                    </div>
                    
                    <div class="row g-3 mt-3">
                        <div class="col-md-4">
                            <div class="stat-item">
                                <div class="stat-value"><?= $projet['avancement_physique'] ?>%</div>
                                <div class="stat-label">Avancement physique</div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="stat-item">
                                <div class="stat-value"><?= format_date($projet['date_debut']) ?></div>
                                <div class="stat-label">Date de début</div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="stat-item">
                                <div class="stat-value"><?= format_date($projet['date_fin_prevue']) ?></div>
                                <div class="stat-label">Date de fin prévue</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Photos -->
                <?php if (count($photos_list) > 0): ?>
                <div class="card-custom">
                    <h2 class="card-title">
                        <i class="bi bi-images" style="color: var(--cameroun-vert);"></i>
                        Galerie photos (<?= count($photos_list) ?>)
                    </h2>
                    
                    <div class="photo-grid">
                        <?php foreach ($photos_list as $photo): ?>
                        <div class="photo-item">
                            <img src="../assets/uploads/<?= e($photo['fichier_url']) ?>" 
                                 alt="<?= e($photo['legende'] ?? 'Photo du projet') ?>"
                                 data-bs-toggle="modal"
                                 data-bs-target="#photoModal<?= $photo['id'] ?>"
                                 style="cursor: pointer;">
                        </div>
                        
                        <!-- Modal pour la photo -->
                        <div class="modal fade" id="photoModal<?= $photo['id'] ?>" tabindex="-1">
                            <div class="modal-dialog modal-lg modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-body p-0">
                                        <img src="../assets/uploads/<?= e($photo['fichier_url']) ?>" 
                                             class="img-fluid w-100"
                                             alt="<?= e($photo['legende'] ?? 'Photo du projet') ?>">
                                    </div>
                                    <?php if (!empty($photo['legende'])): ?>
                                    <div class="modal-footer">
                                        <p class="mb-0"><?= e($photo['legende']) ?></p>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Sidebar -->
            <div class="col-lg-4">
                <!-- Informations clés -->
                <div class="card-custom">
                    <h3 class="card-title">
                        <i class="bi bi-info-circle" style="color: var(--cameroun-vert);"></i>
                        Informations clés
                    </h3>
                    
                    <div class="mb-3">
                        <strong style="color: var(--text-muted);">Budget :</strong>
                        <div class="fs-4 fw-bold" style="color: var(--cameroun-vert);">
                            <?= number_format($projet['budget_actuel'], 0, ',', ' ') ?> FCFA
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <strong style="color: var(--text-muted);">Responsable :</strong>
                        <div><?= e($projet['responsable_nom']) ?></div>
                    </div>
                    
                    <div class="mb-3">
                        <strong style="color: var(--text-muted);">Statut :</strong>
                        <div><?= ucfirst(str_replace('_', ' ', $projet['statut'])) ?></div>
                    </div>
                    
                    <div>
                        <strong style="color: var(--text-muted);">Créé le :</strong>
                        <div><?= format_date($projet['created_at']) ?></div>
                    </div>
                </div>
                
                <!-- Call to action -->
                <div class="card-custom text-center" style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.05), rgba(244, 164, 96, 0.05));">
                    <i class="bi bi-chat-dots" style="font-size: 3rem; color: var(--cameroun-vert);"></i>
                    <h4 class="mt-3 mb-3">Une suggestion ?</h4>
                    <p class="text-muted">
                        Partagez votre avis sur ce projet
                    </p>
                    <a href="suggestion.php?projet=<?= $projet['id'] ?>" class="btn-suggestion">
                        <i class="bi bi-pencil-square me-2"></i>
                        Faire une suggestion
                    </a>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <footer class="mt-5 py-4 text-center" style="background: var(--text-dark); color: white;">
        <div class="container">
            <p class="mb-0">
                &copy; <?= date('Y') ?> Communes Urbaines du Littoral - Cameroun
            </p>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
