<?php
$page_title = 'Modifier un Utilisateur';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// Vérifier que l'utilisateur est admin
$session_role = $_SESSION['utilisateur_role'] ?? null;

// BUG CORRIGÉ #5 : set_flash($type, $message)
if ($session_role !== 'admin') {
    set_flash('danger', 'Accès refusé. Cette page est réservée aux administrateurs.');
    header('Location: ' . SITE_URL . '/dashboard.php');
    exit;
}

$user_id = $_GET['id'] ?? 0;

// Récupérer l'utilisateur
$stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    set_flash('danger', 'Utilisateur introuvable');
    header('Location: liste.php');
    exit;
}

$erreurs = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email         = trim($_POST['email'] ?? '');
    $nom           = trim($_POST['nom'] ?? '');
    $prenom        = trim($_POST['prenom'] ?? '');
    $role          = $_POST['role'] ?? 'lecteur';
    $actif         = isset($_POST['actif']) ? 1 : 0;
    $nouveau_mdp   = $_POST['nouveau_mdp'] ?? '';
    $confirmer_mdp = $_POST['confirmer_mdp'] ?? '';

    // Validation
    if (empty($email))  $erreurs[] = "L'email est requis";
    if (empty($nom))    $erreurs[] = "Le nom est requis";
    if (empty($prenom)) $erreurs[] = "Le prénom est requis";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreurs[] = "L'email n'est pas valide";
    }

    // Vérifier si l'email existe déjà (sauf pour cet utilisateur)
    if (empty($erreurs)) {
        $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ? AND id != ?");
        $stmt->execute([$email, $user_id]);
        if ($stmt->fetch()) {
            $erreurs[] = "Cet email est déjà utilisé par un autre utilisateur";
        }
    }

    // Validation mot de passe si fourni
    if (!empty($nouveau_mdp)) {
        if (strlen($nouveau_mdp) < 6) {
            $erreurs[] = "Le mot de passe doit contenir au moins 6 caractères";
        }
        if ($nouveau_mdp !== $confirmer_mdp) {
            $erreurs[] = "Les mots de passe ne correspondent pas";
        }
    }

    // Mettre à jour l'utilisateur
    if (empty($erreurs)) {
        try {
            // BUG CORRIGÉ : role_id doit aussi être mis à jour
            $role_map = ['admin' => 1, 'gestionnaire' => 3, 'lecteur' => 5];
            $role_id  = $role_map[$role] ?? 5;

            if (!empty($nouveau_mdp)) {
                $mot_de_passe_hash = password_hash($nouveau_mdp, PASSWORD_DEFAULT);
                $sql = "UPDATE utilisateurs 
                        SET email = ?, nom = ?, prenom = ?, role = ?, role_id = ?, actif = ?, password_hash = ?
                        WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$email, $nom, $prenom, $role, $role_id, $actif, $mot_de_passe_hash, $user_id]);
            } else {
                $sql = "UPDATE utilisateurs 
                        SET email = ?, nom = ?, prenom = ?, role = ?, role_id = ?, actif = ?
                        WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$email, $nom, $prenom, $role, $role_id, $actif, $user_id]);
            }

            set_flash('success', 'Utilisateur modifié avec succès !');
            header('Location: liste.php');
            exit;
        } catch (Exception $e) {
            $erreurs[] = "Erreur lors de la modification : " . $e->getMessage();
        }
    }

    // Mettre à jour les données affichées
    $user['email']  = $email;
    $user['nom']    = $nom;
    $user['prenom'] = $prenom;
    $user['role']   = $role;
    $user['actif']  = $actif;
}
?>

<div class="container-fluid mt-4">
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-pencil-square me-2"></i>Modifier un Utilisateur</h1>
                <p class="text-muted mb-0">
                    Modification de <strong><?= e($user['prenom'] . ' ' . $user['nom']) ?></strong>
                </p>
            </div>
            <a href="<?= SITE_URL ?>/utilisateurs/liste.php" class="btn btn-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Retour à la liste
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
    
    <div class="row">
        <div class="col-lg-8 mx-auto">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-person-badge me-2"></i>
                        Informations de l'utilisateur
                    </h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <div class="row">
                            <!-- Email -->
                            <div class="col-md-12 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-envelope me-1"></i>
                                    Email *
                                </label>
                                <input type="email" 
                                       name="email" 
                                       class="form-control" 
                                       value="<?= e($user['email']) ?>"
                                       required>
                            </div>
                            
                            <!-- Nom -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-person me-1"></i>
                                    Nom *
                                </label>
                                <input type="text" 
                                       name="nom" 
                                       class="form-control" 
                                       value="<?= e($user['nom']) ?>"
                                       required>
                            </div>
                            
                            <!-- Prénom -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-person me-1"></i>
                                    Prénom *
                                </label>
                                <input type="text" 
                                       name="prenom" 
                                       class="form-control" 
                                       value="<?= e($user['prenom']) ?>"
                                       required>
                            </div>
                            
                            <!-- Rôle -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-shield-check me-1"></i>
                                    Rôle *
                                </label>
                                <select name="role" class="form-select" required>
                                    <option value="lecteur" <?= $user['role'] === 'lecteur' ? 'selected' : '' ?>>
                                        Lecteur (Consultation uniquement)
                                    </option>
                                    <option value="gestionnaire" <?= $user['role'] === 'gestionnaire' ? 'selected' : '' ?>>
                                        Gestionnaire (Gestion des projets)
                                    </option>
                                    <option value="admin" <?= $user['role'] === 'admin' ? 'selected' : '' ?>>
                                        Administrateur (Accès complet)
                                    </option>
                                </select>
                            </div>
                            
                            <!-- Statut -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-toggle-on me-1"></i>
                                    Statut
                                </label>
                                <div class="form-check form-switch mt-2">
                                    <input type="checkbox" 
                                           name="actif" 
                                           class="form-check-input" 
                                           id="actif"
                                           <?= $user['actif'] ? 'checked' : '' ?>>
                                    <label class="form-check-label" for="actif">
                                        Compte actif
                                    </label>
                                </div>
                                <small class="text-muted">Un compte inactif ne peut pas se connecter</small>
                            </div>
                            
                            <div class="col-12">
                                <hr>
                                <h6 class="mb-3">
                                    <i class="bi bi-key me-2"></i>
                                    Changer le mot de passe (optionnel)
                                </h6>
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Laissez vide pour conserver le mot de passe actuel
                                </div>
                            </div>
                            
                            <!-- Nouveau mot de passe -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock me-1"></i>
                                    Nouveau mot de passe
                                </label>
                                <input type="password" 
                                       name="nouveau_mdp" 
                                       class="form-control"
                                       minlength="6">
                                <small class="text-muted">Minimum 6 caractères</small>
                            </div>
                            
                            <!-- Confirmer mot de passe -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock-fill me-1"></i>
                                    Confirmer le mot de passe
                                </label>
                                <input type="password" 
                                       name="confirmer_mdp" 
                                       class="form-control"
                                       minlength="6">
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between mt-4">
                            <a href="liste.php" class="btn btn-secondary">
                                <i class="bi bi-x-circle me-2"></i>
                                Annuler
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle me-2"></i>
                                Enregistrer les modifications
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Informations supplémentaires -->
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        Informations complémentaires
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-2">
                                <strong>Créé le :</strong> 
                                <?= format_date($user['created_at']) ?>
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-2">
                                <strong>Dernière connexion :</strong> 
                                <?= $user['derniere_connexion'] ? format_date($user['derniere_connexion']) : 'Jamais connecté' ?>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
