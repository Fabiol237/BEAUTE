<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_connexion();

// Vérifier que l'utilisateur est admin
$role = $_SESSION['utilisateur_role'] ?? null;

// BUG CORRIGÉ #5 : set_flash($type, $message)
if ($role !== 'admin') {
    set_flash('danger', 'Accès refusé. Cette page est réservée aux administrateurs.');
    header('Location: ' . SITE_URL . '/dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_POST['id'] ?? 0;

    // Empêcher la suppression de son propre compte
    if ($user_id == $_SESSION['utilisateur_id']) {
        set_flash('danger', 'Vous ne pouvez pas supprimer votre propre compte !');
        header('Location: liste.php');
        exit;
    }

    // Récupérer l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        set_flash('danger', 'Utilisateur introuvable');
        header('Location: liste.php');
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM utilisateurs WHERE id = ?");
        $stmt->execute([$user_id]);

        set_flash('success', "L'utilisateur {$user['prenom']} {$user['nom']} a été supprimé avec succès.");
    } catch (Exception $e) {
        set_flash('danger', 'Erreur lors de la suppression : ' . $e->getMessage());
    }
}

header('Location: liste.php');
exit;
