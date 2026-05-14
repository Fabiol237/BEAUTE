<?php
/**
 * Création d'un projet — formulaire complet
 */

// Traitement POST AVANT tout include HTML
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_connexion();

if (!peut_faire('gestionnaire')) {
 set_flash('danger', "Accès refusé.");
 header('Location: ' . SITE_URL . '/projets/liste.php');
 exit;
}

$erreurs = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
 $titre = trim($_POST['titre'] ?? '');
 $description = trim($_POST['description'] ?? '');
 $consignes = trim($_POST['consignes'] ?? '');
 $type_projet_id = (int)($_POST['type_projet_id'] ?? 0);
 $commune_id = (int)($_POST['commune_id'] ?? 0);
 $entreprise_executante = trim($_POST['entreprise_executante'] ?? '');
 $visible_public = isset($_POST['visible_public']) ? 1 : 0;
 $budget_initial = str_replace([' ', ','], ['', '.'], $_POST['budget_initial'] ?? '0');
 $budget_deja_utilise = str_replace([' ', ','], ['', '.'], $_POST['budget_deja_utilise'] ?? '0');
 $source_financement = trim($_POST['source_financement'] ?? '');
 $date_debut = $_POST['date_debut'] ?? '';
 $date_fin_prevue = $_POST['date_fin_prevue'] ?? '';
 $statut = $_POST['statut'] ?? 'planifié';
 $priorite = $_POST['priorite'] ?? 'normale';
 $avancement_physique = (int)($_POST['avancement_physique'] ?? 0);
 $adresse = trim($_POST['adresse'] ?? '');
 $latitude = $_POST['latitude'] ?: null;
 $longitude = $_POST['longitude'] ?: null;
 $phases_titres = $_POST['phase_titre'] ?? [];
 $phases_dates = $_POST['phase_date_prevue'] ?? [];
 $phases_pourcentages = $_POST['phase_pct'] ?? [];
 $phases_statuts = $_POST['phase_statut'] ?? [];
 $risques_desc = $_POST['risque_desc'] ?? [];
 $risques_niveau = $_POST['risque_niveau'] ?? [];
 $kpi_libelles = $_POST['kpi_libelle'] ?? [];
 $kpi_cibles = $_POST['kpi_cible'] ?? [];

 if (empty($titre)) $erreurs[] = "Le titre est requis";
 if (!$type_projet_id) $erreurs[] = "Le type de projet est requis";
 if (!$commune_id) $erreurs[] = "La commune est requise";
 if (!is_numeric($budget_initial) || (float)$budget_initial <= 0)
 $erreurs[] = "Le budget doit être un nombre valide supérieur à 0";
 if (empty($date_debut)) $erreurs[] = "La date de début est requise";
 if (empty($date_fin_prevue)) $erreurs[] = "La date de fin prévue est requise";
 if (!empty($date_debut) && !empty($date_fin_prevue) && $date_fin_prevue <= $date_debut)
 $erreurs[] = "La date de fin prévue doit être postérieure à la date de début";

 if (empty($erreurs)) {
 try {
 $pdo->beginTransaction();

 $stmt = $pdo->prepare("
 INSERT INTO projets (
 titre, description, consignes, type_projet_id, commune_id, responsable_id,
 entreprise_executante, budget_initial, budget_actuel, budget_deja_utilise,
 date_debut, date_fin_prevue, statut, priorite, avancement_physique,
 latitude, longitude, adresse, visible_public
 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
 ");
 $stmt->execute([
 $titre, $description, $consignes ?: null,
 $type_projet_id, $commune_id, $_SESSION['utilisateur_id'],
 $entreprise_executante ?: null,
 (float)$budget_initial, (float)$budget_initial, (float)$budget_deja_utilise,
 $date_debut, $date_fin_prevue, $statut, $priorite, $avancement_physique,
 $latitude, $longitude, $adresse ?: null, $visible_public
 ]);
 $projet_id = (int)$pdo->lastInsertId();

 if (!empty($source_financement)) {
 $pdo->prepare("INSERT INTO budgets (projet_id, montant_initial, source_financement, exercice_budgetaire) VALUES (?, ?, ?, ?)")
 ->execute([$projet_id, (float)$budget_initial, $source_financement, date('Y')]);
 }

 foreach ($phases_titres as $i => $titre_phase) {
 if (empty(trim($titre_phase))) continue;
 $pdo->prepare("INSERT INTO jalons (projet_id, titre, date_prevue, statut, pourcentage_completion, ordre) VALUES (?, ?, ?, ?, ?, ?)")
 ->execute([$projet_id, trim($titre_phase), $phases_dates[$i] ?? $date_fin_prevue, $phases_statuts[$i] ?? 'non_commencé', (int)($phases_pourcentages[$i] ?? 0), $i + 1]);
 }

 foreach ($risques_desc as $i => $desc) {
 if (empty(trim($desc))) continue;
 $pdo->prepare("INSERT INTO risques (projet_id, description, niveau, ordre) VALUES (?, ?, ?, ?)")
 ->execute([$projet_id, trim($desc), $risques_niveau[$i] ?? 'moyen', $i + 1]);
 }

 foreach ($kpi_libelles as $i => $libelle) {
 if (empty(trim($libelle))) continue;
 $pdo->prepare("INSERT INTO indicateurs (projet_id, libelle, valeur_cible, ordre) VALUES (?, ?, ?, ?)")
 ->execute([$projet_id, trim($libelle), trim($kpi_cibles[$i] ?? ''), $i + 1]);
 }

 $pdo->commit();
 set_flash('success', "Projet « {$titre} » créé avec succès !");
 header('Location: details.php?id=' . $projet_id);
 exit;

 } catch (PDOException $e) {
 $pdo->rollBack();
 $erreurs[] = "Erreur : " . $e->getMessage();
 }
 }
}

$types_projets = $pdo->query("SELECT * FROM types_projets ORDER BY nom")->fetchAll();
$communes = $pdo->query("SELECT * FROM communes ORDER BY nom")->fetchAll();

$page_title = 'Créer un projet';
require_once '../includes/header.php';
require_once '../includes/navbar.php';
?>
<div class="container-fluid mt-4 pb-5"> <?= get_flash() ?> <div class="page-header mb-4"> <div class="d-flex justify-content-between align-items-center"> <div> <h1><i class="bi bi-plus-circle me-2"></i>Créer un nouveau projet</h1> <nav aria-label="breadcrumb"><ol class="breadcrumb mb-0"> <li class="breadcrumb-item"><a href="<?= SITE_URL ?>/dashboard.php">Dashboard</a></li> <li class="breadcrumb-item"><a href="<?= SITE_URL ?>/projets/liste.php">Projets</a></li> <li class="breadcrumb-item active">Nouveau</li> </ol></nav> </div> <a href="<?= SITE_URL ?>/projets/liste.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-2"></i>Retour</a> </div> </div> <?php if (!empty($erreurs)): ?> <div class="alert alert-danger alert-dismissible fade show"> <i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Erreurs :</strong> <ul class="mb-0 mt-2"><?php foreach ($erreurs as $err): ?><li><?= e($err) ?></li><?php endforeach; ?></ul> <button type="button" class="btn-close" data-bs-dismiss="alert"></button> </div> <?php endif; ?> <form method="POST" id="formProjet"> <div class="row g-4"> <div class="col-lg-8"> <!-- INFOS GÉNÉRALES --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="bi bi-info-circle me-2"></i> Informations générales</h5></div> <div class="card-body"> <div class="mb-3"> <label class="form-label fw-semibold">Nom du projet *</label> <input type="text" name="titre" class="form-control form-control-lg" placeholder="Ex: Réhabilitation route Bonamoussadi — tronçon A" value="<?= e($_POST['titre'] ?? '') ?>" required> </div> <div class="mb-3"> <label class="form-label fw-semibold">Description</label> <textarea name="description" class="form-control" rows="4" placeholder="Objectifs, portée, bénéficiaires attendus..."><?= e($_POST['description'] ?? '') ?></textarea> </div> <div class="row g-3"> <div class="col-md-6"> <label class="form-label fw-semibold">Type de projet *</label> <select name="type_projet_id" class="form-select" required> <option value="">Choisir un type...</option> <?php foreach ($types_projets as $t): ?> <option value="<?= $t['id'] ?>" <?= ($_POST['type_projet_id'] ?? '') == $t['id'] ? 'selected' : '' ?>><?= e($t['nom']) ?></option> <?php endforeach; ?> </select> </div> <div class="col-md-6"> <label class="form-label fw-semibold">Commune *</label> <select name="commune_id" class="form-select" required> <option value="">Choisir une commune...</option> <?php foreach ($communes as $c): ?> <option value="<?= $c['id'] ?>" <?= ($_POST['commune_id'] ?? '') == $c['id'] ? 'selected' : '' ?>><?= e($c['nom']) ?></option> <?php endforeach; ?> </select> </div> <div class="col-12"> <label class="form-label fw-semibold">Adresse précise</label> <input type="text" name="adresse" class="form-control" placeholder="Ex: Avenue de la Liberté, Bonamoussadi" value="<?= e($_POST['adresse'] ?? '') ?>"> </div> <div class="col-md-6"> <label class="form-label fw-semibold">Latitude GPS</label> <input type="text" name="latitude" class="form-control" placeholder="Ex: 4.0511" value="<?= e($_POST['latitude'] ?? '') ?>"> </div> <div class="col-md-6"> <label class="form-label fw-semibold">Longitude GPS</label> <input type="text" name="longitude" class="form-control" placeholder="Ex: 9.7679" value="<?= e($_POST['longitude'] ?? '') ?>"> </div> <div class="col-12"> <div class="form-check form-switch"> <input class="form-check-input" type="checkbox" name="visible_public" id="visible_public" <?= ($_POST['visible_public'] ?? '1') ? 'checked' : '' ?>> <label class="form-check-label" for="visible_public">Visible sur le portail citoyen</label> </div> </div> </div> </div> </div> <!-- FINANCIER --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-success text-white"><h5 class="mb-0"><i class="bi bi-cash-stack me-2"></i> Informations financières</h5></div> <div class="card-body"> <div class="row g-3"> <div class="col-md-6"> <label class="form-label fw-semibold">Budget total (FCFA) *</label> <input type="number" name="budget_initial" class="form-control" placeholder="Ex: 50000000" min="1" value="<?= e($_POST['budget_initial'] ?? '') ?>" required> </div> <div class="col-md-6"> <label class="form-label fw-semibold">Budget déjà utilisé (FCFA)</label> <input type="number" name="budget_deja_utilise" class="form-control" placeholder="0" min="0" value="<?= e($_POST['budget_deja_utilise'] ?? '0') ?>"> <div class="form-text">Montant engagé avant le démarrage officiel</div> </div> <div class="col-12"> <label class="form-label fw-semibold">Source de financement</label> <input type="text" name="source_financement" class="form-control" placeholder="Ex: Budget communal, BID, État, Partenaires internationaux..." value="<?= e($_POST['source_financement'] ?? '') ?>"> </div> </div> </div> </div> <!-- PLANNING --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-info text-white"><h5 class="mb-0"><i class="bi bi-calendar-range me-2"></i> Planning du projet</h5></div> <div class="card-body"> <div class="row g-3"> <div class="col-md-6"> <label class="form-label fw-semibold">Date de début *</label> <input type="date" name="date_debut" id="date_debut" class="form-control" value="<?= e($_POST['date_debut'] ?? '') ?>" required> </div> <div class="col-md-6"> <label class="form-label fw-semibold">Date de fin prévue *</label> <input type="date" name="date_fin_prevue" id="date_fin_prevue" class="form-control" value="<?= e($_POST['date_fin_prevue'] ?? '') ?>" required> </div> <div class="col-12"> <div class="alert alert-light border mb-0" id="dureeEstimee" style="display:none;"> <i class="bi bi-clock me-2 text-info"></i>Durée estimée : <strong id="dureeTexte"></strong> </div> </div> </div> </div> </div> <!-- SUIVI --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-warning text-dark"><h5 class="mb-0"><i class="bi bi-graph-up me-2"></i> Suivi d'avancement</h5></div> <div class="card-body"> <div class="row g-3"> <div class="col-md-4"> <label class="form-label fw-semibold">Statut</label> <select name="statut" class="form-select"> <?php foreach (['planifié','en_cours','suspendu','terminé','annulé'] as $s): ?> <option value="<?= $s ?>" <?= ($_POST['statut'] ?? 'planifié') === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option> <?php endforeach; ?> </select> </div> <div class="col-md-4"> <label class="form-label fw-semibold">Priorité</label> <select name="priorite" class="form-select"> <?php foreach (['basse'=>'Basse','normale'=>'Normale','haute'=>'Haute','critique'=>'Critique'] as $pv=>$pl): ?> <option value="<?= $pv ?>" <?= ($_POST['priorite'] ?? 'normale') === $pv ? 'selected' : '' ?>><?= $pl ?></option> <?php endforeach; ?> </select> </div> <div class="col-md-4"> <label class="form-label fw-semibold">Avancement : <span id="pctLabel"><?= (int)($_POST['avancement_physique'] ?? 0) ?></span>%</label> <input type="range" name="avancement_physique" class="form-range" min="0" max="100" step="5"
 value="<?= (int)($_POST['avancement_physique'] ?? 0) ?>"
 oninput="document.getElementById('pctLabel').textContent=this.value"> </div> </div> </div> </div> <!-- PHASES --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header text-white d-flex justify-content-between align-items-center" style="background:#6f42c1;"> <h5 class="mb-0"><i class="bi bi-layers me-2"></i> Phases du projet</h5> <button type="button" class="btn btn-sm btn-light" onclick="ajouterPhase()"><i class="bi bi-plus-circle me-1"></i>Ajouter</button> </div> <div class="card-body"> <div id="phasesContainer"> <?php
 $phases_defaut = [['Études techniques','non_commencé',0,''],['Terrassement','non_commencé',0,''],['Revêtement','non_commencé',0,''],['Signalisation','non_commencé',0,'']];
 $ph_list = !empty($_POST['phase_titre']) ? array_map(null, $_POST['phase_titre'], $_POST['phase_statut']??[], $_POST['phase_pct']??[], $_POST['phase_date_prevue']??[]) : $phases_defaut;
 foreach ($ph_list as $idx => $ph): ?> <div class="phase-ligne d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded"> <i class="bi bi-grip-vertical text-muted"></i> <input type="text" name="phase_titre[]" class="form-control form-control-sm flex-grow-1" placeholder="Nom de la phase" value="<?= e($ph[0]??'') ?>"> <select name="phase_statut[]" class="form-select form-select-sm" style="width:145px;"> <?php foreach (['non_commencé'=>'Non commencé','en_cours'=>'En cours','réalisé'=>'Réalisé','en_retard'=>'Retard'] as $sv=>$sl): ?> <option value="<?= $sv ?>" <?= ($ph[1]??'non_commencé')===$sv?'selected':'' ?>><?= $sl ?></option> <?php endforeach; ?> </select> <div class="d-flex align-items-center gap-1"> <input type="number" name="phase_pct[]" class="form-control form-control-sm" min="0" max="100" placeholder="%" value="<?= (int)($ph[2]??0) ?>" style="width:65px;"> <span class="text-muted small">%</span> </div> <input type="date" name="phase_date_prevue[]" class="form-control form-control-sm" value="<?= e($ph[3]??'') ?>" style="width:145px;"> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.phase-ligne').remove()"><i class="bi bi-trash"></i></button> </div> <?php endforeach; ?> </div> <div class="form-text mt-2"><i class="bi bi-info-circle me-1"></i>Les phases sont enregistrées comme jalons du projet.</div> </div> </div> <!-- CONSIGNES --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-secondary text-white"><h5 class="mb-0"><i class="bi bi-journal-text me-2"></i> Premières consignes</h5></div> <div class="card-body"> <textarea name="consignes" class="form-control" rows="4" placeholder="Ex: Lancer les travaux en respectant les normes techniques en vigueur, assurer un suivi rigoureux du chantier..."><?= e($_POST['consignes'] ?? '') ?></textarea> <div class="form-text">Instructions initiales pour l'équipe et l'entreprise exécutante.</div> </div> </div> <!-- RISQUES --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center"> <h5 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i> Risques identifiés</h5> <button type="button" class="btn btn-sm btn-light" onclick="ajouterRisque()"><i class="bi bi-plus-circle me-1"></i>Ajouter</button> </div> <div class="card-body"> <div id="risquesContainer"> <?php
 $risques_defaut = [['Retard dû aux conditions météorologiques','moyen'],['Dépassement de budget','élevé'],['Perturbation du trafic','faible']];
 $rq_list = !empty($_POST['risque_desc']) ? array_map(null,$_POST['risque_desc'],$_POST['risque_niveau']??[]) : $risques_defaut;
 foreach ($rq_list as $rq): ?> <div class="risque-ligne d-flex align-items-center gap-2 mb-2"> <input type="text" name="risque_desc[]" class="form-control form-control-sm flex-grow-1" placeholder="Description du risque" value="<?= e($rq[0]??'') ?>"> <select name="risque_niveau[]" class="form-select form-select-sm" style="width:135px;"> <?php foreach (['faible'=>'Faible','moyen'=>'Moyen','élevé'=>'Élevé','critique'=>'Critique'] as $rv=>$rl): ?> <option value="<?= $rv ?>" <?= ($rq[1]??'moyen')===$rv?'selected':'' ?>><?= $rl ?></option> <?php endforeach; ?> </select> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.risque-ligne').remove()"><i class="bi bi-trash"></i></button> </div> <?php endforeach; ?> </div> </div> </div> <!-- KPIs --> <div class="card mb-4 border-0 shadow-sm"> <div class="card-header text-white d-flex justify-content-between align-items-center" style="background:#0d6efd;"> <h5 class="mb-0"><i class="bi bi-bar-chart-line me-2"></i> Indicateurs de performance (KPIs)</h5> <button type="button" class="btn btn-sm btn-light" onclick="ajouterKPI()"><i class="bi bi-plus-circle me-1"></i>Ajouter</button> </div> <div class="card-body"> <div id="kpisContainer"> <?php
 $kpis_defaut = [['Respect du délai','100%'],['Respect du budget','100%'],['Qualité des travaux après livraison','Conforme aux normes'],['Fluidité du trafic pendant travaux','< 20% de perturbation']];
 $kp_list = !empty($_POST['kpi_libelle']) ? array_map(null,$_POST['kpi_libelle'],$_POST['kpi_cible']??[]) : $kpis_defaut;
 foreach ($kp_list as $kp): ?> <div class="kpi-ligne d-flex align-items-center gap-2 mb-2"> <input type="text" name="kpi_libelle[]" class="form-control form-control-sm flex-grow-1" placeholder="Indicateur" value="<?= e($kp[0]??'') ?>"> <input type="text" name="kpi_cible[]" class="form-control form-control-sm" placeholder="Valeur cible" value="<?= e($kp[1]??'') ?>" style="width:185px;"> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.kpi-ligne').remove()"><i class="bi bi-trash"></i></button> </div> <?php endforeach; ?> </div> <div class="form-text mt-2"><i class="bi bi-info-circle me-1"></i>Critères de succès mesurables du projet.</div> </div> </div> </div><!-- /col-lg-8 --> <!-- COLONNE LATÉRALE --> <div class="col-lg-4"> <div class="card border-0 shadow-sm sticky-top" style="top:20px;"> <div class="card-header bg-dark text-white"><h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>‍ Gestion du projet</h5></div> <div class="card-body"> <div class="mb-3"> <label class="form-label fw-semibold small text-muted text-uppercase">Responsable</label> <div class="d-flex align-items-center p-2 bg-light rounded"> <i class="bi bi-person-circle fs-4 me-2 text-primary"></i> <div> <div class="fw-bold"><?= e($_SESSION['utilisateur_prenom'] . ' ' . $_SESSION['utilisateur_nom']) ?></div> <small class="text-muted"><?= e($_SESSION['role_nom'] ?? '') ?></small> </div> </div> </div> <div class="mb-3"> <label class="form-label fw-semibold">Entreprise exécutante</label> <input type="text" name="entreprise_executante" class="form-control" placeholder="Ex: BTP Cameroun SARL" value="<?= e($_POST['entreprise_executante'] ?? '') ?>"> </div> <hr> <div class="d-grid gap-2"> <button type="submit" class="btn btn-primary btn-lg"><i class="bi bi-check-circle me-2"></i>Créer le projet</button> <a href="<?= SITE_URL ?>/projets/liste.php" class="btn btn-outline-secondary"><i class="bi bi-x-circle me-2"></i>Annuler</a> </div> <div class="alert alert-warning mt-3 mb-0"> <small><i class="bi bi-info-circle me-1"></i>Les champs * sont obligatoires</small> </div> </div> </div> </div> </div><!-- /row --> </form>
</div> <script>
document.getElementById('date_debut').addEventListener('change', calculerDuree);
document.getElementById('date_fin_prevue').addEventListener('change', calculerDuree);
function calculerDuree() {
 const d1 = document.getElementById('date_debut').value;
 const d2 = document.getElementById('date_fin_prevue').value;
 const el = document.getElementById('dureeEstimee');
 if (d1 && d2) {
 const j = Math.round((new Date(d2) - new Date(d1)) / 86400000);
 if (j > 0) {
 const m = Math.floor(j/30), r = j%30;
 document.getElementById('dureeTexte').textContent = j + ' jours' + (m > 0 ? ` (${m} mois${r>0?' et '+r+' jours':''})` : '');
 el.style.display = '';
 } else { el.style.display = 'none'; }
 }
}
function ajouterPhase() {
 const c = document.getElementById('phasesContainer');
 const d = document.createElement('div');
 d.className = 'phase-ligne d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded';
 d.innerHTML = `<i class="bi bi-grip-vertical text-muted"></i> <input type="text" name="phase_titre[]" class="form-control form-control-sm flex-grow-1" placeholder="Nom de la phase"> <select name="phase_statut[]" class="form-select form-select-sm" style="width:145px;"> <option value="non_commencé">Non commencé</option><option value="en_cours">En cours</option> <option value="réalisé">Réalisé</option><option value="en_retard">Retard</option> </select> <div class="d-flex align-items-center gap-1"> <input type="number" name="phase_pct[]" class="form-control form-control-sm" min="0" max="100" placeholder="%" style="width:65px;"> <span class="text-muted small">%</span> </div> <input type="date" name="phase_date_prevue[]" class="form-control form-control-sm" style="width:145px;"> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.phase-ligne').remove()"><i class="bi bi-trash"></i></button>`;
 c.appendChild(d);
}
function ajouterRisque() {
 const c = document.getElementById('risquesContainer');
 const d = document.createElement('div');
 d.className = 'risque-ligne d-flex align-items-center gap-2 mb-2';
 d.innerHTML = `<input type="text" name="risque_desc[]" class="form-control form-control-sm flex-grow-1" placeholder="Description du risque"> <select name="risque_niveau[]" class="form-select form-select-sm" style="width:135px;"> <option value="faible">Faible</option><option value="moyen" selected>Moyen</option> <option value="élevé">Élevé</option><option value="critique">Critique</option> </select> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.risque-ligne').remove()"><i class="bi bi-trash"></i></button>`;
 c.appendChild(d);
}
function ajouterKPI() {
 const c = document.getElementById('kpisContainer');
 const d = document.createElement('div');
 d.className = 'kpi-ligne d-flex align-items-center gap-2 mb-2';
 d.innerHTML = `<input type="text" name="kpi_libelle[]" class="form-control form-control-sm flex-grow-1" placeholder="Indicateur"> <input type="text" name="kpi_cible[]" class="form-control form-control-sm" placeholder="Valeur cible" style="width:185px;"> <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.kpi-ligne').remove()"><i class="bi bi-trash"></i></button>`;
 c.appendChild(d);
}
</script> <?php require_once '../includes/footer.php'; ?>
