<?php
/**
 * Configuration de la base de données
 * Système de Suivi des Projets Municipaux
 */

// Informations de connexion MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Vide par défaut sur XAMPP
define('DB_NAME', 'suivi_projets_municipaux');

// Connexion à la base de données avec PDO
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    die("❌ Erreur de connexion : " . $e->getMessage());
}

// Démarrer la session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuration du site
define('SITE_NAME', 'Suivi Projets Municipaux');
define('SITE_URL', 'http://localhost/projet-municipal');
?>
