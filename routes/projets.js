const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool, query, queryOne } = require('../db');
const config = require('../config');
const { requireConnexion, requireRole, requireAdmin } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { parseMontantInput, peutFaire } = require('../lib/helpers');
const { loadProjetForPdf, streamRapport } = require('../lib/rapportPdf');

const router = express.Router();

router.use(requireConnexion);

function gestionnaireOnly(req, res, next) {
  if (!peutFaire(req.session, 'gestionnaire')) {
    setFlash(req, 'danger', 'Accès refusé.');
    return res.redirect('/projets/liste');
  }
  next();
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `projet_${req.params.id || req.body.projet_id || '0'}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const uploadPhotos = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error('Type de fichier non autorisé'), ok);
  },
});

function defaultPhases() {
  return [
    ['Études techniques', 'non_commencé', 0, ''],
    ['Terrassement', 'non_commencé', 0, ''],
    ['Revêtement', 'non_commencé', 0, ''],
    ['Signalisation', 'non_commencé', 0, ''],
  ];
}

function defaultRisques() {
  return [
    ['Retard dû aux conditions météorologiques', 'moyen'],
    ['Dépassement de budget', 'élevé'],
    ['Perturbation du trafic', 'faible'],
  ];
}

function defaultKpis() {
  return [
    ['Respect du délai', '100%'],
    ['Respect du budget', '100%'],
    ['Qualité des travaux après livraison', 'Conforme aux normes'],
    ['Fluidité du trafic pendant travaux', '< 20% de perturbation'],
  ];
}

function buildPhaseList(body) {
  const titres = body['phase_titre[]'] || body.phase_titre || [];
  const arr = Array.isArray(titres) ? titres : [titres];
  if (!arr.length || (arr.length === 1 && !arr[0])) return defaultPhases();
  const statuts = [].concat(body['phase_statut[]'] || body.phase_statut || []);
  const pcts = [].concat(body['phase_pct[]'] || body.phase_pct || []);
  const dates = [].concat(body['phase_date_prevue[]'] || body.phase_date_prevue || []);
  return arr.map((t, i) => [t, statuts[i] || 'non_commencé', pcts[i] || 0, dates[i] || '']);
}

function buildRisqueList(body) {
  const descs = body['risque_desc[]'] || body.risque_desc || [];
  const arr = Array.isArray(descs) ? descs : [descs];
  if (!arr.length || (arr.length === 1 && !arr[0])) return defaultRisques();
  const niveaux = [].concat(body['risque_niveau[]'] || body.risque_niveau || []);
  return arr.map((d, i) => [d, niveaux[i] || 'moyen']);
}

function buildKpiList(body) {
  const libs = body['kpi_libelle[]'] || body.kpi_libelle || [];
  const arr = Array.isArray(libs) ? libs : [libs];
  if (!arr.length || (arr.length === 1 && !arr[0])) return defaultKpis();
  const cibles = [].concat(body['kpi_cible[]'] || body.kpi_cible || []);
  return arr.map((l, i) => [l, cibles[i] || '']);
}

async function insertPhasesRisquesKpis(conn, projetId, body, dateFin) {
  const phases = buildPhaseList(body);
  for (let i = 0; i < phases.length; i++) {
    const [titre, statut, pct, datePrev] = phases[i];
    if (!String(titre || '').trim()) continue;
    await conn.execute(
      `INSERT INTO jalons (projet_id, titre, date_prevue, statut, pourcentage_completion, ordre)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        projetId,
        String(titre).trim(),
        datePrev || dateFin,
        statut || 'non_commencé',
        parseInt(pct, 10) || 0,
        i + 1,
      ]
    );
  }
  const risques = buildRisqueList(body);
  for (let i = 0; i < risques.length; i++) {
    const [desc, niveau] = risques[i];
    if (!String(desc || '').trim()) continue;
    await conn.execute(
      'INSERT INTO risques (projet_id, description, niveau, ordre) VALUES (?, ?, ?, ?)',
      [projetId, String(desc).trim(), niveau || 'moyen', i + 1]
    );
  }
  const kpis = buildKpiList(body);
  for (let i = 0; i < kpis.length; i++) {
    const [lib, cible] = kpis[i];
    if (!String(lib || '').trim()) continue;
    await conn.execute(
      'INSERT INTO indicateurs (projet_id, libelle, valeur_cible, ordre) VALUES (?, ?, ?, ?)',
      [projetId, String(lib).trim(), String(cible || '').trim(), i + 1]
    );
  }
}

router.get('/liste', async (req, res, next) => {
  try {
    const filtre_statut = req.query.statut || '';
    const filtre_commune = req.query.commune || '';
    const search = req.query.search || '';

    const where = ['1=1'];
    const params = [];
    if (filtre_statut) {
      where.push('p.statut = ?');
      params.push(filtre_statut);
    }
    if (filtre_commune) {
      where.push('p.commune_id = ?');
      params.push(filtre_commune);
    }
    if (search) {
      where.push('(p.titre LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const projets = await query(
      `SELECT p.*, c.nom AS commune_nom, tp.nom AS type_nom, tp.couleur,
              CONCAT(u.prenom, ' ', u.nom) AS responsable_nom
       FROM projets p
       JOIN communes c ON p.commune_id = c.id
       JOIN types_projets tp ON p.type_projet_id = tp.id
       JOIN utilisateurs u ON p.responsable_id = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC`,
      params
    );

    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');

    res.render('projets/liste', {
      page_title: 'Liste des projets',
      projets,
      communes,
      filtre_statut,
      filtre_commune,
      search,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/creer', gestionnaireOnly, async (req, res, next) => {
  try {
    const types_projets = await query('SELECT * FROM types_projets ORDER BY nom');
    const communes = await query('SELECT * FROM communes ORDER BY nom');
    res.render('projets/creer', {
      page_title: 'Créer un projet',
      types_projets,
      communes,
      erreurs: [],
      body: {},
      phases_list: defaultPhases(),
      risques_list: defaultRisques(),
      kpis_list: defaultKpis(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/creer', gestionnaireOnly, async (req, res, next) => {
  const body = req.body;
  const erreurs = [];
  const titre = (body.titre || '').trim();
  const type_projet_id = parseInt(body.type_projet_id, 10) || 0;
  const commune_id = parseInt(body.commune_id, 10) || 0;
  const budget_initial = parseMontantInput(body.budget_initial);
  const date_debut = body.date_debut || '';
  const date_fin_prevue = body.date_fin_prevue || '';

  if (!titre) erreurs.push('Le titre est requis');
  if (!type_projet_id) erreurs.push('Le type de projet est requis');
  if (!commune_id) erreurs.push('La commune est requise');
  if (!budget_initial || budget_initial <= 0)
    erreurs.push('Le budget doit être un nombre valide supérieur à 0');
  if (!date_debut) erreurs.push('La date de début est requise');
  if (!date_fin_prevue) erreurs.push('La date de fin prévue est requise');
  if (date_debut && date_fin_prevue && date_fin_prevue <= date_debut)
    erreurs.push('La date de fin prévue doit être postérieure à la date de début');

  const renderForm = async () => {
    const types_projets = await query('SELECT * FROM types_projets ORDER BY nom');
    const communes = await query('SELECT * FROM communes ORDER BY nom');
    res.render('projets/creer', {
      page_title: 'Créer un projet',
      types_projets,
      communes,
      erreurs,
      body,
      phases_list: buildPhaseList(body),
      risques_list: buildRisqueList(body),
      kpis_list: buildKpiList(body),
    });
  };

  if (erreurs.length) return renderForm();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pgSql = `INSERT INTO projets (
        titre, description, consignes, type_projet_id, commune_id, responsable_id,
        entreprise_executante, budget_initial, budget_actuel, budget_deja_utilise,
        date_debut, date_fin_prevue, statut, priorite, avancement_physique,
        latitude, longitude, adresse, visible_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`;
      
    const result = await client.query(pgSql, [
        titre,
        (body.description || '').trim() || null,
        (body.consignes || '').trim() || null,
        type_projet_id,
        commune_id,
        req.session.utilisateur_id,
        (body.entreprise_executante || '').trim() || null,
        budget_initial,
        budget_initial,
        parseMontantInput(body.budget_deja_utilise),
        date_debut,
        date_fin_prevue,
        body.statut || 'planifié',
        body.priorite || 'normale',
        parseInt(body.avancement_physique, 10) || 0,
        body.latitude || null,
        body.longitude || null,
        (body.adresse || '').trim() || null,
        body.visible_public ? true : false,
      ]);
      
    const projet_id = result.rows[0].id;

    const source = (body.source_financement || '').trim();
    if (source) {
      await client.query(
        'INSERT INTO budgets (projet_id, montant_initial, source_financement, exercice_budgetaire) VALUES ($1, $2, $3, $4)',
        [projet_id, budget_initial, source, new Date().getFullYear()]
      );
    }

    // Phases, risques, KPIs
    const phases = buildPhaseList(body);
    for (let i = 0; i < phases.length; i++) {
      const [pTitre, pStatut, pPct, pDatePrev] = phases[i];
      if (!String(pTitre || '').trim()) continue;
      await client.query(
        `INSERT INTO jalons (projet_id, titre, date_prevue, statut, pourcentage_completion, ordre)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projet_id, String(pTitre).trim(), pDatePrev || date_fin_prevue, pStatut || 'non_commencé', parseInt(pPct, 10) || 0, i + 1]
      );
    }
    const risques = buildRisqueList(body);
    for (let i = 0; i < risques.length; i++) {
      const [desc, niveau] = risques[i];
      if (!String(desc || '').trim()) continue;
      await client.query(
        'INSERT INTO risques (projet_id, description, niveau, ordre) VALUES ($1, $2, $3, $4)',
        [projet_id, String(desc).trim(), niveau || 'moyen', i + 1]
      );
    }
    const kpis = buildKpiList(body);
    for (let i = 0; i < kpis.length; i++) {
      const [lib, cible] = kpis[i];
      if (!String(lib || '').trim()) continue;
      await client.query(
        'INSERT INTO indicateurs (projet_id, libelle, valeur_cible, ordre) VALUES ($1, $2, $3, $4)',
        [projet_id, String(lib).trim(), String(cible || '').trim(), i + 1]
      );
    }

    await client.query('COMMIT');
    setFlash(req, 'success', `Projet « ${titre} » créé avec succès !`);
    res.redirect(`/projets/details/${projet_id}`);
  } catch (err) {
    await client.query('ROLLBACK');
    erreurs.push(`Erreur : ${err.message}`);
    await renderForm();
  } finally {
    client.release();
  }
});

router.get('/details/:id', async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne(
      `SELECT p.*, c.nom AS commune_nom, r.nom AS region_nom,
              tp.nom AS type_nom, tp.couleur AS type_couleur, tp.icone AS type_icone,
              CONCAT(u.prenom, ' ', u.nom) AS responsable_nom, u.email AS responsable_email
       FROM projets p
       JOIN communes c ON p.commune_id = c.id
       LEFT JOIN regions r ON c.region_id = r.id
       JOIN types_projets tp ON p.type_projet_id = tp.id
       JOIN utilisateurs u ON p.responsable_id = u.id
       WHERE p.id = ?`,
      [projet_id]
    );

    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable');
      return res.redirect('/projets/liste');
    }

    const depRow = await queryOne(
      'SELECT COALESCE(SUM(montant), 0) AS s FROM depenses WHERE projet_id = ? AND validee = true',
      [projet_id]
    );
    const depenses = Number(depRow.s);
    const taux_consommation =
      projet.budget_actuel > 0 ? (depenses / projet.budget_actuel) * 100 : 0;
    const budget_restant = projet.budget_actuel - depenses;

    const debut = new Date(projet.date_debut);
    const fin = new Date(projet.date_fin_prevue);
    const now = new Date();
    const jours_ecoules = Math.max(
      0,
      Math.round((now - debut) / 86400000)
    );
    const duree_totale = Math.max(1, Math.round((fin - debut) / 86400000));
    const pourcentage_temps = (jours_ecoules / duree_totale) * 100;
    const jours_restants_val = require('../lib/helpers').joursRestants(
      projet.date_fin_prevue
    );

    const liste_avancements = await query(
      `SELECT a.*, CONCAT(u.prenom, ' ', u.nom) AS auteur
       FROM avancements a
       JOIN utilisateurs u ON a.utilisateur_id = u.id
       WHERE a.projet_id = ?
       ORDER BY a.date_constat DESC
       LIMIT 5`,
      [projet_id]
    );

    const liste_photos = await query(
      `SELECT p.*, CONCAT(u.prenom, ' ', u.nom) AS upload_par_nom
       FROM photos p
       JOIN utilisateurs u ON p.uploaded_by = u.id
       WHERE p.projet_id = ?
       ORDER BY p.date_upload DESC
       LIMIT 6`,
      [projet_id]
    );

    res.render('projets/details', {
      page_title: 'Détails du projet',
      projet,
      projet_id,
      depenses,
      taux_consommation,
      budget_restant,
      jours_ecoules,
      duree_totale,
      pourcentage_temps,
      jours_restants: jours_restants_val,
      liste_avancements,
      liste_photos,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/details/:id', async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    if (req.body.action !== 'update_avancement') {
      return res.redirect(`/projets/details/${projet_id}`);
    }

    const pourcentage = parseInt(req.body.pourcentage, 10) || 0;
    const description = (req.body.description || '').trim();
    const observations = (req.body.observations || '').trim();
    const date_constat = req.body.date_constat || new Date().toISOString().slice(0, 10);

    if (pourcentage < 0 || pourcentage > 100) {
      setFlash(req, 'danger', 'Le pourcentage doit être entre 0 et 100.');
    } else {
      await query(
        `INSERT INTO avancements (projet_id, utilisateur_id, pourcentage, description, observations, date_constat)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          projet_id,
          req.session.utilisateur_id,
          pourcentage,
          description || null,
          observations || null,
          date_constat,
        ]
      );
      await query(
        'UPDATE projets SET avancement_physique = ?, updated_at = NOW() WHERE id = ?',
        [pourcentage, projet_id]
      );
      setFlash(req, 'success', `Avancement mis à jour à ${pourcentage}% !`);
    }
    res.redirect(`/projets/details/${projet_id}`);
  } catch (err) {
    next(err);
  }
});

router.get('/modifier/:id', gestionnaireOnly, async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne('SELECT * FROM projets WHERE id = ?', [projet_id]);
    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable.');
      return res.redirect('/projets/liste');
    }

    const phases_bdd = await query(
      'SELECT * FROM jalons WHERE projet_id = ? ORDER BY ordre',
      [projet_id]
    );
    const risques_bdd = await query(
      'SELECT * FROM risques WHERE projet_id = ? ORDER BY ordre',
      [projet_id]
    );
    const kpis_bdd = await query(
      'SELECT * FROM indicateurs WHERE projet_id = ? ORDER BY ordre',
      [projet_id]
    );
    const budget_source = await queryOne(
      'SELECT * FROM budgets WHERE projet_id = ? LIMIT 1',
      [projet_id]
    );
    const types_projets = await query('SELECT * FROM types_projets ORDER BY nom');
    const communes = await query('SELECT * FROM communes ORDER BY nom');

    const phases_list =
      phases_bdd.length > 0
        ? phases_bdd.map((p) => [
            p.titre,
            p.statut,
            p.pourcentage_completion,
            p.date_prevue ? String(p.date_prevue).slice(0, 10) : '',
          ])
        : defaultPhases();
    const risques_list =
      risques_bdd.length > 0
        ? risques_bdd.map((r) => [r.description, r.niveau])
        : defaultRisques();
    const kpis_list =
      kpis_bdd.length > 0
        ? kpis_bdd.map((k) => [k.libelle, k.valeur_cible])
        : defaultKpis();

    res.render('projets/modifier', {
      page_title: 'Modifier le projet',
      projet,
      projet_id,
      types_projets,
      communes,
      budget_source,
      erreurs: [],
      body: projet,
      phases_list,
      risques_list,
      kpis_list,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/modifier/:id', gestionnaireOnly, async (req, res, next) => {
  const projet_id = parseInt(req.params.id, 10);
  const body = req.body;
  const erreurs = [];
  const titre = (body.titre || '').trim();
  const type_projet_id = parseInt(body.type_projet_id, 10) || 0;
  const commune_id = parseInt(body.commune_id, 10) || 0;
  const budget_actuel = parseMontantInput(body.budget_actuel);
  const date_debut = body.date_debut || '';
  const date_fin_prevue = body.date_fin_prevue || '';
  const date_fin_reelle = body.date_fin_reelle || null;
  const avancement_physique = parseInt(body.avancement_physique, 10) || 0;

  if (!titre) erreurs.push('Le titre est requis');
  if (!type_projet_id) erreurs.push('Le type de projet est requis');
  if (!commune_id) erreurs.push('La commune est requise');
  if (!budget_actuel || budget_actuel <= 0)
    erreurs.push('Le budget doit être un nombre valide supérieur à 0');
  if (!date_debut) erreurs.push('La date de début est requise');
  if (!date_fin_prevue) erreurs.push('La date de fin prévue est requise');
  if (date_debut && date_fin_prevue && date_fin_prevue <= date_debut)
    erreurs.push('La date de fin prévue doit être postérieure à la date de début');
  if (date_fin_reelle && date_debut && date_fin_reelle < date_debut)
    erreurs.push('La date de fin réelle ne peut pas être antérieure à la date de début');
  if (avancement_physique < 0 || avancement_physique > 100)
    erreurs.push("L'avancement doit être entre 0 et 100");

  const renderForm = async () => {
    const projet = await queryOne('SELECT * FROM projets WHERE id = ?', [projet_id]);
    const types_projets = await query('SELECT * FROM types_projets ORDER BY nom');
    const communes = await query('SELECT * FROM communes ORDER BY nom');
    const budget_source = await queryOne(
      'SELECT * FROM budgets WHERE projet_id = ? LIMIT 1',
      [projet_id]
    );
    res.render('projets/modifier', {
      page_title: 'Modifier le projet',
      projet,
      projet_id,
      types_projets,
      communes,
      budget_source,
      erreurs,
      body: { ...projet, ...body },
      phases_list: buildPhaseList(body),
      risques_list: buildRisqueList(body),
      kpis_list: buildKpiList(body),
    });
  };

  if (erreurs.length) return renderForm();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE projets SET
        titre = ?, description = ?, consignes = ?,
        type_projet_id = ?, commune_id = ?,
        entreprise_executante = ?,
        budget_actuel = ?, budget_deja_utilise = ?,
        date_debut = ?, date_fin_prevue = ?, date_fin_reelle = ?,
        statut = ?, priorite = ?, avancement_physique = ?,
        latitude = ?, longitude = ?, adresse = ?,
        visible_public = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        titre,
        (body.description || '').trim() || null,
        (body.consignes || '').trim() || null,
        type_projet_id,
        commune_id,
        (body.entreprise_executante || '').trim() || null,
        budget_actuel,
        parseMontantInput(body.budget_deja_utilise),
        date_debut,
        date_fin_prevue,
        date_fin_reelle,
        body.statut || 'planifié',
        body.priorite || 'normale',
        avancement_physique,
        body.latitude || null,
        body.longitude || null,
        (body.adresse || '').trim() || null,
        body.visible_public ? 1 : 0,
        projet_id,
      ]
    );

    const source = (body.source_financement || '').trim();
    if (source) {
      const budget_source = await queryOne(
        'SELECT id FROM budgets WHERE projet_id = ? LIMIT 1',
        [projet_id]
      );
      if (budget_source) {
        await conn.execute(
          'UPDATE budgets SET source_financement = ?, montant_initial = ? WHERE projet_id = ?',
          [source, budget_actuel, projet_id]
        );
      } else {
        await conn.execute(
          'INSERT INTO budgets (projet_id, montant_initial, source_financement, exercice_budgetaire) VALUES (?, ?, ?, ?)',
          [projet_id, budget_actuel, source, new Date().getFullYear()]
        );
      }
    }

    await conn.execute('DELETE FROM jalons WHERE projet_id = ?', [projet_id]);
    await conn.execute('DELETE FROM risques WHERE projet_id = ?', [projet_id]);
    await conn.execute('DELETE FROM indicateurs WHERE projet_id = ?', [projet_id]);
    await insertPhasesRisquesKpis(conn, projet_id, body, date_fin_prevue);

    await conn.commit();
    setFlash(req, 'success', 'Projet modifié avec succès !');
    res.redirect(`/projets/details/${projet_id}`);
  } catch (err) {
    await conn.rollback();
    erreurs.push(`Erreur : ${err.message}`);
    await renderForm();
  } finally {
    conn.release();
  }
});

router.get('/supprimer/:id', requireAdmin, async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne('SELECT id, titre FROM projets WHERE id = ?', [
      projet_id,
    ]);
    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable');
      return res.redirect('/projets/liste');
    }
    res.render('projets/supprimer', {
      page_title: 'Supprimer le projet',
      projet,
      projet_id,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/supprimer/:id', requireAdmin, async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    if (!req.body.confirmer) {
      return res.redirect(`/projets/details/${projet_id}`);
    }

    const photos = await query('SELECT fichier_url FROM photos WHERE projet_id = ?', [
      projet_id,
    ]);
    for (const photo of photos) {
      const fp = path.join(config.uploadsDir, photo.fichier_url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    const projet = await queryOne('SELECT titre FROM projets WHERE id = ?', [projet_id]);
    await query('DELETE FROM projets WHERE id = ?', [projet_id]);
    setFlash(req, 'success', `Le projet "${projet.titre}" a été supprimé avec succès.`);
    res.redirect('/projets/liste');
  } catch (err) {
    setFlash(req, 'danger', `Erreur lors de la suppression : ${err.message}`);
    res.redirect(`/projets/details/${req.params.id}`);
  }
});

router.get('/upload-photos/:id', gestionnaireOnly, async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne('SELECT id, titre FROM projets WHERE id = ?', [
      projet_id,
    ]);
    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable');
      return res.redirect('/projets/liste');
    }
    res.render('projets/upload-photos', {
      page_title: 'Ajouter des photos',
      projet,
      projet_id,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/upload-photos/:id',
  gestionnaireOnly,
  uploadPhotos.array('photos', 20),
  async (req, res, next) => {
    try {
      const projet_id = parseInt(req.params.id, 10);
      const files = req.files || [];
      const legendes = [].concat(req.body.legendes || []);
      const dates_prise = [].concat(req.body.dates_prise || []);
      const errors = [];
      let uploaded_count = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          await query(
            `INSERT INTO photos (
              projet_id, fichier_url, fichier_nom, taille, legende,
              date_prise, uploaded_by, date_upload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              projet_id,
              file.filename,
              file.originalname,
              file.size,
              legendes[i] || '',
              dates_prise[i] || new Date().toISOString().slice(0, 10),
              req.session.utilisateur_id,
            ]
          );
          uploaded_count++;
        } catch (e) {
          errors.push(`Erreur pour ${file.originalname}`);
        }
      }

      if (uploaded_count > 0 && errors.length === 0) {
        setFlash(req, 'success', `${uploaded_count} photo(s) ajoutée(s) avec succès !`);
      } else if (uploaded_count > 0) {
        setFlash(
          req,
          'warning',
          `${uploaded_count} photo(s) ajoutée(s). Problème sur ${errors.length} fichier(s).`
        );
      } else if (errors.length) {
        setFlash(req, 'danger', `Aucune photo uploadée. ${errors.join(' — ')}`);
      } else {
        setFlash(req, 'warning', 'Aucun fichier reçu.');
      }

      res.redirect(`/projets/details/${projet_id}`);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/rapports/:id', async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne('SELECT id, titre FROM projets WHERE id = ?', [
      projet_id,
    ]);
    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable');
      return res.redirect('/projets/liste');
    }
    res.render('projets/rapports', {
      page_title: 'Générer un rapport',
      projet,
      projet_id,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/generer-rapport/:id', async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const type = req.query.type || 'complet';
    const projet = await loadProjetForPdf(projet_id);
    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable');
      return res.redirect('/projets/liste');
    }
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const names = {
      financier: `rapport_financier_${projet_id}_${dateStr}.pdf`,
      avancement: `rapport_avancement_${projet_id}_${dateStr}.pdf`,
      complet: `rapport_complet_${projet_id}_${dateStr}.pdf`,
    };
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${names[type] || names.complet}"`
    );
    await streamRapport(res, projet, type);
  } catch (err) {
    console.error(err);
    setFlash(req, 'danger', `Erreur lors de la génération du rapport : ${err.message}`);
    res.redirect(`/projets/details/${req.params.id}`);
  }
});

module.exports = router;
