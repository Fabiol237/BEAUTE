<?php
/**
 * Portail Citoyen — Suggestions & Signalements
 * Même page, deux onglets :
 *   Onglet 1 — Faire une suggestion pour un projet
 *   Onglet 2 — Signaler un problème (avec photos, localisation, durée, témoins)
 */

require_once '../includes/config.php';
require_once '../includes/functions.php';

$success      = false;
$mode_success = '';
$erreurs      = [];

$upload_dir = dirname(__DIR__) . '/assets/uploads/signalements/';
if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

// ── TRAITEMENT POST ───────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mode      = $_POST['mode']      ?? 'suggestion';
    $nom       = trim($_POST['nom']       ?? '');
    $email     = trim($_POST['email']     ?? '');
    $telephone = trim($_POST['telephone'] ?? '');
    $message   = trim($_POST['message']   ?? '');

    // Validation commune
    if (empty($nom))                                                   $erreurs[] = "Le nom est requis";
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL))   $erreurs[] = "Adresse email invalide";
    if (empty($message) || strlen($message) < 20)                      $erreurs[] = "La description doit contenir au moins 20 caractères";

    if ($mode === 'suggestion') {
        $projet_id         = $_POST['projet_id']         ?? null;
        $categorie         = $_POST['categorie']         ?? '';
        $quartier          = trim($_POST['quartier']     ?? '');
        $priorite_citoyen  = $_POST['priorite_citoyen']  ?? 'basse';
        $disponible        = isset($_POST['disponible_contact']) ? 1 : 0;

        if (empty($categorie)) $erreurs[] = "La catégorie de suggestion est requise";

    } else {
        $projet_id         = $_POST['projet_id']         ?? null;
        $categorie         = $_POST['categorie_probleme']?? '';
        $quartier          = trim($_POST['quartier']     ?? '');
        $adresse_probleme  = trim($_POST['adresse_probleme'] ?? '');
        $latitude          = $_POST['latitude']          ?: null;
        $longitude         = $_POST['longitude']         ?: null;
        $depuis_quand      = trim($_POST['depuis_quand'] ?? '');
        $a_temoins         = isset($_POST['a_temoins']) ? 1 : 0;
        $disponible        = isset($_POST['disponible_contact']) ? 1 : 0;
        $urgence           = $_POST['urgence']           ?? 'normale';

        if (empty($categorie))      $erreurs[] = "La catégorie du problème est requise";
        if (empty($adresse_probleme) && empty($latitude))
                                    $erreurs[] = "Veuillez indiquer l'adresse ou utiliser la localisation GPS";

        // Validation photos
        $photos_valides = [];
        if (!empty($_FILES['photos']['name'][0])) {
            foreach ($_FILES['photos']['tmp_name'] as $i => $tmp) {
                if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                if ($_FILES['photos']['size'][$i]  > 5 * 1024 * 1024) { $erreurs[] = "Photo " . ($i+1) . " trop volumineuse (max 5 Mo)"; continue; }
                if (!in_array(mime_content_type($tmp), ['image/jpeg','image/png','image/webp'])) { $erreurs[] = "Photo " . ($i+1) . " : format invalide (JPG, PNG, WEBP)"; continue; }
                $photos_valides[] = ['tmp'=>$tmp, 'nom'=>basename($_FILES['photos']['name'][$i]), 'taille'=>$_FILES['photos']['size'][$i]];
                if (count($photos_valides) >= 5) break;
            }
        }
    }

    if (empty($erreurs)) {
        try {
            $pdo->beginTransaction();

            $prefix   = $mode === 'signalement' ? 'Signalement' : ucfirst(str_replace('_',' ', $categorie));
            $titre    = $prefix . ' — ' . mb_substr($nom, 0, 30);
            $priorite = ($mode === 'signalement' && ($urgence ?? '') === 'urgente') ? 'haute' : ($priorite_citoyen ?? 'basse');

            $pdo->prepare("
                INSERT INTO suggestions
                    (mode, citoyen_nom, citoyen_email, citoyen_telephone,
                     projet_id, categorie, titre, description,
                     quartier, priorite_citoyen, disponible_contact,
                     adresse_probleme, latitude, longitude,
                     depuis_quand, a_temoins, priorite, date_soumission)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
            ")->execute([
                $mode, $nom, $email, $telephone ?: null,
                $projet_id ?: null, $categorie, $titre, $message,
                $quartier ?: null, $priorite_citoyen ?? 'basse', $disponible,
                $adresse_probleme ?? null, $latitude, $longitude,
                $depuis_quand ?? null, $a_temoins ?? 0, $priorite,
            ]);

            $sid = (int)$pdo->lastInsertId();

            if ($mode === 'signalement' && !empty($photos_valides)) {
                foreach ($photos_valides as $ph) {
                    $ext  = pathinfo($ph['nom'], PATHINFO_EXTENSION);
                    $name = 'sig_' . $sid . '_' . uniqid() . '.' . $ext;
                    if (move_uploaded_file($ph['tmp'], $upload_dir . $name)) {
                        $pdo->prepare("INSERT INTO signalement_photos (suggestion_id,fichier_url,fichier_nom,taille) VALUES (?,?,?,?)")
                            ->execute([$sid, $name, $ph['nom'], $ph['taille']]);
                    }
                }
            }

            $pdo->commit();
            $success = true; $mode_success = $mode;

        } catch (Exception $ex) {
            $pdo->rollBack();
            $erreurs[] = "Erreur lors de l'envoi : " . $ex->getMessage();
        }
    }
}

$mode_actif = $_POST['mode'] ?? $_GET['mode'] ?? 'suggestion';
$projets    = $pdo->query("SELECT id, titre FROM projets WHERE visible_public = TRUE ORDER BY titre")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suggestions & Signalements — Portail Citoyen</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css">
    <style>
        :root{--vert:#007A3D;--rouge:#CE1126;--bg:#F4F6F9;--dark:#2C3E50;--muted:#6C757D}
        *{font-family:'Poppins',sans-serif;box-sizing:border-box}
        body{background:var(--bg);color:var(--dark)}

        /* Navbar */
        .nav-portail{background:linear-gradient(135deg,var(--vert),#3d8b6f);box-shadow:0 2px 10px rgba(0,0,0,.12)}
        .nav-portail .navbar-brand,.nav-portail .nav-link{color:#fff!important;font-weight:500}

        /* Onglets personnalisés */
        .tab-switcher{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);margin-bottom:32px}
        .tab-btn{padding:22px 20px;text-align:center;cursor:pointer;border:none;font-family:'Poppins',sans-serif;font-size:1rem;font-weight:600;transition:all .25s;display:flex;flex-direction:column;align-items:center;gap:8px}
        .tab-btn .tab-icon{font-size:2rem;transition:transform .25s}
        .tab-btn .tab-sub{font-size:.78rem;font-weight:400;margin-top:2px;opacity:.8}
        .tab-btn.tab-suggestion{background:#fff;color:var(--dark)}
        .tab-btn.tab-signalement{background:#fff;color:var(--dark)}
        .tab-btn.tab-suggestion.active{background:var(--vert);color:#fff}
        .tab-btn.tab-signalement.active{background:var(--rouge);color:#fff}
        .tab-btn.active .tab-icon{transform:scale(1.15)}

        /* Carte formulaire */
        .form-card{background:#fff;border-radius:0 0 20px 20px;padding:40px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
        .form-card.card-suggestion{border-top:4px solid var(--vert)}
        .form-card.card-signalement{border-top:4px solid var(--rouge)}

        /* Champs */
        .form-label{font-weight:600;color:var(--dark);margin-bottom:6px}
        .form-control,.form-select{border:2px solid #E9ECEF;border-radius:10px;padding:11px 14px;transition:border-color .2s}
        .mode-sug .form-control:focus,.mode-sug .form-select:focus{border-color:var(--vert);box-shadow:0 0 0 .2rem rgba(0,122,61,.12)}
        .mode-sig .form-control:focus,.mode-sig .form-select:focus{border-color:var(--rouge);box-shadow:0 0 0 .2rem rgba(206,17,38,.12)}

        /* Section label */
        .section-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:24px 0 12px;padding-bottom:6px;border-bottom:1.5px solid #E9ECEF}

        /* Priorité citoyen */
        .prio-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .prio-btn{border:2px solid #E9ECEF;border-radius:10px;padding:12px;text-align:center;cursor:pointer;background:#fff;transition:all .2s}
        .prio-btn input{display:none}
        .prio-btn.sel-basse{border-color:#0d6efd;background:rgba(13,110,253,.06)}
        .prio-btn.sel-haute{border-color:var(--rouge);background:rgba(206,17,38,.06)}

        /* Urgence signalement */
        .urgence-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .urg-btn{border:2px solid #E9ECEF;border-radius:10px;padding:10px;text-align:center;cursor:pointer;background:#fff;transition:all .2s;font-family:'Poppins',sans-serif}
        .urg-btn input{display:none}
        .urg-btn.sel-normale{border-color:#198754;background:rgba(25,135,84,.06)}
        .urg-btn.sel-urgente{border-color:#fd7e14;background:rgba(253,126,20,.06)}
        .urg-btn.sel-critique{border-color:var(--rouge);background:rgba(206,17,38,.06)}

        /* Upload photos */
        .upload-zone{border:2px dashed #CCC;border-radius:14px;padding:28px;text-align:center;cursor:pointer;background:#FAFAFA;transition:all .2s}
        .upload-zone:hover,.upload-zone.drag{border-color:var(--rouge);background:rgba(206,17,38,.03)}
        .preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(85px,1fr));gap:10px;margin-top:12px}
        .prev-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden}
        .prev-item img{width:100%;height:100%;object-fit:cover}
        .prev-item .rm{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;line-height:22px;text-align:center;cursor:pointer;padding:0}

        /* Carte Leaflet */
        #mapSig{height:250px;border-radius:12px;border:2px solid #E9ECEF;margin-top:10px}

        /* Témoin / disponible */
        .toggle-check{background:#F8F9FA;border:2px solid #E9ECEF;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer}
        .toggle-check:hover{border-color:#CCC}
        .toggle-check.checked-sug{border-color:var(--vert);background:rgba(0,122,61,.04)}
        .toggle-check.checked-sig{border-color:var(--rouge);background:rgba(206,17,38,.04)}

        /* Boutons submit */
        .btn-sug{background:linear-gradient(135deg,var(--vert),#2dbd7e);color:#fff;border:none;padding:14px 48px;border-radius:12px;font-weight:600;font-size:1rem;font-family:'Poppins',sans-serif;transition:all .25s;cursor:pointer}
        .btn-sug:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,122,61,.3)}
        .btn-sig{background:linear-gradient(135deg,var(--rouge),#e85555);color:#fff;border:none;padding:14px 48px;border-radius:12px;font-weight:600;font-size:1rem;font-family:'Poppins',sans-serif;transition:all .25s;cursor:pointer}
        .btn-sig:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(206,17,38,.3)}

        /* Succès */
        .success-box{border-radius:20px;padding:40px;text-align:center}
        .success-sug{background:rgba(0,122,61,.06);border-left:5px solid var(--vert)}
        .success-sig{background:rgba(206,17,38,.06);border-left:5px solid var(--rouge)}
        .big-icon{font-size:4rem;margin-bottom:16px}

        /* Compteur */
        small.cpt{display:block;margin-top:4px;font-size:.8rem}

        footer{background:var(--dark);color:#fff}

        @media(max-width:576px){
            .form-card{padding:24px 16px}
            .tab-btn{padding:16px 10px;font-size:.9rem}
        }
    </style>
</head>
<body>

<nav class="navbar navbar-expand-lg nav-portail">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="index.php">
            <img src="/projet-municipal/assets/images/logo.png" alt="Logo"
                 style="height:34px;width:34px;object-fit:contain;background:#fff;padding:5px;border-radius:8px;">
            Portail Citoyen
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="nav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="index.php">Accueil</a></li>
                <li class="nav-item"><a class="nav-link" href="projets.php">Projets</a></li>
                <li class="nav-item"><a class="nav-link active" href="suggestion.php">Suggestions</a></li>
            </ul>
        </div>
    </div>
</nav>

<div class="container mt-5 mb-5">
<div class="row justify-content-center">
<div class="col-lg-9 col-xl-8">

    <div class="text-center mb-4">
        <h1 class="fw-bold" style="color:var(--dark)">Participez à la vie de votre commune</h1>
        <p class="text-muted">Choisissez ce que vous souhaitez faire ci-dessous</p>
    </div>

<?php if ($success): ?>
<!-- ═══════════════════════ SUCCÈS ═══════════════════════ -->
<div class="success-box <?= $mode_success === 'signalement' ? 'success-sig' : 'success-sug' ?>">
    <div class="big-icon" style="color:<?= $mode_success === 'signalement' ? 'var(--rouge)' : 'var(--vert)' ?>">
        <i class="bi bi-check-circle-fill"></i>
    </div>
    <?php if ($mode_success === 'signalement'): ?>
        <h2 style="color:var(--rouge)">Signalement envoyé !</h2>
        <p class="text-muted mt-2 mb-4">
            Votre signalement a bien été reçu et enregistré. Nos équipes prendront en charge ce problème
            dans les meilleurs délais. Vous serez informé par email de l'avancement du traitement.
        </p>
    <?php else: ?>
        <h2 style="color:var(--vert)">Merci pour votre suggestion !</h2>
        <p class="text-muted mt-2 mb-4">
            Votre suggestion a été enregistrée avec succès. Nos équipes l'examineront attentivement
            et vous répondront si nécessaire.
        </p>
    <?php endif; ?>
    <div class="d-flex gap-3 justify-content-center flex-wrap">
        <a href="index.php" class="<?= $mode_success === 'signalement' ? 'btn-sig' : 'btn-sug' ?> text-decoration-none px-4 py-2">
            <i class="bi bi-house-fill me-2"></i>Retour à l'accueil
        </a>
        <a href="suggestion.php" class="btn btn-outline-secondary px-4">
            Nouvelle soumission
        </a>
    </div>
</div>

<?php else: ?>

<!-- ═══════════════════════ ONGLETS ═══════════════════════ -->
<div class="tab-switcher">
    <button type="button" id="tab-sug"
            class="tab-btn tab-suggestion <?= $mode_actif !== 'signalement' ? 'active' : '' ?>"
            onclick="setMode('suggestion')">
        <span class="tab-icon"><i class="bi bi-lightbulb-fill"></i></span>
        <span>Faire une suggestion</span>
        <span class="tab-sub">Proposer une idée ou une amélioration</span>
    </button>
    <button type="button" id="tab-sig"
            class="tab-btn tab-signalement <?= $mode_actif === 'signalement' ? 'active' : '' ?>"
            onclick="setMode('signalement')">
        <span class="tab-icon"><i class="bi bi-exclamation-triangle-fill"></i></span>
        <span>Signaler un problème</span>
        <span class="tab-sub">Nid de poule, panne, inondation...</span>
    </button>
</div>

<?php if (!empty($erreurs)): ?>
<div class="alert alert-danger alert-dismissible fade show mb-4">
    <i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Veuillez corriger les erreurs suivantes :</strong>
    <ul class="mb-0 mt-2"><?php foreach ($erreurs as $err): ?><li><?= e($err) ?></li><?php endforeach; ?></ul>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<!-- ═══════════════════════ FORMULAIRE SUGGESTION ═══════════════════════ -->
<div id="panel-suggestion" style="display:<?= $mode_actif !== 'signalement' ? 'block' : 'none' ?>">
<div class="form-card card-suggestion mode-sug">

    <div class="d-flex align-items-center gap-3 mb-2">
        <div style="width:50px;height:50px;background:rgba(0,122,61,.1);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="bi bi-lightbulb-fill fs-3" style="color:var(--vert)"></i>
        </div>
        <div>
            <h2 class="mb-0 fw-bold fs-4">Faire une suggestion</h2>
            <p class="text-muted mb-0 small">Partagez vos idées pour améliorer vos projets communaux</p>
        </div>
    </div>

    <form method="POST" action="">
    <input type="hidden" name="mode" value="suggestion">

    <!-- Identité -->
    <div class="section-label">Vos coordonnées</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-person-fill me-1" style="color:var(--vert)"></i>Nom complet *</label>
            <input type="text" name="nom" class="form-control" placeholder="Votre nom et prénom"
                   value="<?= e($_POST['nom'] ?? '') ?>" required>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-envelope-fill me-1" style="color:var(--vert)"></i>Adresse email *</label>
            <input type="email" name="email" class="form-control" placeholder="votre@email.com"
                   value="<?= e($_POST['email'] ?? '') ?>" required>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-telephone-fill me-1" style="color:var(--vert)"></i>Téléphone <span class="fw-normal text-muted">(optionnel)</span></label>
            <input type="tel" name="telephone" class="form-control" placeholder="+237 XXX XXX XXX"
                   value="<?= e($_POST['telephone'] ?? '') ?>">
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-geo-alt-fill me-1" style="color:var(--vert)"></i>Quartier / Zone concernée <span class="fw-normal text-muted">(optionnel)</span></label>
            <input type="text" name="quartier" class="form-control" placeholder="Ex: Akwa, Bonanjo, Makepe..."
                   value="<?= e($_POST['quartier'] ?? '') ?>">
        </div>
    </div>

    <!-- Détails suggestion -->
    <div class="section-label">Votre suggestion</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-tag-fill me-1" style="color:var(--vert)"></i>Catégorie *</label>
            <select name="categorie" class="form-select" required>
                <option value="">-- Choisir une catégorie --</option>
                <?php foreach ([
                    'amelioration'   => 'Amélioration d\'un projet existant',
                    'nouvelle_idee'  => 'Nouvelle idée de projet',
                    'infrastructure' => 'Infrastructure & équipements',
                    'environnement'  => 'Environnement & espaces verts',
                    'social'         => 'Social & bien-être des citoyens',
                    'securite'       => 'Sécurité publique',
                    'question'       => 'Question / Demande d\'information',
                    'autre'          => 'Autre',
                ] as $v => $l): ?>
                <option value="<?= $v ?>" <?= ($_POST['categorie'] ?? '') === $v ? 'selected' : '' ?>><?= $l ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-folder-fill me-1" style="color:var(--vert)"></i>Projet concerné <span class="fw-normal text-muted">(optionnel)</span></label>
            <select name="projet_id" class="form-select">
                <option value="">-- Aucun projet spécifique --</option>
                <?php foreach ($projets as $p): ?>
                <option value="<?= $p['id'] ?>" <?= ($_POST['projet_id'] ?? '') == $p['id'] ? 'selected' : '' ?>><?= e($p['titre']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-12">
            <label class="form-label"><i class="bi bi-chat-text-fill me-1" style="color:var(--vert)"></i>Décrivez votre suggestion * <span class="fw-normal text-muted">(min. 20 caractères)</span></label>
            <textarea name="message" class="form-control" rows="5"
                      placeholder="Expliquez votre idée en détail : contexte, bénéfices attendus, comment la mettre en oeuvre..."
                      required oninput="cpt(this,'cpt-sug',20)"><?= e($_POST['message'] ?? '') ?></textarea>
            <small class="cpt text-muted"><span id="cpt-sug">0</span> / 20 caractères minimum</small>
        </div>
    </div>

    <!-- Priorité et disponibilité -->
    <div class="section-label">Paramètres</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label d-block"><i class="bi bi-arrow-up-circle-fill me-1" style="color:var(--vert)"></i>Priorité selon vous</label>
            <div class="prio-grid">
                <?php foreach (['basse'=>['Basse','Peut attendre','bi-circle'],'haute'=>['Haute','À traiter vite','bi-arrow-up-circle-fill']] as $pv=>[$pl,$ps,$pi]): ?>
                <label class="prio-btn <?= ($_POST['priorite_citoyen'] ?? 'basse') === $pv ? 'sel-'.$pv : '' ?>" id="prio-<?= $pv ?>">
                    <input type="radio" name="priorite_citoyen" value="<?= $pv ?>"
                           <?= ($_POST['priorite_citoyen'] ?? 'basse') === $pv ? 'checked' : '' ?>
                           onchange="selPrio('<?= $pv ?>')">
                    <i class="bi <?= $pi ?> d-block fs-4 mb-1" style="color:<?= $pv==='haute'?'var(--rouge)':'#0d6efd' ?>"></i>
                    <div class="fw-semibold small"><?= $pl ?></div>
                    <div class="text-muted" style="font-size:.72rem"><?= $ps ?></div>
                </label>
                <?php endforeach; ?>
            </div>
        </div>
        <div class="col-md-6 d-flex flex-column justify-content-end">
            <label class="toggle-check <?= !empty($_POST['disponible_contact']) ? 'checked-sug' : '' ?>"
                   id="toggle-dispo-sug" onclick="toggleDispo('sug')">
                <div>
                    <div class="fw-semibold"><i class="bi bi-telephone-fill me-2" style="color:var(--vert)"></i>Disponible pour être contacté</div>
                    <small class="text-muted">Cochez si vous acceptez qu'on vous rappelle à ce sujet</small>
                </div>
                <input type="checkbox" name="disponible_contact" id="dispo-sug-input" style="display:none"
                       <?= !empty($_POST['disponible_contact']) ? 'checked' : '' ?>>
                <i class="bi <?= !empty($_POST['disponible_contact']) ? 'bi-toggle-on fs-3' : 'bi-toggle-off fs-3 text-muted' ?>"
                   id="toggle-sug-icon" style="color:var(--vert)"></i>
            </label>
        </div>
    </div>

    <div class="text-center mt-4">
        <button type="submit" class="btn-sug">
            <i class="bi bi-send-fill me-2"></i>Envoyer ma suggestion
        </button>
    </div>
    </form>
</div>
</div>

<!-- ═══════════════════════ FORMULAIRE SIGNALEMENT ═══════════════════════ -->
<div id="panel-signalement" style="display:<?= $mode_actif === 'signalement' ? 'block' : 'none' ?>">
<div class="form-card card-signalement mode-sig">

    <div class="d-flex align-items-center gap-3 mb-2">
        <div style="width:50px;height:50px;background:rgba(206,17,38,.1);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="bi bi-exclamation-triangle-fill fs-3" style="color:var(--rouge)"></i>
        </div>
        <div>
            <h2 class="mb-0 fw-bold fs-4">Signaler un problème</h2>
            <p class="text-muted mb-0 small">Décrivez le problème, sa localisation et joignez des photos si possible</p>
        </div>
    </div>

    <form method="POST" action="" enctype="multipart/form-data">
    <input type="hidden" name="mode" value="signalement">
    <input type="hidden" name="latitude"  id="lat-input">
    <input type="hidden" name="longitude" id="lng-input">

    <!-- Identité -->
    <div class="section-label">Vos coordonnées</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-person-fill me-1" style="color:var(--rouge)"></i>Nom complet *</label>
            <input type="text" name="nom" class="form-control" placeholder="Votre nom et prénom"
                   value="<?= e($_POST['nom'] ?? '') ?>" required>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-envelope-fill me-1" style="color:var(--rouge)"></i>Adresse email *</label>
            <input type="email" name="email" class="form-control" placeholder="votre@email.com"
                   value="<?= e($_POST['email'] ?? '') ?>" required>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-telephone-fill me-1" style="color:var(--rouge)"></i>Téléphone <span class="fw-normal text-muted">(optionnel)</span></label>
            <input type="tel" name="telephone" class="form-control" placeholder="+237 XXX XXX XXX"
                   value="<?= e($_POST['telephone'] ?? '') ?>">
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-geo-alt-fill me-1" style="color:var(--rouge)"></i>Quartier / Zone <span class="fw-normal text-muted">(optionnel)</span></label>
            <input type="text" name="quartier" class="form-control" placeholder="Ex: Akwa, Bepanda..."
                   value="<?= e($_POST['quartier'] ?? '') ?>">
        </div>
    </div>

    <!-- Détails du problème -->
    <div class="section-label">Détails du problème</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-tag-fill me-1" style="color:var(--rouge)"></i>Catégorie du problème *</label>
            <select name="categorie_probleme" class="form-select" required>
                <option value="">-- Choisir une catégorie --</option>
                <?php foreach ([
                    'voirie'       => 'Voirie & routes (nid de poule, trottoir...)',
                    'eau'          => 'Eau & assainissement (fuite, égout...)',
                    'electricite'  => 'Electricité & éclairage public',
                    'dechets'      => 'Déchets & propreté',
                    'securite'     => 'Sécurité & ordre public',
                    'vegetation'   => 'Végétation & espaces verts',
                    'inondation'   => 'Inondation & eaux pluviales',
                    'batiment'     => 'Bâtiment ou infrastructure communale',
                    'autre'        => 'Autre problème',
                ] as $v => $l): ?>
                <option value="<?= $v ?>" <?= ($_POST['categorie_probleme'] ?? '') === $v ? 'selected' : '' ?>><?= $l ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-clock-history me-1" style="color:var(--rouge)"></i>Depuis quand ce problème existe-t-il ?</label>
            <select name="depuis_quand" class="form-select">
                <option value="">-- Choisir --</option>
                <?php foreach ([
                    'Moins d\'une semaine' => 'Moins d\'une semaine',
                    '1 à 2 semaines'       => '1 à 2 semaines',
                    '1 mois environ'       => '1 mois environ',
                    '2 à 3 mois'           => '2 à 3 mois',
                    'Plus de 3 mois'       => 'Plus de 3 mois',
                    'Depuis plus d\'un an' => 'Depuis plus d\'un an',
                ] as $v => $l): ?>
                <option value="<?= $v ?>" <?= ($_POST['depuis_quand'] ?? '') === $v ? 'selected' : '' ?>><?= $l ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-6">
            <label class="form-label"><i class="bi bi-folder-fill me-1" style="color:var(--rouge)"></i>Projet concerné <span class="fw-normal text-muted">(optionnel)</span></label>
            <select name="projet_id" class="form-select">
                <option value="">-- Aucun projet spécifique --</option>
                <?php foreach ($projets as $p): ?>
                <option value="<?= $p['id'] ?>"><?= e($p['titre']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-6">
            <label class="form-label d-block"><i class="bi bi-speedometer me-1" style="color:var(--rouge)"></i>Niveau d'urgence</label>
            <div class="urgence-grid">
                <?php foreach ([
                    'normale'  => ['Normale',  'Peut attendre',     '#198754'],
                    'urgente'  => ['Urgente',  'A traiter rapidement', '#fd7e14'],
                    'critique' => ['Critique', 'Danger immédiat',   'var(--rouge)'],
                ] as $v => [$l,$s,$c]): ?>
                <label class="urg-btn <?= ($_POST['urgence'] ?? 'normale') === $v ? 'sel-'.$v : '' ?>" id="urg-<?= $v ?>">
                    <input type="radio" name="urgence" value="<?= $v ?>"
                           <?= ($_POST['urgence'] ?? 'normale') === $v ? 'checked' : '' ?>
                           onchange="selUrg('<?= $v ?>')">
                    <div class="fw-semibold small" style="color:<?= $c ?>"><?= $l ?></div>
                    <div class="text-muted" style="font-size:.7rem"><?= $s ?></div>
                </label>
                <?php endforeach; ?>
            </div>
        </div>
        <div class="col-12">
            <label class="form-label"><i class="bi bi-chat-text-fill me-1" style="color:var(--rouge)"></i>Décrivez le problème en détail * <span class="fw-normal text-muted">(min. 20 caractères)</span></label>
            <textarea name="message" class="form-control" rows="5"
                      placeholder="Décrivez précisément le problème : nature exacte, impact sur les habitants, risques potentiels, contexte..."
                      required oninput="cpt(this,'cpt-sig',20)"><?= e($_POST['message'] ?? '') ?></textarea>
            <small class="cpt text-muted"><span id="cpt-sig">0</span> / 20 caractères minimum</small>
        </div>
    </div>

    <!-- Localisation -->
    <div class="section-label">Localisation du problème *</div>
    <div class="row g-3">
        <div class="col-12">
            <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="text" name="adresse_probleme" id="adresse-input" class="form-control"
                       placeholder="Saisissez l'adresse ou le lieu exact du problème..."
                       value="<?= e($_POST['adresse_probleme'] ?? '') ?>">
                <button type="button" class="btn btn-outline-danger" onclick="gpsLoc()">
                    <i class="bi bi-crosshair2 me-1"></i>Ma position GPS
                </button>
            </div>
            <div id="gps-msg" class="small text-muted mt-1"></div>
        </div>
        <div class="col-12">
            <div id="mapSig"></div>
            <small class="text-muted d-block mt-1">
                <i class="bi bi-info-circle me-1"></i>
                Cliquez sur la carte pour indiquer l'emplacement précis, ou utilisez le bouton GPS.
            </small>
        </div>
    </div>

    <!-- Photos -->
    <div class="section-label">Photos du problème <span class="fw-normal text-muted">(optionnel — max 5 photos, 5 Mo chacune)</span></div>
    <div class="upload-zone" id="drop-zone" onclick="document.getElementById('photo-input').click()">
        <i class="bi bi-cloud-arrow-up" style="font-size:2.2rem;color:#CCC"></i>
        <p class="mt-2 mb-1 fw-semibold">Cliquez ou glissez vos photos ici</p>
        <p class="text-muted small mb-0">JPG, PNG ou WEBP acceptés</p>
    </div>
    <input type="file" name="photos[]" id="photo-input" multiple accept="image/jpeg,image/png,image/webp"
           style="display:none" onchange="prevPhotos(this)">
    <div class="preview-grid" id="prev-grid"></div>

    <!-- Témoins et disponibilité -->
    <div class="section-label">Informations complémentaires</div>
    <div class="row g-3">
        <div class="col-md-6">
            <label class="toggle-check <?= !empty($_POST['a_temoins']) ? 'checked-sig' : '' ?>"
                   id="toggle-temoins" onclick="toggleCheck('temoins','sig')">
                <div>
                    <div class="fw-semibold"><i class="bi bi-people-fill me-2" style="color:var(--rouge)"></i>Il y a des témoins</div>
                    <small class="text-muted">D'autres personnes peuvent confirmer ce problème</small>
                </div>
                <input type="checkbox" name="a_temoins" id="temoins-input" style="display:none"
                       <?= !empty($_POST['a_temoins']) ? 'checked' : '' ?>>
                <i class="bi <?= !empty($_POST['a_temoins']) ? 'bi-toggle-on fs-3' : 'bi-toggle-off fs-3 text-muted' ?>"
                   id="toggle-temoins-icon" style="color:var(--rouge)"></i>
            </label>
        </div>
        <div class="col-md-6">
            <label class="toggle-check <?= !empty($_POST['disponible_contact_sig']) ? 'checked-sig' : '' ?>"
                   id="toggle-dispo-sig" onclick="toggleCheck('dispo-sig','sig')">
                <div>
                    <div class="fw-semibold"><i class="bi bi-telephone-fill me-2" style="color:var(--rouge)"></i>Disponible pour être contacté</div>
                    <small class="text-muted">Nos équipes pourront vous rappeler si besoin</small>
                </div>
                <input type="checkbox" name="disponible_contact" id="dispo-sig-input" style="display:none"
                       <?= !empty($_POST['disponible_contact_sig']) ? 'checked' : '' ?>>
                <i class="bi <?= !empty($_POST['disponible_contact_sig']) ? 'bi-toggle-on fs-3' : 'bi-toggle-off fs-3 text-muted' ?>"
                   id="toggle-dispo-sig-icon" style="color:var(--rouge)"></i>
            </label>
        </div>
    </div>

    <div class="text-center mt-4">
        <button type="submit" class="btn-sig">
            <i class="bi bi-send-fill me-2"></i>Envoyer le signalement
        </button>
    </div>
    </form>
</div>
</div>

<?php endif; ?>

</div></div></div>

<footer class="py-4 text-center mt-4">
    <div class="container">
        <p class="mb-0">&copy; <?= date('Y') ?> Communes Urbaines du Littoral — Cameroun</p>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
<script>
// ── Onglets ───────────────────────────────────────────────────
function setMode(m) {
    const isSig = m === 'signalement';
    document.getElementById('tab-sug').className = 'tab-btn tab-suggestion' + (!isSig ? ' active' : '');
    document.getElementById('tab-sig').className = 'tab-btn tab-signalement' + (isSig  ? ' active' : '');
    document.getElementById('panel-suggestion').style.display  = isSig  ? 'none'  : 'block';
    document.getElementById('panel-signalement').style.display = isSig  ? 'block' : 'none';
    if (isSig && !mapReady) setTimeout(initMap, 80);
}

// ── Compteur caractères ───────────────────────────────────────
function cpt(el, id, min) {
    const n = el.value.length;
    const s = document.getElementById(id);
    s.textContent = n;
    s.style.color = n >= min ? 'var(--vert)' : 'var(--rouge)';
}

// ── Priorité suggestion ───────────────────────────────────────
function selPrio(v) {
    document.getElementById('prio-basse').className = 'prio-btn' + (v==='basse' ? ' sel-basse' : '');
    document.getElementById('prio-haute').className = 'prio-btn' + (v==='haute' ? ' sel-haute' : '');
}

// ── Urgence signalement ───────────────────────────────────────
function selUrg(v) {
    ['normale','urgente','critique'].forEach(u => {
        document.getElementById('urg-'+u).className = 'urg-btn' + (u===v ? ' sel-'+u : '');
    });
}

// ── Toggles ───────────────────────────────────────────────────
function toggleCheck(id, mode) {
    const inp  = document.getElementById(id + '-input');
    const icon = document.getElementById('toggle-' + id + '-icon');
    const lbl  = document.getElementById('toggle-' + (id==='temoins'?'temoins':'dispo-sig'));
    const cls  = 'checked-' + mode;
    inp.checked = !inp.checked;
    if (inp.checked) {
        icon.className = 'bi bi-toggle-on fs-3';
        icon.style.color = mode==='sig' ? 'var(--rouge)' : 'var(--vert)';
        lbl.classList.add(cls);
    } else {
        icon.className = 'bi bi-toggle-off fs-3 text-muted';
        lbl.classList.remove(cls);
    }
}
function toggleDispo(mode) {
    const inp  = document.getElementById('dispo-sug-input');
    const icon = document.getElementById('toggle-sug-icon');
    const lbl  = document.getElementById('toggle-dispo-sug');
    inp.checked = !inp.checked;
    if (inp.checked) {
        icon.className = 'bi bi-toggle-on fs-3'; icon.style.color='var(--vert)';
        lbl.classList.add('checked-sug');
    } else {
        icon.className = 'bi bi-toggle-off fs-3 text-muted';
        lbl.classList.remove('checked-sug');
    }
}

// ── Carte Leaflet ─────────────────────────────────────────────
let map, pin, mapReady = false;
function initMap() {
    mapReady = true;
    map = L.map('mapSig').setView([4.0511, 9.7679], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(map);
    map.on('click', e => poserPin(e.latlng.lat, e.latlng.lng));
}
function poserPin(lat, lng) {
    if (pin) map.removeLayer(pin);
    pin = L.marker([lat, lng], { draggable: true }).addTo(map);
    pin.on('dragend', () => { const p=pin.getLatLng(); setLatLng(p.lat,p.lng); });
    setLatLng(lat, lng);
    map.setView([lat, lng], 16);
}
function setLatLng(lat, lng) {
    document.getElementById('lat-input').value = lat.toFixed(7);
    document.getElementById('lng-input').value = lng.toFixed(7);
}
function gpsLoc() {
    const msg = document.getElementById('gps-msg');
    if (!navigator.geolocation) { msg.textContent = 'Géolocalisation non disponible sur ce navigateur.'; return; }
    msg.innerHTML = '<i class="bi bi-arrow-repeat"></i> Localisation en cours...';
    navigator.geolocation.getCurrentPosition(pos => {
        const {latitude:lat, longitude:lng} = pos.coords;
        if (!mapReady) initMap();
        poserPin(lat, lng);
        msg.innerHTML = '<i class="bi bi-check-circle text-success"></i> Position GPS obtenue.';
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(r=>r.json()).then(d=>{ if(d.display_name) document.getElementById('adresse-input').value=d.display_name; }).catch(()=>{});
    }, err => { msg.textContent = 'Erreur GPS : ' + err.message; }, { enableHighAccuracy:true, timeout:10000 });
}

// ── Photos preview ────────────────────────────────────────────
let filesSelected = [];
function prevPhotos(input) {
    Array.from(input.files).forEach(file => {
        if (filesSelected.length >= 5) return;
        filesSelected.push(file);
        const reader = new FileReader();
        const idx = filesSelected.length - 1;
        reader.onload = e => {
            const div = document.createElement('div');
            div.className = 'prev-item'; div.id = 'prev-' + idx;
            div.innerHTML = `<img src="${e.target.result}"><button class="rm" type="button" onclick="rmPhoto(${idx})">×</button>`;
            document.getElementById('prev-grid').appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    rebuildInput();
}
function rmPhoto(i) {
    filesSelected.splice(i,1);
    const el = document.getElementById('prev-' + i); if(el) el.remove();
    document.querySelectorAll('.prev-item').forEach((el,j) => {
        el.id = 'prev-'+j;
        el.querySelector('.rm').setAttribute('onclick','rmPhoto('+j+')');
    });
    rebuildInput();
}
function rebuildInput() {
    const dt = new DataTransfer();
    filesSelected.forEach(f => dt.items.add(f));
    document.getElementById('photo-input').files = dt.files;
}
const dz = document.getElementById('drop-zone');
if (dz) {
    dz.addEventListener('dragover', e=>{e.preventDefault();dz.classList.add('drag');});
    dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
    dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag');prevPhotos({files:e.dataTransfer.files});});
}

// Init selon mode URL
document.addEventListener('DOMContentLoaded', () => {
    if ('<?= $mode_actif ?>' === 'signalement') setTimeout(initMap, 100);
});
</script>
</body>
</html>
