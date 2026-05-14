<?php
$page_title = 'Détails du projet';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

$projet_id = $_GET['id'] ?? 0;

// -------------------------------------------------------
// BUG CORRIGÉ : Traitement du formulaire d'avancement
// (était un simple alert() "fonctionnalité à venir")
// -------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_avancement') {
    $pourcentage  = (int)($_POST['pourcentage']  ?? 0);
    $description  = trim($_POST['description']   ?? '');
    $observations = trim($_POST['observations']  ?? '');
    $date_constat = $_POST['date_constat']        ?? date('Y-m-d');

    if ($pourcentage < 0 || $pourcentage > 100) {
        set_flash('danger', "Le pourcentage doit être entre 0 et 100.");
    } else {
        try {
            // Enregistrer l'avancement
            $pdo->prepare("
                INSERT INTO avancements (projet_id, utilisateur_id, pourcentage, description, observations, date_constat)
                VALUES (?, ?, ?, ?, ?, ?)
            ")->execute([$projet_id, $_SESSION['utilisateur_id'], $pourcentage, $description ?: null, $observations ?: null, $date_constat]);

            // Mettre à jour le pourcentage dans la table projets
            $pdo->prepare("UPDATE projets SET avancement_physique = ?, updated_at = NOW() WHERE id = ?")
                ->execute([$pourcentage, $projet_id]);

            set_flash('success', "Avancement mis à jour à {$pourcentage}% !");
        } catch (Exception $e) {
            set_flash('danger', "Erreur : " . $e->getMessage());
        }
    }
    header('Location: details.php?id=' . $projet_id);
    exit;
}

// Récupérer les détails du projet
$sql = "
    SELECT p.*, 
           c.nom as commune_nom,
           r.nom as region_nom,
           tp.nom as type_nom,
           tp.couleur as type_couleur,
           tp.icone as type_icone,
           CONCAT(u.prenom, ' ', u.nom) as responsable_nom,
           u.email as responsable_email
    FROM projets p
    JOIN communes c ON p.commune_id = c.id
    JOIN regions r ON c.region_id = r.id
    JOIN types_projets tp ON p.type_projet_id = tp.id
    JOIN utilisateurs u ON p.responsable_id = u.id
    WHERE p.id = ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

if (!$projet) {
    set_flash('error', 'Projet introuvable');
    header('Location: liste.php');
    exit;
}

// Calculer les statistiques
$total_depenses = $pdo->prepare("
    SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE projet_id = ? AND validee = TRUE
");
$total_depenses->execute([$projet_id]);
$depenses = $total_depenses->fetchColumn();

$taux_consommation = $projet['budget_actuel'] > 0 ? ($depenses / $projet['budget_actuel']) * 100 : 0;
$budget_restant = $projet['budget_actuel'] - $depenses;

// Calculer les jours
$jours_restants  = jours_restants($projet['date_fin_prevue']);
$jours_ecoules   = (new DateTime())->diff(new DateTime($projet['date_debut']))->days;
$duree_totale    = (new DateTime($projet['date_fin_prevue']))->diff(new DateTime($projet['date_debut']))->days;
$pourcentage_temps = $duree_totale > 0 ? ($jours_ecoules / $duree_totale) * 100 : 0;

// Récupérer les derniers avancements
$avancements = $pdo->prepare("
    SELECT a.*, CONCAT(u.prenom, ' ', u.nom) as auteur
    FROM avancements a
    JOIN utilisateurs u ON a.utilisateur_id = u.id
    WHERE a.projet_id = ?
    ORDER BY a.date_constat DESC
    LIMIT 5
");
$avancements->execute([$projet_id]);
$liste_avancements = $avancements->fetchAll();

// Récupérer les photos
$photos = $pdo->prepare("
    SELECT p.*, CONCAT(u.prenom, ' ', u.nom) as upload_par_nom
    FROM photos p
    JOIN utilisateurs u ON p.uploaded_by = u.id
    WHERE p.projet_id = ?
    ORDER BY p.date_upload DESC
    LIMIT 6
");
$photos->execute([$projet_id]);
$liste_photos = $photos->fetchAll();
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>
    
    <!-- En-tête du projet -->
    <div class="card mb-4" style="border-left: 5px solid <?= e($projet['type_couleur']) ?>">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge" style="background-color: <?= e($projet['type_couleur']) ?>">
                            <i class="bi bi-<?= e($projet['type_icone']) ?> me-1"></i>
                            <?= e($projet['type_nom']) ?>
                        </span>
                        <?= get_statut_badge($projet['statut']) ?>
                    </div>
                    <h1 class="mb-2"><?= e($projet['titre']) ?></h1>
                    <p class="text-muted mb-0">
                        <i class="bi bi-geo-alt me-1"></i>
                        <?= e($projet['commune_nom']) ?>, <?= e($projet['region_nom']) ?>
                    </p>
                </div>
                <div class="text-end">
                    <a href="modifier.php?id=<?= $projet['id'] ?>" class="btn btn-primary mb-2">
                        <i class="bi bi-pencil me-2"></i>
                        Modifier
                    </a>
                    <br>
                    <a href="liste.php" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-left me-2"></i>
                        Retour à la liste
                    </a>
                </div>
            </div>
            
            <?php if ($projet['description']): ?>
            <div class="mt-3">
                <h6 class="text-muted mb-2">Description</h6>
                <p class="mb-0"><?= nl2br(e($projet['description'])) ?></p>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="row">
        <!-- Colonne principale -->
        <div class="col-lg-8">
            <!-- Avancement -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-graph-up me-2"></i>
                        Avancement du projet
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h6 class="text-muted mb-3">Avancement physique</h6>
                            <div class="d-flex align-items-center mb-2">
                                <h2 class="mb-0 me-3"><?= $projet['avancement_physique'] ?>%</h2>
                                <div class="flex-grow-1">
                                    <div class="progress" style="height: 12px;">
                                        <div class="progress-bar <?= get_progress_class($projet['avancement_physique']) ?>" 
                                             style="width: <?= $projet['avancement_physique'] ?>%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <h6 class="text-muted mb-3">Avancement temporel</h6>
                            <div class="d-flex align-items-center mb-2">
                                <h2 class="mb-0 me-3"><?= round($pourcentage_temps) ?>%</h2>
                                <div class="flex-grow-1">
                                    <div class="progress" style="height: 12px;">
                                        <div class="progress-bar bg-info" 
                                             style="width: <?= min($pourcentage_temps, 100) ?>%"></div>
                                    </div>
                                </div>
                            </div>
                            <small class="text-muted">
                                <?= $jours_ecoules ?> jours écoulés sur <?= $duree_totale ?>
                            </small>
                        </div>
                    </div>
                    
                    <!-- Historique des avancements -->
                    <h6 class="text-muted mb-3">
                        <i class="bi bi-clock-history me-2"></i>
                        Historique des mises à jour
                    </h6>
                    
                    <?php if (!empty($liste_avancements)): ?>
                    <div class="list-group">
                        <?php foreach ($liste_avancements as $avancement): ?>
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="badge bg-primary"><?= $avancement['pourcentage'] ?>%</span>
                                        <small class="text-muted">
                                            <i class="bi bi-calendar3 me-1"></i>
                                            <?= format_date($avancement['date_constat']) ?>
                                        </small>
                                        <small class="text-muted">
                                            <i class="bi bi-person me-1"></i>
                                            <?= e($avancement['auteur']) ?>
                                        </small>
                                    </div>
                                    <?php if ($avancement['description']): ?>
                                    <p class="mb-1 small"><?= e($avancement['description']) ?></p>
                                    <?php endif; ?>
                                    <?php if ($avancement['observations']): ?>
                                    <p class="mb-0 small text-muted">
                                        <i class="bi bi-chat-left-text me-1"></i>
                                        <?= e($avancement['observations']) ?>
                                    </p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php else: ?>
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        <p>Aucune mise à jour d'avancement pour le moment</p>
                    </div>
                    <?php endif; ?>
                    
                    <!-- BUG CORRIGÉ : bouton ouvre un vrai modal au lieu de alert() -->
                    <div class="mt-3">
                        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalAvancement">
                            <i class="bi bi-plus-circle me-2"></i>
                            Mettre à jour l'avancement
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Budget -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-cash-stack me-2"></i>
                        Informations budgétaires
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row g-3 mb-4">
                        <div class="col-md-4">
                            <div class="bg-light-primary p-3 rounded">
                                <small class="text-muted d-block mb-1">Budget initial</small>
                                <h4 class="mb-0 text-primary"><?= format_montant($projet['budget_initial']) ?></h4>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="bg-light-warning p-3 rounded">
                                <small class="text-muted d-block mb-1">Dépenses</small>
                                <h4 class="mb-0 text-warning"><?= format_montant($depenses) ?></h4>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="bg-light-success p-3 rounded">
                                <small class="text-muted d-block mb-1">Reste</small>
                                <h4 class="mb-0 text-success"><?= format_montant($budget_restant) ?></h4>
                            </div>
                        </div>
                    </div>
                    
                    <h6 class="text-muted mb-2">Taux de consommation</h6>
                    <div class="progress mb-2" style="height: 20px;">
                        <div class="progress-bar <?= $taux_consommation > 90 ? 'bg-danger' : ($taux_consommation > 70 ? 'bg-warning' : 'bg-success') ?>" 
                             style="width: <?= min($taux_consommation, 100) ?>%">
                            <?= round($taux_consommation, 1) ?>%
                        </div>
                    </div>
                    
                    <?php if ($taux_consommation > 80): ?>
                    <div class="alert alert-warning mt-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Attention !</strong> Le budget est consommé à plus de <?= round($taux_consommation) ?>%
                    </div>
                    <?php endif; ?>
                    
                    <div class="mt-3">
                        <a href="<?= SITE_URL ?>/budget/liste.php?projet=<?= $projet['id'] ?>" class="btn btn-outline-primary me-2">
                            <i class="bi bi-eye me-2"></i>
                            Voir le détail
                        </a>
                        <!-- BUG CORRIGÉ : lien vers depenses.php au lieu d'un alert() -->
                        <a href="<?= SITE_URL ?>/budget/depenses.php?projet_id=<?= $projet['id'] ?>" class="btn btn-primary">
                            <i class="bi bi-plus-circle me-2"></i>
                            Ajouter une dépense
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- Photos -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-images me-2"></i>
                        Photos du projet
                    </h5>
                </div>
                <div class="card-body">
                    <?php if (!empty($liste_photos)): ?>
                    <div class="row g-3">
                        <?php foreach ($liste_photos as $photo): ?>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="ratio ratio-4x3">
                                    <img src="<?= SITE_URL ?>/assets/uploads/<?= e($photo['fichier_url']) ?>" 
                                         class="card-img-top object-fit-cover" 
                                         alt="<?= e($photo['legende']) ?>"
                                         onerror="this.src='https://via.placeholder.com/400x300?text=Image'">
                                </div>
                                <div class="card-body p-2">
                                    <?php if ($photo['legende']): ?>
                                    <small class="d-block mb-1"><?= e($photo['legende']) ?></small>
                                    <?php endif; ?>
                                    <small class="text-muted">
                                        <i class="bi bi-calendar3 me-1"></i>
                                        <?= format_date($photo['date_prise'] ?? $photo['date_upload']) ?>
                                    </small>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php else: ?>
                    <div class="text-center text-muted py-5">
                        <i class="bi bi-camera fs-1 d-block mb-3"></i>
                        <p>Aucune photo pour ce projet</p>
                    </div>
                    <?php endif; ?>
                    <div class="mt-3">
                        <a href="upload-photos.php?id=<?= $projet['id'] ?>" class="btn btn-primary">
                            <i class="bi bi-cloud-upload me-2"></i>
                            Ajouter des photos
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Colonne latérale -->
        <div class="col-lg-4">
            <!-- Informations clés -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        Informations clés
                    </h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">
                            <i class="bi bi-calendar-event me-1"></i>
                            Date de début
                        </small>
                        <strong><?= format_date($projet['date_debut']) ?></strong>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">
                            <i class="bi bi-calendar-check me-1"></i>
                            Date de fin prévue
                        </small>
                        <strong><?= format_date($projet['date_fin_prevue']) ?></strong>
                    </div>
                    
                    <?php if ($jours_restants !== null): ?>
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">
                            <i class="bi bi-hourglass-split me-1"></i>
                            Jours restants
                        </small>
                        <strong class="<?= $jours_restants < 0 ? 'text-danger' : ($jours_restants < 30 ? 'text-warning' : 'text-success') ?>">
                            <?php if ($jours_restants < 0): ?>
                                En retard de <?= abs($jours_restants) ?> jours
                            <?php elseif ($jours_restants == 0): ?>
                                Aujourd'hui !
                            <?php else: ?>
                                <?= $jours_restants ?> jours
                            <?php endif; ?>
                        </strong>
                    </div>
                    <?php endif; ?>
                    
                    <hr>
                    
                    <div class="mb-3">
                        <small class="text-muted d-block mb-2">
                            <i class="bi bi-person me-1"></i>
                            Responsable
                        </small>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                 style="width: 40px; height: 40px;">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <strong class="d-block"><?= e($projet['responsable_nom']) ?></strong>
                                <small class="text-muted"><?= e($projet['responsable_email']) ?></small>
                            </div>
                        </div>
                    </div>
                    
                    <?php if ($projet['adresse']): ?>
                    <hr>
                    <div class="mb-0">
                        <small class="text-muted d-block mb-1">
                            <i class="bi bi-geo-alt me-1"></i>
                            Localisation
                        </small>
                        <p class="mb-0"><?= e($projet['adresse']) ?></p>
                        <?php if ($projet['latitude'] && $projet['longitude']): ?>
                        <small class="text-muted">
                            GPS: <?= e($projet['latitude']) ?>, <?= e($projet['longitude']) ?>
                        </small>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Actions rapides -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-lightning me-2"></i>
                        Actions rapides
                    </h5>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <a href="modifier.php?id=<?= $projet['id'] ?>" class="btn btn-outline-primary">
                            <i class="bi bi-pencil me-2"></i>
                            Modifier le projet
                        </a>
                        
                        <!-- BUG CORRIGÉ : modal au lieu de alert() -->
                        <button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalAvancement">
                            <i class="bi bi-graph-up me-2"></i>
                            Mettre à jour l'avancement
                        </button>
                        
                        <!-- BUG CORRIGÉ : vrai lien au lieu de alert() -->
                        <a href="<?= SITE_URL ?>/budget/depenses.php?projet_id=<?= $projet['id'] ?>" class="btn btn-outline-primary">
                            <i class="bi bi-cash me-2"></i>
                            Enregistrer une dépense
                        </a>
                        
                        <a href="upload-photos.php?id=<?= $projet['id'] ?>" class="btn btn-outline-primary">
                            <i class="bi bi-camera me-2"></i>
                            Ajouter des photos
                        </a>
                        
                        <div class="dropdown d-grid">
                            <button class="btn btn-outline-primary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown">
                                <i class="bi bi-file-earmark-pdf me-2"></i>
                                Générer un rapport
                            </button>
                            <ul class="dropdown-menu w-100">
                                <li>
                                    <a class="dropdown-item" href="generer-rapport.php?id=<?= $projet['id'] ?>&type=complet" target="_blank">
                                        <i class="bi bi-file-earmark-text me-2"></i>Rapport complet
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="generer-rapport.php?id=<?= $projet['id'] ?>&type=financier" target="_blank">
                                        <i class="bi bi-cash-stack me-2"></i>Rapport financier
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="generer-rapport.php?id=<?= $projet['id'] ?>&type=avancement" target="_blank">
                                        <i class="bi bi-graph-up me-2"></i>Rapport d'avancement
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <hr>
                        
                        <!-- BUG CORRIGÉ : onclick confirm retiré (page supprimer.php affiche déjà une confirmation) -->
                        <a href="supprimer.php?id=<?= $projet['id'] ?>" class="btn btn-outline-danger">
                            <i class="bi bi-trash me-2"></i>
                            Supprimer le projet
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================ -->
<!-- MODAL : Mettre à jour l'avancement (BUG CORRIGÉ)            -->
<!-- ============================================================ -->
<div class="modal fade" id="modalAvancement" tabindex="-1" aria-labelledby="modalAvancementLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalAvancementLabel">
                    <i class="bi bi-graph-up me-2"></i>
                    Mettre à jour l'avancement
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" action="details.php?id=<?= $projet_id ?>">
                <input type="hidden" name="action" value="update_avancement">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Pourcentage d'avancement *</label>
                        <div class="d-flex align-items-center gap-3">
                            <input type="range" class="form-range flex-grow-1" 
                                   name="pourcentage" id="rangeAvancement"
                                   min="0" max="100" step="5"
                                   value="<?= $projet['avancement_physique'] ?>"
                                   oninput="document.getElementById('valeurAvancement').textContent = this.value + '%'">
                            <span class="badge bg-primary fs-6" id="valeurAvancement">
                                <?= $projet['avancement_physique'] ?>%
                            </span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Date du constat *</label>
                        <input type="date" name="date_constat" class="form-control" 
                               value="<?= date('Y-m-d') ?>" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Description</label>
                        <input type="text" name="description" class="form-control" 
                               placeholder="Ex: Fondations terminées, dalle en cours...">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Observations</label>
                        <textarea name="observations" class="form-control" rows="3"
                                  placeholder="Difficultés rencontrées, remarques..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="bi bi-check-circle me-2"></i>
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
