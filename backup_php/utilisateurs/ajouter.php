<?php
$page_title = 'Ajouter un Utilisateur';
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

$erreurs = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email         = trim($_POST['email'] ?? '');
    $nom           = trim($_POST['nom'] ?? '');
    $prenom        = trim($_POST['prenom'] ?? '');
    $role          = $_POST['role'] ?? 'lecteur';
    $mot_de_passe  = $_POST['mot_de_passe'] ?? '';
    $confirmer_mdp = $_POST['confirmer_mdp'] ?? '';
    $actif         = isset($_POST['actif']) ? 1 : 0;

    // Validation
    if (empty($email))        $erreurs[] = "L'email est requis";
    if (empty($nom))          $erreurs[] = "Le nom est requis";
    if (empty($prenom))       $erreurs[] = "Le prénom est requis";
    if (empty($mot_de_passe)) $erreurs[] = "Le mot de passe est requis";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreurs[] = "L'email n'est pas valide";
    }

    if (strlen($mot_de_passe) < 6) {
        $erreurs[] = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if ($mot_de_passe !== $confirmer_mdp) {
        $erreurs[] = "Les mots de passe ne correspondent pas";
    }

    // Vérifier si l'email existe déjà
    if (empty($erreurs)) {
        $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $erreurs[] = "Cet email est déjà utilisé";
        }
    }

    // Créer l'utilisateur
    if (empty($erreurs)) {
        try {
            $mot_de_passe_hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);

            // BUG CORRIGÉ : role_id est NOT NULL dans la BDD.
            // On mappe le role texte vers l'id de la table roles :
            // admin=1, Maire=2, Chef Service=3, Resp. Financier=4, Agent terrain=5
            // Pour simplifier on garde la logique admin/gestionnaire/lecteur :
            $role_map = ['admin' => 1, 'gestionnaire' => 3, 'lecteur' => 5];
            $role_id  = $role_map[$role] ?? 5;

            $sql = "INSERT INTO utilisateurs (email, nom, prenom, password_hash, role, role_id, actif, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$email, $nom, $prenom, $mot_de_passe_hash, $role, $role_id, $actif]);

            set_flash('success', 'Utilisateur créé avec succès !');
            header('Location: liste.php');
            exit;
        } catch (Exception $e) {
            $erreurs[] = "Erreur lors de la création : " . $e->getMessage();
        }
    }
}
?>

<div class="container-fluid mt-4">
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-person-plus-fill me-2"></i>Ajouter un Utilisateur</h1>
                <p class="text-muted mb-0">
                    Créer un nouveau compte utilisateur
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
                                       value="<?= e($_POST['email'] ?? '') ?>"
                                       required>
                                <small class="text-muted">Utilisé pour la connexion</small>
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
                                       value="<?= e($_POST['nom'] ?? '') ?>"
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
                                       value="<?= e($_POST['prenom'] ?? '') ?>"
                                       required>
                            </div>
                            
                            <!-- Rôle -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-shield-check me-1"></i>
                                    Rôle *
                                </label>
                                <select name="role" class="form-select" required>
                                    <option value="lecteur" <?= ($_POST['role'] ?? '') === 'lecteur' ? 'selected' : '' ?>>
                                        Lecteur (Consultation uniquement)
                                    </option>
                                    <option value="gestionnaire" <?= ($_POST['role'] ?? '') === 'gestionnaire' ? 'selected' : '' ?>>
                                        Gestionnaire (Gestion des projets)
                                    </option>
                                    <option value="admin" <?= ($_POST['role'] ?? '') === 'admin' ? 'selected' : '' ?>>
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
                                           <?= isset($_POST['actif']) || !$_POST ? 'checked' : '' ?>>
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
                                    Mot de passe
                                </h6>
                            </div>
                            
                            <!-- Mot de passe -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock me-1"></i>
                                    Mot de passe *
                                </label>
                                <input type="password" 
                                       name="mot_de_passe" 
                                       class="form-control" 
                                       required
                                       minlength="6">
                                <small class="text-muted">Minimum 6 caractères</small>
                            </div>
                            
                            <!-- Confirmer mot de passe -->
                            <div class="col-md-6 mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock-fill me-1"></i>
                                    Confirmer le mot de passe *
                                </label>
                                <input type="password" 
                                       name="confirmer_mdp" 
                                       class="form-control" 
                                       required
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
                                Créer l'utilisateur
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>
