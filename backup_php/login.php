<?php
$page_title = 'Connexion';
require_once 'includes/header.php';

// Si déjà connecté, rediriger vers dashboard
if (est_connecte()) {
    header('Location: dashboard.php');
    exit;
}

// Traitement du formulaire
$erreur = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = $_POST['email']    ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $erreur = 'Veuillez remplir tous les champs';
    } else {
        // BUG CORRIGÉ : La BDD a deux colonnes de statut :
        //   - statut ENUM('actif','inactif','suspendu')
        //   - actif  TINYINT (1 = actif, 0 = inactif)
        // On vérifie les deux pour éviter qu'un compte désactivé via 'actif=0' puisse quand même se connecter.
        $stmt = $pdo->prepare("
            SELECT u.*, r.nom as role_nom 
            FROM utilisateurs u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ? 
              AND u.statut = 'actif'
              AND u.actif = 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Vérifier le mot de passe
        if ($user && password_verify($password, $user['password_hash'])) {
            // Connexion réussie
            $_SESSION['utilisateur_id']     = $user['id'];
            $_SESSION['utilisateur_nom']    = $user['nom'];
            $_SESSION['utilisateur_prenom'] = $user['prenom'];
            $_SESSION['utilisateur_email']  = $user['email'];
            $_SESSION['role_id']            = $user['role_id'];
            $_SESSION['role_nom']           = $user['role_nom'];
            $_SESSION['utilisateur_role']   = $user['role']; // 'admin', 'gestionnaire', 'lecteur'

            // Mettre à jour la dernière connexion
            $pdo->prepare("UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?")
                ->execute([$user['id']]);

            header('Location: dashboard.php');
            exit;
        } else {
            // Message générique pour ne pas révéler si l'email existe
            $erreur = 'Email ou mot de passe incorrect';
        }
    }
}
?>

<div class="login-container">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card login-card">
                    <div class="login-header">
                        <img src="/projet-municipal/assets/images/logo.png" alt="Logo" style="height: 35px; width: 35px; object-fit: contain; margin-right: 10px; background: white; padding: 5px; border-radius: 8px;">
                        <h3 class="mb-0">Suivi Projets Municipaux</h3>
                        <p class="mb-0 opacity-75">Communes Urbaines du Littoral</p>
                    </div>
                    
                    <div class="login-body">
                        <h4 class="text-center mb-4">Connexion</h4>
                        
                        <?php if ($erreur): ?>
                            <div class="alert alert-danger" role="alert">
                                <i class="bi bi-exclamation-circle me-2"></i>
                                <?= e($erreur) ?>
                            </div>
                        <?php endif; ?>
                        
                        <form method="POST" action="">
                            <div class="mb-3">
                                <label for="email" class="form-label">
                                    <i class="bi bi-envelope me-1"></i> Email
                                </label>
                                <input 
                                    type="email" 
                                    class="form-control form-control-lg" 
                                    id="email" 
                                    name="email" 
                                    placeholder="votre@email.com"
                                    value="<?= e($_POST['email'] ?? '') ?>"
                                    required
                                    autofocus
                                >
                            </div>
                            
                            <div class="mb-4">
                                <label for="password" class="form-label">
                                    <i class="bi bi-lock me-1"></i> Mot de passe
                                </label>
                                <input 
                                    type="password" 
                                    class="form-control form-control-lg" 
                                    id="password" 
                                    name="password" 
                                    placeholder="••••••••"
                                    required
                                >
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="remember">
                                <label class="form-check-label" for="remember">
                                    Se souvenir de moi
                                </label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-lg w-100 mb-3">
                                <i class="bi bi-box-arrow-in-right me-2"></i>
                                Se connecter
                            </button>
                            
                            <div class="text-center">
                                <a href="#" class="text-decoration-none">Mot de passe oublié ?</a>
                            </div>
                        </form>
                    </div>
                    
                    <div class="card-footer text-center text-muted bg-light">
                        <small>
                            <i class="bi bi-shield-check me-1"></i>
                            Connexion sécurisée
                        </small>
                    </div>
                </div>
                
                <div class="text-center mt-3">
                    <p class="text-white">
                        <i class="bi bi-info-circle me-1"></i>
                        Compte de test : admin@commune-littoral.cm / admin123
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
