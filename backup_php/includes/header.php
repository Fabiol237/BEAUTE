<?php
if (!defined('DB_HOST')) {
    require_once __DIR__ . '/config.php';
}
require_once __DIR__ . '/functions.php';

// CORRECTION GLOBALE : ob_start() active le tampon de sortie.
// Sans ça, dès que header.php envoie du HTML (<!DOCTYPE...>),
// PHP ne peut plus envoyer de header HTTP → "headers already sent".
// ob_start() retarde l'envoi réel jusqu'à la fin du script,
// ce qui permet à header('Location:...') de fonctionner n'importe où.
ob_start();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page_title ?? 'Suivi Projets Municipaux' ?></title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?= SITE_URL ?>/assets/css/style.css">
</head>
<body>
