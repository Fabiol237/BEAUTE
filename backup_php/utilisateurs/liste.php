<?php
$page_title = 'Gestion des Utilisateurs';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// Vérifier que l'utilisateur est admin
$role = $_SESSION['utilisateur_role'] ?? null;

// BUG CORRIGÉ #5 : set_flash($type, $message) — type en premier, message en second
if ($role !== 'admin') {
    set_flash('danger', 'Accès refusé. Cette page est réservée aux administrateurs.');
    header('Location: ' . SITE_URL . '/dashboard.php');
    exit;
}

// Récupérer tous les utilisateurs
$utilisateurs = $pdo->query("
    SELECT * FROM utilisateurs 
    ORDER BY created_at DESC
")->fetchAll();

// Statistiques
$stats = [
    'total'    => count($utilisateurs),
    'actifs'   => 0,
    'admins'   => 0,
    'inactifs' => 0,
];

foreach ($utilisateurs as $u) {
    $actif_val = $u['actif'] ?? 0;
    $role_val  = $u['role']  ?? '';

    if ($actif_val == 1) {
        $stats['actifs']++;
    } else {
        $stats['inactifs']++;
    }

    if ($role_val === 'admin') {
        $stats['admins']++;
    }
}
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>
    
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-people-fill me-2"></i>Gestion des Utilisateurs</h1>
                <p class="text-muted mb-0">
                    Gérez les accès et permissions des utilisateurs
                </p>
            </div>
            <a href="<?= SITE_URL ?>/utilisateurs/ajouter.php" class="btn btn-primary">
                <i class="bi bi-person-plus-fill me-2"></i>
                Nouvel utilisateur
            </a>
        </div>
    </div>
    
    <!-- Cartes de statistiques -->
    <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Total Utilisateurs</p>
                            <h3 class="fw-bold mb-0"><?= $stats['total'] ?></h3>
                        </div>
                        <div class="stat-icon text-primary">
                            <i class="bi bi-people"></i>
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
                            <p class="text-muted mb-1 text-uppercase small">Actifs</p>
                            <h3 class="fw-bold mb-0 text-success"><?= $stats['actifs'] ?></h3>
                        </div>
                        <div class="stat-icon text-success">
                            <i class="bi bi-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stat-card warning">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="text-muted mb-1 text-uppercase small">Administrateurs</p>
                            <h3 class="fw-bold mb-0 text-warning"><?= $stats['admins'] ?></h3>
                        </div>
                        <div class="stat-icon text-warning">
                            <i class="bi bi-shield-fill-check"></i>
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
                            <p class="text-muted mb-1 text-uppercase small">Inactifs</p>
                            <h3 class="fw-bold mb-0 text-danger"><?= $stats['inactifs'] ?></h3>
                        </div>
                        <div class="stat-icon text-danger">
                            <i class="bi bi-x-circle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Tableau des utilisateurs -->
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Liste des Utilisateurs
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th>Dernière connexion</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($utilisateurs as $user): ?>
                                <?php
                                $user_actif = $user['actif'] ?? 0;
                                $user_role  = $user['role']  ?? 'lecteur';
                                ?>
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                                                 style="width: 40px; height: 40px; font-weight: 600;">
                                                <?= strtoupper(substr($user['prenom'], 0, 1) . substr($user['nom'], 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div class="fw-bold"><?= e($user['prenom'] . ' ' . $user['nom']) ?></div>
                                                <small class="text-muted">ID: <?= $user['id'] ?></small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <i class="bi bi-envelope me-1 text-muted"></i>
                                        <?= e($user['email']) ?>
                                    </td>
                                    <td>
                                        <?php
                                        $role_badges = [
                                            'admin'        => '<span class="badge bg-danger"><i class="bi bi-shield-fill-check me-1"></i>Administrateur</span>',
                                            'gestionnaire' => '<span class="badge bg-primary"><i class="bi bi-person-badge me-1"></i>Gestionnaire</span>',
                                            'lecteur'      => '<span class="badge bg-secondary"><i class="bi bi-eye me-1"></i>Lecteur</span>',
                                        ];
                                        echo $role_badges[$user_role] ?? '<span class="badge bg-secondary">' . e($user_role) . '</span>';
                                        ?>
                                    </td>
                                    <td>
                                        <?php if ($user_actif == 1): ?>
                                        <span class="badge bg-success">
                                            <i class="bi bi-check-circle me-1"></i>Actif
                                        </span>
                                        <?php else: ?>
                                        <span class="badge bg-danger">
                                            <i class="bi bi-x-circle me-1"></i>Inactif
                                        </span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-nowrap">
                                        <?php if (!empty($user['derniere_connexion'])): ?>
                                        <small class="text-muted">
                                            <i class="bi bi-clock me-1"></i>
                                            <?= format_date($user['derniere_connexion']) ?>
                                        </small>
                                        <?php else: ?>
                                        <small class="text-muted">Jamais connecté</small>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-nowrap">
                                        <small class="text-muted"><?= format_date($user['created_at']) ?></small>
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <a href="<?= SITE_URL ?>/utilisateurs/modifier.php?id=<?= $user['id'] ?>" 
                                               class="btn btn-sm btn-outline-primary"
                                               title="Modifier">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                            
                                            <?php if ($user['id'] != $_SESSION['utilisateur_id']): ?>
                                            <button type="button" 
                                                    class="btn btn-sm btn-outline-danger"
                                                    onclick="confirmerSuppression(<?= $user['id'] ?>, '<?= e($user['prenom'] . ' ' . $user['nom']) ?>')"
                                                    title="Supprimer">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                                
                                <?php if (empty($utilisateurs)): ?>
                                <tr>
                                    <td colspan="7" class="text-center text-muted py-4">
                                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                        Aucun utilisateur
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

<!-- Modal de confirmation suppression -->
<div class="modal fade" id="modalSuppression" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Confirmer la suppression
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong id="nomUtilisateur"></strong> ?</p>
                <p class="text-danger mb-0">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Cette action est irréversible !
                </p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <form id="formSuppression" method="POST" action="supprimer.php" style="display: inline;">
                    <input type="hidden" name="id" id="idUtilisateur">
                    <button type="submit" class="btn btn-danger">
                        <i class="bi bi-trash me-2"></i>
                        Supprimer définitivement
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
function confirmerSuppression(id, nom) {
    document.getElementById('idUtilisateur').value = id;
    document.getElementById('nomUtilisateur').textContent = nom;
    new bootstrap.Modal(document.getElementById('modalSuppression')).show();
}
</script>

<?php require_once '../includes/footer.php'; ?>
