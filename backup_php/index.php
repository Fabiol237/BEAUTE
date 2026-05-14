<?php
// Démarrer la session et inclure la config
session_start();

// Rediriger vers le dashboard si connecté, sinon vers login
if (isset($_SESSION['utilisateur_id'])) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
?>
