<?php
$page_title = 'Dashboard';
require_once 'includes/header.php';
require_connexion();
require_once 'includes/navbar.php';

// Statistiques générales
$stats = [];
$stats['total_projets']    = $pdo->query("SELECT COUNT(*) FROM projets")->fetchColumn();
$stats['projets_en_cours'] = $pdo->query("SELECT COUNT(*) FROM projets WHERE statut = 'en_cours'")->fetchColumn();
$stats['projets_termines'] = $pdo->query("SELECT COUNT(*) FROM projets WHERE statut = 'terminé'")->fetchColumn();
$stats['projets_retard']   = $pdo->query("SELECT COUNT(*) FROM projets WHERE statut = 'en_cours' AND date_fin_prevue < CURDATE()")->fetchColumn();
$stats['budget_total']     = $pdo->query("SELECT COALESCE(SUM(budget_actuel), 0) FROM projets")->fetchColumn();

// BUG CORRIGÉ : dépenses filtrées sur validee = 1
// Avant : SELECT SUM(montant) FROM depenses  → comptait TOUTES les dépenses même non validées
// Résultat : chiffres incohérents avec budget/liste.php et details.php qui filtrent eux sur validee=1
$stats['depenses_total']   = $pdo->query("SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE validee = 1")->fetchColumn();
$stats['depenses_attente'] = $pdo->query("SELECT COUNT(*) FROM depenses WHERE validee = 0")->fetchColumn();

$stats['budget_restant']    = $stats['budget_total'] - $stats['depenses_total'];
$stats['taux_consommation'] = $stats['budget_total'] > 0
    ? round(($stats['depenses_total'] / $stats['budget_total']) * 100, 1)
    : 0;

// Derniers projets
$derniers_projets = $pdo->query("
    SELECT p.*, c.nom as commune_nom, tp.nom as type_nom, tp.couleur
    FROM projets p
    JOIN communes c ON p.commune_id = c.id
    JOIN types_projets tp ON p.type_projet_id = tp.id
    ORDER BY p.created_at DESC
    LIMIT 5
")->fetchAll();

// Projets en retard
$projets_retard = $pdo->query("
    SELECT p.*, c.nom as commune_nom
    FROM projets p
    JOIN communes c ON p.commune_id = c.id
    WHERE p.statut = 'en_cours' AND p.date_fin_prevue < CURDATE()
    ORDER BY p.date_fin_prevue
    LIMIT 5
")->fetchAll();

// Données pour les graphiques
$budget_communes = $pdo->query("
    SELECT c.nom as commune, COALESCE(SUM(p.budget_actuel), 0) as budget_total
    FROM communes c LEFT JOIN projets p ON c.id = p.commune_id
    GROUP BY c.id, c.nom ORDER BY budget_total DESC
")->fetchAll();

$projets_statut = $pdo->query("
    SELECT CASE
        WHEN statut = 'planifié'  THEN 'Planifié'
        WHEN statut = 'en_cours'  THEN 'En cours'
        WHEN statut = 'terminé'   THEN 'Terminé'
        WHEN statut = 'suspendu'  THEN 'Suspendu'
        WHEN statut = 'annulé'    THEN 'Annulé'
        ELSE statut END as statut_label, COUNT(*) as nombre
    FROM projets GROUP BY statut
")->fetchAll();

$budget_types = $pdo->query("
    SELECT t.nom as type, COALESCE(SUM(p.budget_actuel), 0) as budget_total, t.couleur
    FROM types_projets t LEFT JOIN projets p ON t.id = p.type_projet_id
    GROUP BY t.id, t.nom, t.couleur ORDER BY budget_total DESC LIMIT 5
")->fetchAll();

$evolution_projets = $pdo->query("
    SELECT DATE_FORMAT(created_at, '%Y-%m') as mois, COUNT(*) as nombre
    FROM projets WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY mois ASC
")->fetchAll();
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>

    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-speedometer2 me-2"></i>Dashboard</h1>
                <p class="text-muted mb-0">
                    Bienvenue, <strong><?= e($_SESSION['utilisateur_prenom']) ?></strong> !
                    <span class="ms-2"><i class="bi bi-calendar3 me-1"></i><?= date('d/m/Y') ?></span>
                </p>
            </div>
            <a href="<?= SITE_URL ?>/projets/creer.php" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Nouveau projet
            </a>
        </div>
    </div>

    <?php if ($stats['depenses_attente'] > 0): ?>
    <div class="alert alert-warning d-flex align-items-center mb-4">
        <i class="bi bi-exclamation-circle-fill me-2"></i>
        <div>
            <strong><?= $stats['depenses_attente'] ?> dépense(s)</strong> en attente de validation —
            non incluses dans les totaux ci-dessous.
            <a href="<?= SITE_URL ?>/budget/liste.php" class="alert-link ms-2">Voir →</a>
        </div>
    </div>
    <?php endif; ?>

    <!-- Ligne 1 : stats projets -->
    <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Total Projets</p>
                            <h3 class="fw-bold mb-0"><?= $stats['total_projets'] ?></h3>
                        </div>
                        <div class="stat-icon text-primary"><i class="bi bi-folder"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card success">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">En cours</p>
                            <h3 class="fw-bold mb-0 text-primary"><?= $stats['projets_en_cours'] ?></h3>
                            <?php if ($stats['projets_retard'] > 0): ?>
                            <small class="text-danger"><i class="bi bi-exclamation-circle me-1"></i><?= $stats['projets_retard'] ?> en retard</small>
                            <?php endif; ?>
                        </div>
                        <div class="stat-icon text-primary"><i class="bi bi-clock-history"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card warning">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Budget Total</p>
                            <h3 class="fw-bold mb-0 text-warning"><?= number_format($stats['budget_total'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-warning"><i class="bi bi-cash-stack"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card success">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Terminés</p>
                            <h3 class="fw-bold mb-0 text-success"><?= $stats['projets_termines'] ?></h3>
                        </div>
                        <div class="stat-icon text-success"><i class="bi bi-check-circle"></i></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Ligne 2 : stats financières -->
    <div class="row mb-4">
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Dépenses Validées</p>
                            <h3 class="fw-bold mb-0 text-danger"><?= number_format($stats['depenses_total'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-danger"><i class="bi bi-graph-down-arrow"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Budget Restant</p>
                            <h3 class="fw-bold mb-0 <?= $stats['budget_restant'] < 0 ? 'text-danger' : 'text-success' ?>">
                                <?= number_format($stats['budget_restant'] / 1000000, 1) ?>M
                            </h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-success"><i class="bi bi-piggy-bank"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Consommation</p>
                            <h3 class="fw-bold mb-0 text-primary"><?= $stats['taux_consommation'] ?>%</h3>
                            <div class="progress mt-1" style="height:6px; width:80px;">
                                <div class="progress-bar <?= $stats['taux_consommation'] > 80 ? 'bg-danger' : ($stats['taux_consommation'] > 50 ? 'bg-warning' : 'bg-success') ?>"
                                     style="width:<?= min($stats['taux_consommation'],100) ?>%"></div>
                            </div>
                        </div>
                        <div class="stat-icon text-primary"><i class="bi bi-percent"></i></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Graphiques -->
    <div class="row mb-4">
        <div class="col-lg-6 mb-4">
            <div class="card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-bar-chart-fill me-2"></i>Budget par Commune</h5></div>
                <div class="card-body"><canvas id="budgetCommuneChart" height="300"></canvas></div>
            </div>
        </div>
        <div class="col-lg-6 mb-4">
            <div class="card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>Répartition par Statut</h5></div>
                <div class="card-body"><canvas id="projetStatutChart" height="300"></canvas></div>
            </div>
        </div>
    </div>
    <div class="row mb-4">
        <div class="col-lg-6 mb-4">
            <div class="card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Budget par Type</h5></div>
                <div class="card-body"><canvas id="budgetTypeChart" height="300"></canvas></div>
            </div>
        </div>
        <div class="col-lg-6 mb-4">
            <div class="card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-graph-up-arrow me-2"></i>Évolution Mensuelle</h5></div>
                <div class="card-body"><canvas id="evolutionChart" height="300"></canvas></div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12 mb-3">
            <a href="<?= SITE_URL ?>/carte.php" class="btn btn-success">
                <i class="bi bi-map me-2"></i>Voir la carte
            </a>
        </div>

        <div class="col-lg-8 mb-4">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-folder-fill me-2"></i>Derniers projets</h5>
                    <a href="<?= SITE_URL ?>/projets/liste.php" class="btn btn-sm btn-outline-primary">Voir tout <i class="bi bi-arrow-right ms-1"></i></a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead><tr><th>Projet</th><th>Commune</th><th>Budget</th><th>Avancement</th><th>Statut</th><th></th></tr></thead>
                            <tbody>
                                <?php foreach ($derniers_projets as $projet): ?>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="rounded-circle p-2 me-2" style="background-color:<?= e($projet['couleur']) ?>20">
                                                <i class="bi bi-folder" style="color:<?= e($projet['couleur']) ?>"></i>
                                            </div>
                                            <div>
                                                <div class="fw-bold"><?= e($projet['titre']) ?></div>
                                                <small class="text-muted"><?= e($projet['type_nom']) ?></small>
                                            </div>
                                        </div>
                                    </td>
                                    <td><?= e($projet['commune_nom']) ?></td>
                                    <td class="text-nowrap"><?= format_montant($projet['budget_actuel']) ?></td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="progress flex-grow-1 me-2" style="height:6px;width:80px;">
                                                <div class="progress-bar <?= get_progress_class($projet['avancement_physique']) ?>" style="width:<?= $projet['avancement_physique'] ?>%"></div>
                                            </div>
                                            <small class="text-muted"><?= $projet['avancement_physique'] ?>%</small>
                                        </div>
                                    </td>
                                    <td><?= get_statut_badge($projet['statut']) ?></td>
                                    <td><a href="<?= SITE_URL ?>/projets/details.php?id=<?= $projet['id'] ?>" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a></td>
                                </tr>
                                <?php endforeach; ?>
                                <?php if (empty($derniers_projets)): ?>
                                <tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox fs-1 d-block mb-2"></i>Aucun projet</td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4 mb-4">
            <div class="card border-warning">
                <div class="card-header bg-warning text-white">
                    <h5 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Alertes (<?= count($projets_retard) ?>)</h5>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush">
                        <?php foreach ($projets_retard as $projet): ?>
                        <a href="<?= SITE_URL ?>/projets/details.php?id=<?= $projet['id'] ?>" class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1"><?= e($projet['titre']) ?></h6>
                                    <small class="text-muted"><i class="bi bi-geo-alt"></i> <?= e($projet['commune_nom']) ?></small>
                                </div>
                                <span class="badge bg-danger"><?= abs(jours_restants($projet['date_fin_prevue'])) ?> j</span>
                            </div>
                        </a>
                        <?php endforeach; ?>
                        <?php if (empty($projets_retard)): ?>
                        <div class="list-group-item text-center text-muted py-4">
                            <i class="bi bi-check-circle fs-1 text-success d-block mb-2"></i>Aucun projet en retard !
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
const colors = { primary:'#2563eb', success:'#10b981', warning:'#f59e0b', danger:'#ef4444', info:'#3b82f6' };
new Chart(document.getElementById('budgetCommuneChart'), { type:'bar', data:{ labels:<?= json_encode(array_column($budget_communes,'commune')) ?>, datasets:[{ label:'Budget (M FCFA)', data:<?= json_encode(array_map(fn($i)=>round($i['budget_total']/1000000,1),$budget_communes)) ?>, backgroundColor:colors.primary, borderRadius:8, borderSkipped:false }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'M'}}} } });
new Chart(document.getElementById('projetStatutChart'), { type:'doughnut', data:{ labels:<?= json_encode(array_column($projets_statut,'statut_label')) ?>, datasets:[{ data:<?= json_encode(array_column($projets_statut,'nombre')) ?>, backgroundColor:[colors.info,colors.primary,colors.success,colors.warning,colors.danger], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} } });
new Chart(document.getElementById('budgetTypeChart'), { type:'bar', data:{ labels:<?= json_encode(array_column($budget_types,'type')) ?>, datasets:[{ label:'Budget (M FCFA)', data:<?= json_encode(array_map(fn($i)=>round($i['budget_total']/1000000,1),$budget_types)) ?>, backgroundColor:<?= json_encode(array_column($budget_types,'couleur')) ?>, borderRadius:8, borderSkipped:false }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true,ticks:{callback:v=>v+'M'}}} } });
new Chart(document.getElementById('evolutionChart'), { type:'line', data:{ labels:<?= json_encode(array_column($evolution_projets,'mois')) ?>, datasets:[{ label:'Nouveaux projets', data:<?= json_encode(array_column($evolution_projets,'nombre')) ?>, borderColor:colors.primary, backgroundColor:colors.primary+'20', fill:true, tension:0.4, pointBackgroundColor:colors.primary, pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:4, pointHoverRadius:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}} } });
</script>

<?php require_once 'includes/footer.php'; ?>
