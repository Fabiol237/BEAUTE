<?php
// BUG CORRIGÉ : session_start() appelé sans vérifier si la session est déjà active
// → peut produire un warning PHP "session already started"
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Détruire proprement la session
$_SESSION = [];

// Supprimer le cookie de session si présent
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

session_destroy();

header('Location: login.php');
exit;
