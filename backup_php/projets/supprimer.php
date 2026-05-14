<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_connexion();

$projet_id = $_GET['id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, titre FROM projets WHERE id = ?");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

if (!$projet) {
    set_flash('danger', 'Projet introuvable');
    header('Location: liste.php');
    exit;
}

// BUG CORRIGÉ : était in_array($_SESSION['role_id'], [1, 2]) — IDs codés en dur fragiles
// Maintenant on utilise $_SESSION['utilisateur_role'] (texte) comme partout ailleurs
$role = $_SESSION['utilisateur_role'] ?? '';
if ($role !== 'admin') {
    set_flash('danger', "Vous n'avez pas les droits pour supprimer un projet.");
    header('Location: details.php?id=' . $projet_id);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirmer'])) {
    try {
        $photos = $pdo->prepare("SELECT fichier_url FROM photos WHERE projet_id = ?");
        $photos->execute([$projet_id]);
        foreach ($photos->fetchAll() as $photo) {
            $file_path = '../assets/uploads/' . $photo['fichier_url'];
            if (file_exists($file_path)) unlink($file_path);
        }
        $pdo->prepare("DELETE FROM projets WHERE id = ?")->execute([$projet_id]);
        set_flash('success', 'Le projet "' . $projet['titre'] . '" a été supprimé avec succès.');
        header('Location: liste.php');
        exit;
    } catch (PDOException $e) {
        set_flash('danger', 'Erreur lors de la suppression : ' . $e->getMessage());
        header('Location: details.php?id=' . $projet_id);
        exit;
    }
}

$page_title = 'Supprimer le projet';
require_once '../includes/header.php';
require_once '../includes/navbar.php';
?>
<div class="container-fluid mt-4">
    <div class="row justify-content-center">
        <div class="col-lg-6">
            <div class="card border-danger">
                <div class="card-header bg-danger text-white">
                    <h4 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Confirmer la suppression</h4>
                </div>
                <div class="card-body">
                    <div class="alert alert-danger">
                        <h5>⚠️ Action irréversible !</h5>
                        <p class="mb-0">Cette action supprimera définitivement le projet et toutes ses données associées (dépenses, avancements, photos, documents).</p>
                    </div>
                    <div class="bg-light p-3 rounded mb-4">
                        <h5 class="mb-2">Projet à supprimer :</h5>
                        <p class="mb-0 fs-5 fw-bold text-danger"><?= e($projet['titre']) ?></p>
                    </div>
                    <form method="POST" action="">
                        <div class="d-grid gap-2">
                            <button type="submit" name="confirmer" class="btn btn-danger btn-lg">
                                <i class="bi bi-trash me-2"></i>Oui, supprimer définitivement
                            </button>
                            <a href="details.php?id=<?= $projet_id ?>" class="btn btn-outline-secondary btn-lg">
                                <i class="bi bi-arrow-left me-2"></i>Non, annuler
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<?php require_once '../includes/footer.php'; ?>
