<?php
$page_title = 'Liste des projets';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// Filtres
$filtre_statut = $_GET['statut'] ?? '';
$filtre_commune = $_GET['commune'] ?? '';
$search = $_GET['search'] ?? '';

// Construction de la requête
$where = ['1=1'];
$params = [];

if ($filtre_statut) {
    $where[] = "p.statut = ?";
    $params[] = $filtre_statut;
}

if ($filtre_commune) {
    $where[] = "p.commune_id = ?";
    $params[] = $filtre_commune;
}

if ($search) {
    $where[] = "(p.titre LIKE ? OR p.description LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$where_clause = implode(' AND ', $where);

// Récupérer les projets
$sql = "
    SELECT p.*, 
           c.nom as commune_nom,
           tp.nom as type_nom,
           tp.couleur,
           CONCAT(u.prenom, ' ', u.nom) as responsable_nom
    FROM projets p
    JOIN communes c ON p.commune_id = c.id
    JOIN types_projets tp ON p.type_projet_id = tp.id
    JOIN utilisateurs u ON p.responsable_id = u.id
    WHERE $where_clause
    ORDER BY p.created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$projets = $stmt->fetchAll();

// Récupérer la liste des communes pour le filtre
$communes = $pdo->query("SELECT id, nom FROM communes ORDER BY nom")->fetchAll();
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>
    
    <!-- En-tête -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-folder me-2"></i>Projets</h1>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="<?= SITE_URL ?>/dashboard.php">Dashboard</a></li>
                        <li class="breadcrumb-item active">Projets</li>
                    </ol>
                </nav>
            </div>
            <a href="<?= SITE_URL ?>/projets/creer.php" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>
                Nouveau projet
            </a>
        </div>
    </div>
    
    <!-- Filtres -->
    <div class="card mb-4">
        <div class="card-body">
            <form method="GET" action="" class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">
                        <i class="bi bi-search me-1"></i>
                        Rechercher
                    </label>
                    <input type="text" name="search" class="form-control" 
                           placeholder="Titre ou description..." 
                           value="<?= e($search) ?>">
                </div>
                
                <div class="col-md-3">
                    <label class="form-label">
                        <i class="bi bi-funnel me-1"></i>
                        Statut
                    </label>
                    <select name="statut" class="form-select">
                        <option value="">Tous</option>
                        <option value="planifié" <?= $filtre_statut === 'planifié' ? 'selected' : '' ?>>Planifié</option>
                        <option value="en_cours" <?= $filtre_statut === 'en_cours' ? 'selected' : '' ?>>En cours</option>
                        <option value="suspendu" <?= $filtre_statut === 'suspendu' ? 'selected' : '' ?>>Suspendu</option>
                        <option value="terminé" <?= $filtre_statut === 'terminé' ? 'selected' : '' ?>>Terminé</option>
                        <option value="annulé" <?= $filtre_statut === 'annulé' ? 'selected' : '' ?>>Annulé</option>
                    </select>
                </div>
                
                <div class="col-md-3">
                    <label class="form-label">
                        <i class="bi bi-geo-alt me-1"></i>
                        Commune
                    </label>
                    <select name="commune" class="form-select">
                        <option value="">Toutes</option>
                        <?php foreach ($communes as $commune): ?>
                        <option value="<?= $commune['id'] ?>" <?= $filtre_commune == $commune['id'] ? 'selected' : '' ?>>
                            <?= e($commune['nom']) ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="col-md-2 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="bi bi-search me-1"></i>
                        Filtrer
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Liste des projets -->
    <div class="row">
        <?php foreach ($projets as $projet): ?>
        <div class="col-lg-4 col-md-6 mb-4 searchable-item">
            <div class="card h-100 project-card">
                <div class="status-indicator <?= $projet['statut'] === 'terminé' ? 'success' : ($projet['statut'] === 'en_cours' ? 'warning' : '') ?>"></div>
                
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1"><?= e($projet['titre']) ?></h5>
                            <small class="text-muted">
                                <i class="bi bi-tag" style="color: <?= e($projet['couleur']) ?>"></i>
                                <?= e($projet['type_nom']) ?>
                            </small>
                        </div>
                        <?= get_statut_badge($projet['statut']) ?>
                    </div>
                    
                    <p class="card-text text-muted small">
                        <?= e(substr($projet['description'] ?? '', 0, 100)) ?>...
                    </p>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="text-muted">Avancement</small>
                            <small class="fw-bold"><?= $projet['avancement_physique'] ?>%</small>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar <?= get_progress_class($projet['avancement_physique']) ?>" 
                                 style="width: <?= $projet['avancement_physique'] ?>%"></div>
                        </div>
                    </div>
                    
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <small class="text-muted d-block">
                                <i class="bi bi-geo-alt me-1"></i>
                                Commune
                            </small>
                            <div class="fw-bold small"><?= e($projet['commune_nom']) ?></div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block">
                                <i class="bi bi-cash me-1"></i>
                                Budget
                            </small>
                            <div class="fw-bold small"><?= number_format($projet['budget_actuel'] / 1000000, 1) ?>M</div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-person me-1"></i>
                            <?= e($projet['responsable_nom']) ?>
                        </small>
                        <a href="<?= SITE_URL ?>/projets/details.php?id=<?= $projet['id'] ?>" 
                           class="btn btn-sm btn-primary">
                            <i class="bi bi-eye me-1"></i>
                            Voir
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
        
        <?php if (empty($projets)): ?>
        <div class="col-12">
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted mb-3"></i>
                    <h4 class="text-muted">Aucun projet trouvé</h4>
                    <p class="text-muted">Essayez de modifier vos critères de recherche</p>
                    <a href="<?= SITE_URL ?>/projets/creer.php" class="btn btn-primary mt-3">
                        <i class="bi bi-plus-circle me-2"></i>
                        Créer un nouveau projet
                    </a>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
