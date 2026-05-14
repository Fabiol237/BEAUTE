<?php
/**
 * Fonctions utilitaires
 * Système de Suivi des Projets Municipaux
 */

// Vérifier si l'utilisateur est connecté
function est_connecte() {
    return isset($_SESSION['utilisateur_id']);
}

// Rediriger si non connecté
function require_connexion() {
    if (!est_connecte()) {
        header('Location: ' . SITE_URL . '/login.php');
        exit;
    }
}

// Formater un montant en FCFA
function format_montant($montant) {
    return number_format($montant, 0, ',', ' ') . ' FCFA';
}

// Formater une date
function format_date($date) {
    if (empty($date)) return '-';
    return date('d/m/Y', strtotime($date));
}

// Formater une date + heure
function format_datetime($date) {
    if (empty($date)) return '-';
    return date('d/m/Y H:i', strtotime($date));
}

// Obtenir le badge de statut
function get_statut_badge($statut) {
    $badges = [
        'planifié'  => '<span class="badge bg-secondary">Planifié</span>',
        'en_cours'  => '<span class="badge bg-primary">En cours</span>',
        'suspendu'  => '<span class="badge bg-warning text-dark">Suspendu</span>',
        'terminé'   => '<span class="badge bg-success">Terminé</span>',
        'annulé'    => '<span class="badge bg-danger">Annulé</span>',
    ];
    return $badges[$statut] ?? '<span class="badge bg-secondary">' . htmlspecialchars($statut, ENT_QUOTES, 'UTF-8') . '</span>';
}

// Obtenir la classe de la barre de progression
function get_progress_class($pourcentage) {
    if ($pourcentage < 30) return 'bg-danger';
    if ($pourcentage < 60) return 'bg-warning';
    if ($pourcentage < 90) return 'bg-info';
    return 'bg-success';
}

// Sécuriser les sorties HTML
function e($string) {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

// Enregistrer un message flash en session
function set_flash($type, $message) {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

// Afficher et effacer le message flash
function get_flash() {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);

        // BUG CORRIGÉ : 'danger' était absent → tous les messages d'erreur
        // s'affichaient en bleu (alert-info) au lieu de rouge (alert-danger).
        // Ajout de 'danger' et harmonisation complète avec Bootstrap 5.
        $class = [
            'success' => 'alert-success',
            'danger'  => 'alert-danger',   // ← AJOUTÉ
            'error'   => 'alert-danger',   // alias pour compatibilité
            'warning' => 'alert-warning',
            'info'    => 'alert-info',
        ][$flash['type']] ?? 'alert-info';

        $icon = [
            'success' => 'bi-check-circle-fill',
            'danger'  => 'bi-exclamation-triangle-fill',
            'error'   => 'bi-exclamation-triangle-fill',
            'warning' => 'bi-exclamation-circle-fill',
            'info'    => 'bi-info-circle-fill',
        ][$flash['type']] ?? 'bi-info-circle-fill';

        return '<div class="alert ' . $class . ' alert-dismissible fade show d-flex align-items-center" role="alert">'
             . '<i class="bi ' . $icon . ' me-2 flex-shrink-0"></i>'
             . '<div>' . e($flash['message']) . '</div>'
             . '<button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Fermer"></button>'
             . '</div>';
    }
    return '';
}

// Calculer le nombre de jours restants (négatif si dépassé)
function jours_restants($date_fin) {
    if (empty($date_fin)) return null;

    try {
        $now = new DateTime();
        $fin = new DateTime($date_fin);
        $diff = $now->diff($fin);
        return $diff->invert ? -$diff->days : $diff->days;
    } catch (Exception $e) {
        return null;
    }
}

// Vérifier si l'utilisateur a un rôle donné (ou supérieur)
// Usage : peut_faire('gestionnaire')  → vrai pour admin et gestionnaire
function peut_faire($role_requis) {
    $hierarchie = ['lecteur' => 1, 'gestionnaire' => 2, 'admin' => 3];
    $role_actuel = $_SESSION['utilisateur_role'] ?? 'lecteur';
    return ($hierarchie[$role_actuel] ?? 0) >= ($hierarchie[$role_requis] ?? 99);
}
?>
