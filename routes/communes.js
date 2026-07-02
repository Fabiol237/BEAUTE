const express = require('express');
const { query, queryOne } = require('../db');
const { requireConnexion } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAction } = require('../middleware/journal');
const router = express.Router();

router.use(requireConnexion, (req, res, next) => {
  if (req.session.utilisateur_role !== 'super_admin') {
    return res.status(403).send('Accès interdit');
  }
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const { statut, region, search } = req.query;
    
    // We get all regions for the filter dropdown
    const allCommunes = await query('SELECT DISTINCT region FROM communes WHERE region IS NOT NULL ORDER BY region');
    const regions = allCommunes.map(c => c.region);

    let sql = `
      SELECT c.*,
        COUNT(DISTINCT p.id) AS total_projets,
        SUM(CASE WHEN p.statut = 'en_cours' THEN 1 ELSE 0 END) AS en_cours,
        SUM(CASE WHEN p.statut = 'terminé' THEN 1 ELSE 0 END) AS termines,
        SUM(CASE WHEN p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE THEN 1 ELSE 0 END) AS en_retard,
        COALESCE(SUM(p.budget_actuel), 0) AS budget_total,
        COALESCE(AVG(p.avancement_physique), 0) AS taux_avancement
      FROM communes c
      LEFT JOIN projets p ON c.id = p.commune_id
    `;
    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (statut) {
      conditions.push(`c.statut = $${pIdx++}`);
      params.push(statut);
    }
    if (region) {
      conditions.push(`c.region = $${pIdx++}`);
      params.push(region);
    }
    if (search) {
      conditions.push(`c.nom ILIKE $${pIdx++}`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY c.id ORDER BY c.nom ASC';

    const rawCommunes = await query(sql, params);
    const communes = rawCommunes.map(c => ({
      ...c,
      total_projets: Number(c.total_projets) || 0,
      en_cours: Number(c.en_cours) || 0,
      termines: Number(c.termines) || 0,
      en_retard: Number(c.en_retard) || 0,
      budget_total: Number(c.budget_total) || 0,
      taux_avancement: Math.round(Number(c.taux_avancement) || 0)
    }));

    res.render('super-admin/communes/liste', {
      page_title: 'Gestion des Communes',
      communes,
      regions,
      filtre: { statut, region, search }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/creer', (req, res) => {
  res.render('super-admin/communes/creer', {
    page_title: 'Créer une commune',
    error: null,
    body: {}
  });
});

router.post('/creer', async (req, res, next) => {
  const { nom, region, email, telephone, responsable } = req.body;
  if (!nom || !email) {
    return res.render('super-admin/communes/creer', {
      page_title: 'Créer une commune',
      error: 'Nom et email requis.',
      body: req.body
    });
  }
  try {
    await query(`
      INSERT INTO communes (nom, region, email, telephone, responsable, statut)
      VALUES ($1, $2, $3, $4, $5, 'inactif')
    `, [nom, region || 'Littoral', email, telephone || '', responsable || '']);

    res.redirect('/communes');
  } catch (err) {
    console.error(err);
    const errorMsg = 'Erreur lors de la création de la commune (le nom ou l\'email existe déjà).';
    res.render('super-admin/communes/creer', {
      page_title: 'Créer une commune',
      error: errorMsg,
      body: req.body
    });
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const commune = await queryOne(`
      SELECT c.*,
        COUNT(DISTINCT p.id) AS total_projets,
        SUM(CASE WHEN p.statut = 'en_cours' THEN 1 ELSE 0 END) AS en_cours,
        SUM(CASE WHEN p.statut = 'terminé' THEN 1 ELSE 0 END) AS termines,
        SUM(CASE WHEN p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE THEN 1 ELSE 0 END) AS en_retard,
        COALESCE(SUM(p.budget_actuel), 0) AS budget_total,
        COALESCE(AVG(p.avancement_physique), 0) AS taux_avancement
      FROM communes c
      LEFT JOIN projets p ON c.id = p.commune_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [req.params.id]);

    if (!commune) {
      return res.redirect('/communes');
    }

    commune.total_projets = Number(commune.total_projets) || 0;
    commune.en_cours = Number(commune.en_cours) || 0;
    commune.termines = Number(commune.termines) || 0;
    commune.en_retard = Number(commune.en_retard) || 0;
    commune.budget_total = Number(commune.budget_total) || 0;
    commune.taux_avancement = Math.round(Number(commune.taux_avancement) || 0);

    commune.projets = await query(`
      SELECT p.*, tp.nom AS type_nom
      FROM projets p
      LEFT JOIN types_projets tp ON p.type_projet_id = tp.id
      WHERE p.commune_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.id]);

    res.render('super-admin/communes/details', {
      page_title: `Commune — ${commune.nom}`,
      commune
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/toggle', async (req, res, next) => {
  try {
    const commune = await queryOne('SELECT statut FROM communes WHERE id = $1', [req.params.id]);
    if (!commune) return res.redirect('/communes');
    
    const newStatut = commune.statut === 'actif' ? 'suspendu' : 'actif';
    await query('UPDATE communes SET statut = $1 WHERE id = $2', [newStatut, req.params.id]);
    
    res.redirect(`/communes/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

async function deleteCommune(req, res, next) {
  try {
    const commune = await queryOne('SELECT id, nom FROM communes WHERE id = $1', [req.params.id]);
    if (!commune) {
      setFlash(req, 'danger', 'Commune introuvable.');
      return res.redirect('/communes');
    }

    // Nettoyage explicite avant la suppression de la commune.
    // Certaines tables ont des contraintes qui peuvent échouer si les suppressions
    // sont laissées uniquement aux cascades automatiques.
    await query(`
      DELETE FROM avancements
      WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)
         OR utilisateur_id IN (SELECT id FROM utilisateurs WHERE commune_id = $1)
    `, [req.params.id]);
    await query('DELETE FROM depenses WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)', [req.params.id]);
    await query('DELETE FROM photos WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)', [req.params.id]);
    await query('DELETE FROM jalons WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)', [req.params.id]);
    await query('DELETE FROM risques WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)', [req.params.id]);
    await query('DELETE FROM indicateurs WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)', [req.params.id]);

    await query('DELETE FROM communes WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_COMMUNE', `Commune supprimée : ${commune.nom} (ID: ${commune.id})`);
    setFlash(req, 'success', `Commune ${commune.nom} supprimée avec succès.`);
    res.redirect('/communes');
  } catch (err) {
    next(err);
  }
}

router.post('/:id/delete', deleteCommune);
router.post('/:id/supprimer', deleteCommune);
router.post('/delete/:id', deleteCommune);
router.delete('/:id', deleteCommune);

module.exports = router;
