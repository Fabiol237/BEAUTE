<?php
$page_title = 'Gestion Budgétaire';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// BUG CORRIGÉ : on ne compte que les dépenses VALIDÉES (validee = 1)
// pour être cohérent avec details.php, RapportPDF.php et la vue v_projets_details
$stats_budget = [
    'budget_total'   => $pdo->query("SELECT COALESCE(SUM(budget_actuel), 0) FROM projets")->fetchColumn(),
    'depenses_total' => $pdo->query("SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE validee = 1")->fetchColumn(),
    'nb_projets'     => $pdo->query("SELECT COUNT(*) FROM projets")->fetchColumn(),
    // Nombre de dépenses EN ATTENTE de validation
    'depenses_attente' => $pdo->query("SELECT COUNT(*) FROM depenses WHERE validee = 0")->fetchColumn(),
];

$stats_budget['restant']     = $stats_budget['budget_total'] - $stats_budget['depenses_total'];
$stats_budget['pourcentage'] = $stats_budget['budget_total'] > 0
    ? round(($stats_budget['depenses_total'] / $stats_budget['budget_total']) * 100, 1)
    : 0;

// BUG CORRIGÉ : on ne compte que les dépenses validées par projet (validee = 1)
$projets = $pdo->query("
    SELECT p.*,
           t.nom as type_nom,
           t.couleur,
           c.nom as commune_nom,
           COALESCE(SUM(CASE WHEN d.validee = 1 THEN d.montant ELSE 0 END), 0) as total_depenses,
           COUNT(CASE WHEN d.validee = 1 THEN 1 END) as nb_depenses,
           COUNT(CASE WHEN d.validee = 0 AND d.id IS NOT NULL THEN 1 END) as nb_attente
    FROM projets p
    LEFT JOIN types_projets t ON p.type_projet_id = t.id
    LEFT JOIN communes c ON p.commune_id = c.id
    LEFT JOIN depenses d ON d.projet_id = p.id
    GROUP BY p.id
    ORDER BY p.budget_actuel DESC
")->fetchAll();
?>

<div class="container-fluid mt-4">
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-wallet2 me-2"></i>Gestion Budgétaire</h1>
                <p class="text-muted mb-0">
                    Vue d'ensemble des budgets et dépenses validées
                    <span class="ms-2">
                        <i class="bi bi-calendar3 me-1"></i>
                        <?= date('d/m/Y') ?>
                    </span>
                </p>
            </div>
        </div>
    </div>

    <?= get_flash() ?>

    <?php if ($stats_budget['depenses_attente'] > 0): ?>
    <!-- Alerte dépenses en attente de validation -->
    <div class="alert alert-warning d-flex align-items-center mb-4">
        <i class="bi bi-exclamation-circle-fill me-2"></i>
        <div>
            <strong><?= $stats_budget['depenses_attente'] ?> dépense(s)</strong> en attente de validation.
            Ces montants ne sont <strong>pas inclus</strong> dans les totaux ci-dessous.
        </div>
    </div>
    <?php endif; ?>

    <!-- Cartes de statistiques -->
    <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Budget Total</p>
                            <h3 class="fw-bold mb-0 text-warning"><?= number_format($stats_budget['budget_total'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-warning">
                            <i class="bi bi-wallet2"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card danger">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Dépenses Validées</p>
                            <h3 class="fw-bold mb-0 text-danger"><?= number_format($stats_budget['depenses_total'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-danger">
                            <i class="bi bi-graph-down-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card success">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Restant</p>
                            <h3 class="fw-bold mb-0 text-success"><?= number_format($stats_budget['restant'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-success">
                            <i class="bi bi-piggy-bank"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Utilisation</p>
                            <h3 class="fw-bold mb-0 text-primary"><?= $stats_budget['pourcentage'] ?>%</h3>
                            <small class="text-muted">du budget</small>
                        </div>
                        <div class="stat-icon text-primary">
                            <i class="bi bi-percent"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Barre de progression globale -->
    <div class="card mb-4">
        <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
                <h6 class="mb-0">Consommation globale du budget</h6>
                <span class="fw-bold"><?= $stats_budget['pourcentage'] ?>%</span>
            </div>
            <div class="progress" style="height: 20px;">
                <div class="progress-bar <?= $stats_budget['pourcentage'] > 80 ? 'bg-danger' : ($stats_budget['pourcentage'] > 50 ? 'bg-warning' : 'bg-success') ?>"
                     style="width: <?= min($stats_budget['pourcentage'], 100) ?>%">
                    <?= $stats_budget['pourcentage'] ?>%
                </div>
            </div>
            <small class="text-muted mt-2 d-block">
                * Seules les dépenses validées sont comptabilisées.
                <?php if ($stats_budget['depenses_attente'] > 0): ?>
                <strong class="text-warning"><?= $stats_budget['depenses_attente'] ?> dépense(s) en attente de validation non incluse(s).</strong>
                <?php endif; ?>
            </small>
        </div>
    </div>

    <!-- Tableau des projets -->
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-folder-fill me-2"></i>
                        Budget par Projet
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Projet</th>
                                    <th>Commune</th>
                                    <th>Budget Alloué</th>
                                    <th>Dépensé (validé)</th>
                                    <th>Restant</th>
                                    <th>Avancement</th>
                                    <th>Utilisation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($projets as $projet): ?>
                                <?php
                                    $restant    = $projet['budget_actuel'] - $projet['total_depenses'];
                                    $pourcentage = $projet['budget_actuel'] > 0
                                        ? round(($projet['total_depenses'] / $projet['budget_actuel']) * 100, 1)
                                        : 0;

                                    $progress_class = 'success';
                                    if ($pourcentage > 80)     $progress_class = 'danger';
                                    elseif ($pourcentage > 50) $progress_class = 'warning';
                                ?>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="rounded-circle p-2 me-2" style="background-color: <?= e($projet['couleur']) ?>20">
                                                <i class="bi bi-folder" style="color: <?= e($projet['couleur']) ?>"></i>
                                            </div>
                                            <div>
                                                <div class="fw-bold"><?= e($projet['titre']) ?></div>
                                                <small class="text-muted"><?= e($projet['type_nom']) ?></small>
                                            </div>
                                        </div>
                                    </td>
                                    <td><?= e($projet['commune_nom']) ?></td>
                                    <td class="text-nowrap">
                                        <strong><?= format_montant($projet['budget_actuel']) ?></strong>
                                    </td>
                                    <td class="text-nowrap">
                                        <?= format_montant($projet['total_depenses']) ?>
                                        <br>
                                        <small class="text-muted"><?= $projet['nb_depenses'] ?> validée(s)</small>
                                        <?php if ($projet['nb_attente'] > 0): ?>
                                        <br>
                                        <small class="text-warning">
                                            <i class="bi bi-clock me-1"></i><?= $projet['nb_attente'] ?> en attente
                                        </small>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-nowrap">
                                        <strong class="<?= $restant < 0 ? 'text-danger' : 'text-success' ?>">
                                            <?= format_montant($restant) ?>
                                        </strong>
                                        <?php if ($restant < 0): ?>
                                        <br><small class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Dépassement !</small>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="progress flex-grow-1 me-2" style="height: 6px; width: 80px;">
                                                <div class="progress-bar <?= get_progress_class($projet['avancement_physique']) ?>"
                                                     style="width: <?= $projet['avancement_physique'] ?>%"></div>
                                            </div>
                                            <small class="text-muted"><?= $projet['avancement_physique'] ?>%</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge bg-<?= $progress_class ?>">
                                            <?= $pourcentage ?>%
                                        </span>
                                    </td>
                                    <td>
                                        <a href="<?= SITE_URL ?>/budget/depenses.php?projet_id=<?= $projet['id'] ?>"
                                           class="btn btn-sm btn-outline-primary">
                                            <i class="bi bi-eye"></i>
                                            Détails
                                        </a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>

                                <?php if (empty($projets)): ?>
                                <tr>
                                    <td colspan="8" class="text-center text-muted py-4">
                                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                        Aucun projet pour le moment
                                    </td>
                                </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
