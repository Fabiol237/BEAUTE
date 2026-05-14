<?php
/**
 * Génération de rapports PDF professionnels
 * Utilise RapportPDFPro (nouveau moteur)
 */

require_once '../includes/config.php';
require_once '../includes/functions.php';
require_connexion();

require_once '../includes/tcpdf/tcpdf.php';
require_once '../includes/RapportPDFPro.php';   // ← nouveau moteur pro

$projet_id   = (int)($_GET['id']   ?? 0);
$type        = $_GET['type'] ?? 'complet';

// Récupérer les données complètes du projet
$stmt = $pdo->prepare("
    SELECT p.*,
           t.nom   as type_nom,
           t.couleur,
           c.nom   as commune_nom,
           r2.nom  as region_nom,
           CONCAT(u.prenom,' ',u.nom) as responsable_nom,
           r.nom   as role_nom
    FROM projets p
    LEFT JOIN types_projets  t  ON p.type_projet_id  = t.id
    LEFT JOIN communes       c  ON p.commune_id      = c.id
    LEFT JOIN regions        r2 ON c.region_id       = r2.id
    LEFT JOIN utilisateurs   u  ON p.responsable_id  = u.id
    LEFT JOIN roles          r  ON u.role_id         = r.id
    WHERE p.id = ?
");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$projet) {
    header('Location: ' . SITE_URL . '/projets/liste.php');
    exit;
}

try {
    $rapport    = new RapportPDFPro($projet, $pdo);
    $date_str   = date('Ymd');
    $id         = $projet['id'];

    switch ($type) {
        case 'financier':
            $rapport->genererRapportFinancier();
            $rapport->telecharger("rapport_financier_{$id}_{$date_str}.pdf");
            break;
        case 'avancement':
            $rapport->genererRapportAvancement();
            $rapport->telecharger("rapport_avancement_{$id}_{$date_str}.pdf");
            break;
        default:
            $rapport->genererRapportComplet();
            $rapport->telecharger("rapport_complet_{$id}_{$date_str}.pdf");
    }

} catch (Throwable $e) {
    // En cas d'erreur, redirection avec message flash
    set_flash('danger', 'Erreur lors de la génération du rapport : ' . $e->getMessage());
    header('Location: ' . SITE_URL . '/projets/details.php?id=' . $projet_id);
    exit;
}
