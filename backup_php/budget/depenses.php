<?php
$page_title = 'Gestion des Dépenses';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

$projet_id = $_GET['projet_id'] ?? 0;

// Récupérer le projet
$stmt = $pdo->prepare("
    SELECT p.*, t.nom as type_nom, c.nom as commune_nom, t.couleur
    FROM projets p
    LEFT JOIN types_projets t ON p.type_projet_id = t.id
    LEFT JOIN communes c ON p.commune_id = c.id
    WHERE p.id = ?
");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

// BUG CORRIGÉ #3 : Redirection correcte si projet introuvable
if (!$projet) {
    set_flash('danger', 'Projet introuvable.');
    header('Location: ' . SITE_URL . '/projets/liste.php');
    exit;
}

// Traitement ajout dépense
$success = false;
$erreurs = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'ajouter') {
    $libelle     = trim($_POST['libelle'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $montant     = str_replace([' ', ','], ['', '.'], $_POST['montant'] ?? '0');
    $date_depense   = $_POST['date_depense'] ?? date('Y-m-d');
    $numero_facture = trim($_POST['numero_facture'] ?? '');
    $fournisseur    = trim($_POST['fournisseur'] ?? '');
    $saisi_par      = $_SESSION['utilisateur_id']; // BUG CORRIGÉ #2 : champ NOT NULL manquant

    // BUG CORRIGÉ #2 : libelle est NOT NULL dans la BDD
    if (empty($libelle))    $erreurs[] = "Le libellé est requis";
    if ($montant <= 0)      $erreurs[] = "Le montant doit être supérieur à 0";
    if (empty($date_depense)) $erreurs[] = "La date est requise";

    if (empty($erreurs)) {
        try {
            // BUG CORRIGÉ #2 : INSERT inclut maintenant libelle et saisi_par (NOT NULL)
            $sql = "INSERT INTO depenses 
                        (projet_id, libelle, description, montant, date_depense, numero_facture, fournisseur, saisi_par, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $projet_id,
                $libelle,
                $description ?: null,
                $montant,
                $date_depense,
                $numero_facture ?: null,
                $fournisseur ?: null,
                $saisi_par
            ]);

            set_flash('success', 'Dépense ajoutée avec succès !');
            header('Location: depenses.php?projet_id=' . $projet_id);
            exit;
        } catch (Exception $e) {
            $erreurs[] = "Erreur : " . $e->getMessage();
        }
    }
}

// Récupérer les dépenses
$depenses = $pdo->prepare("
    SELECT * FROM depenses 
    WHERE projet_id = ? 
    ORDER BY date_depense DESC
");
$depenses->execute([$projet_id]);
$depenses_list = $depenses->fetchAll();

// Calculer les totaux
$total_depenses   = array_sum(array_column($depenses_list, 'montant'));
$budget_restant   = $projet['budget_actuel'] - $total_depenses;
$pourcentage_utilise = $projet['budget_actuel'] > 0 
    ? round(($total_depenses / $projet['budget_actuel']) * 100, 1) 
    : 0;

$bar_class = 'bg-success';
if ($pourcentage_utilise > 80)      $bar_class = 'bg-danger';
elseif ($pourcentage_utilise > 50)  $bar_class = 'bg-warning';
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>
    
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-receipt me-2"></i>Gestion des Dépenses</h1>
                <p class="text-muted mb-0">
                    <strong><?= e($projet['titre']) ?></strong> - <?= e($projet['commune_nom']) ?>
                </p>
            </div>
            <a href="<?= SITE_URL ?>/projets/liste.php" class="btn btn-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Retour
            </a>
        </div>
    </div>
    
    <?php if (!empty($erreurs)): ?>
    <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Erreurs :</strong>
        <ul class="mb-0 mt-2">
            <?php foreach ($erreurs as $erreur): ?>
            <li><?= e($erreur) ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>
    
    <!-- Cartes de statistiques -->
    <div class="row mb-4">
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card stat-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Budget Alloué</p>
                            <h3 class="fw-bold mb-0 text-primary"><?= number_format($projet['budget_actuel'] / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-primary">
                            <i class="bi bi-wallet2"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card stat-card danger">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Total Dépensé</p>
                            <h3 class="fw-bold mb-0 text-danger"><?= number_format($total_depenses / 1000000, 1) ?>M</h3>
                            <small class="text-muted"><?= $pourcentage_utilise ?>% du budget</small>
                        </div>
                        <div class="stat-icon text-danger">
                            <i class="bi bi-graph-down-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-xl-4 col-md-6 mb-4">
            <div class="card stat-card warning">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Budget Restant</p>
                            <h3 class="fw-bold mb-0 text-warning"><?= number_format($budget_restant / 1000000, 1) ?>M</h3>
                            <small class="text-muted">FCFA</small>
                        </div>
                        <div class="stat-icon text-warning">
                            <i class="bi bi-piggy-bank"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Barre de progression -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h5 class="mb-3">Utilisation du Budget</h5>
                    <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-3" style="height: 30px;">
                            <div class="progress-bar <?= $bar_class ?>" style="width: <?= min($pourcentage_utilise, 100) ?>%">
                                <strong><?= $pourcentage_utilise ?>%</strong>
                            </div>
                        </div>
                        <strong><?= $pourcentage_utilise ?>%</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row">
        <!-- Formulaire ajout dépense -->
        <div class="col-lg-5 mb-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-plus-circle me-2"></i>
                        Ajouter une Dépense
                    </h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="action" value="ajouter">
                        
                        <!-- AJOUTÉ : champ Libellé (obligatoire dans la BDD) -->
                        <div class="mb-3">
                            <label class="form-label">Libellé *</label>
                            <input type="text" name="libelle" class="form-control" 
                                   placeholder="Ex: Achat de matériaux" 
                                   value="<?= e($_POST['libelle'] ?? '') ?>"
                                   required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Description (optionnel)</label>
                            <input type="text" name="description" class="form-control" 
                                   placeholder="Détails supplémentaires"
                                   value="<?= e($_POST['description'] ?? '') ?>">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Montant (FCFA) *</label>
                            <input type="text" name="montant" class="form-control" 
                                   placeholder="Ex: 5000000" 
                                   value="<?= e($_POST['montant'] ?? '') ?>"
                                   required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Date de la Dépense *</label>
                            <input type="date" name="date_depense" class="form-control" 
                                   value="<?= e($_POST['date_depense'] ?? date('Y-m-d')) ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Numéro de Facture</label>
                            <input type="text" name="numero_facture" class="form-control" 
                                   placeholder="Ex: FACT-2026-001"
                                   value="<?= e($_POST['numero_facture'] ?? '') ?>">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Fournisseur</label>
                            <input type="text" name="fournisseur" class="form-control" 
                                   placeholder="Nom du fournisseur"
                                   value="<?= e($_POST['fournisseur'] ?? '') ?>">
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-plus-circle me-2"></i>
                            Ajouter la Dépense
                        </button>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Liste des dépenses -->
        <div class="col-lg-7 mb-4">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Liste des Dépenses (<?= count($depenses_list) ?>)
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Libellé</th>
                                    <th>Montant</th>
                                    <th>Facture</th>
                                    <th>Fournisseur</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($depenses_list) > 0): ?>
                                    <?php foreach ($depenses_list as $depense): ?>
                                    <tr>
                                        <td class="text-nowrap"><?= format_date($depense['date_depense']) ?></td>
                                        <td>
                                            <strong><?= e($depense['libelle']) ?></strong>
                                            <?php if (!empty($depense['description'])): ?>
                                            <br><small class="text-muted"><?= e($depense['description']) ?></small>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-nowrap">
                                            <strong><?= format_montant($depense['montant']) ?></strong>
                                        </td>
                                        <td>
                                            <?php if (!empty($depense['numero_facture'])): ?>
                                            <span class="badge bg-success">
                                                <?= e($depense['numero_facture']) ?>
                                            </span>
                                            <?php else: ?>
                                            <span class="text-muted">-</span>
                                            <?php endif; ?>
                                        </td>
                                        <td><?= e($depense['fournisseur'] ?: '-') ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                    
                                    <!-- Total -->
                                    <tr class="table-active fw-bold">
                                        <td colspan="2" class="text-end">TOTAL :</td>
                                        <td class="text-nowrap">
                                            <strong class="text-danger">
                                                <?= format_montant($total_depenses) ?>
                                            </strong>
                                        </td>
                                        <td colspan="2"></td>
                                    </tr>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="5" class="text-center text-muted py-5">
                                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                            Aucune dépense enregistrée pour ce projet
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
