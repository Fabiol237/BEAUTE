<?php
$page_title = 'Générer un rapport';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// Récupérer l'ID du projet
$projet_id = $_GET['id'] ?? 0;

// Récupérer les détails du projet
$stmt = $pdo->prepare("SELECT id, titre FROM projets WHERE id = ?");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

if (!$projet) {
    set_flash('error', 'Projet introuvable');
    header('Location: liste.php');
    exit;
}
?>

<div class="container-fluid mt-4">
    <!-- En-tête -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-file-earmark-pdf me-2"></i>Générer un rapport</h1>
                <p class="text-muted mb-0">
                    Projet : <strong><?= e($projet['titre']) ?></strong>
                </p>
            </div>
            <a href="details.php?id=<?= $projet_id ?>" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Retour au projet
            </a>
        </div>
    </div>
    
    <div class="row mt-4">
        <div class="col-lg-8 mx-auto">
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Information :</strong> Choisissez le type de rapport que vous souhaitez générer. Le PDF sera automatiquement téléchargé.
            </div>
            
            <!-- Rapport complet -->
            <div class="card mb-4 hover-shadow">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <i class="bi bi-file-earmark-text display-1 text-primary"></i>
                        </div>
                        <div class="col-md-7">
                            <h4 class="mb-2">
                                <i class="bi bi-clipboard-data me-2"></i>
                                Rapport complet
                            </h4>
                            <p class="text-muted mb-0">
                                Rapport détaillé avec toutes les informations du projet : 
                                informations générales, budget, avancement, photos et historique.
                            </p>
                            <div class="mt-2">
                                <span class="badge bg-primary">Informations</span>
                                <span class="badge bg-success">Budget</span>
                                <span class="badge bg-warning">Avancement</span>
                                <span class="badge bg-info">Photos</span>
                                <span class="badge bg-secondary">Historique</span>
                            </div>
                        </div>
                        <div class="col-md-3 text-center">
                            <a href="generer-rapport.php?id=<?= $projet_id ?>&type=complet" 
                               class="btn btn-primary btn-lg w-100"
                               target="_blank">
                                <i class="bi bi-download me-2"></i>
                                Générer
                            </a>
                            <small class="text-muted d-block mt-2">~5-10 pages</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rapport financier -->
            <div class="card mb-4 hover-shadow">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <i class="bi bi-cash-stack display-1 text-success"></i>
                        </div>
                        <div class="col-md-7">
                            <h4 class="mb-2">
                                <i class="bi bi-calculator me-2"></i>
                                Rapport financier
                            </h4>
                            <p class="text-muted mb-0">
                                Rapport centré sur l'aspect budgétaire : budget initial, dépenses, 
                                taux de consommation et liste détaillée de toutes les dépenses.
                            </p>
                            <div class="mt-2">
                                <span class="badge bg-success">Budget</span>
                                <span class="badge bg-danger">Dépenses</span>
                                <span class="badge bg-warning">Taux consommation</span>
                            </div>
                        </div>
                        <div class="col-md-3 text-center">
                            <a href="generer-rapport.php?id=<?= $projet_id ?>&type=financier" 
                               class="btn btn-success btn-lg w-100"
                               target="_blank">
                                <i class="bi bi-download me-2"></i>
                                Générer
                            </a>
                            <small class="text-muted d-block mt-2">~2-4 pages</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rapport d'avancement -->
            <div class="card mb-4 hover-shadow">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <i class="bi bi-graph-up display-1 text-warning"></i>
                        </div>
                        <div class="col-md-7">
                            <h4 class="mb-2">
                                <i class="bi bi-speedometer2 me-2"></i>
                                Rapport d'avancement
                            </h4>
                            <p class="text-muted mb-0">
                                Rapport sur la progression du projet : avancement physique et temporel, 
                                jalons atteints, et comparaison planning vs réalisé.
                            </p>
                            <div class="mt-2">
                                <span class="badge bg-warning">Avancement</span>
                                <span class="badge bg-info">Planning</span>
                                <span class="badge bg-secondary">Jalons</span>
                            </div>
                        </div>
                        <div class="col-md-3 text-center">
                            <a href="generer-rapport.php?id=<?= $projet_id ?>&type=avancement" 
                               class="btn btn-warning btn-lg w-100"
                               target="_blank">
                                <i class="bi bi-download me-2"></i>
                                Générer
                            </a>
                            <small class="text-muted d-block mt-2">~2-3 pages</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Informations -->
            <div class="card bg-light">
                <div class="card-body">
                    <h5 class="mb-3">
                        <i class="bi bi-lightbulb me-2"></i>
                        Conseils d'utilisation
                    </h5>
                    <ul class="mb-0">
                        <li>Les rapports sont générés au format PDF (A4)</li>
                        <li>Le téléchargement démarre automatiquement</li>
                        <li>Les rapports incluent la date de génération</li>
                        <li>Vous pouvez générer autant de rapports que nécessaire</li>
                        <li>Les photos du projet sont incluses dans le rapport complet</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.hover-shadow {
    transition: all 0.3s ease;
}

.hover-shadow:hover {
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15) !important;
    transform: translateY(-3px);
}
</style>

<?php require_once '../includes/footer.php'; ?>
