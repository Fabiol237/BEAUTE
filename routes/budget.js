const express = require('express');
const { query, queryOne } = require('../db');
const { requireConnexion, requireRole } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { parseMontantInput } = require('../lib/helpers');

const router = express.Router();

router.use(requireConnexion);

router.get('/liste', async (req, res, next) => {
  try {
    const cId = req.session.commune_id;
    const pCond = cId ? 'WHERE commune_id = $1' : '';
    const dCond = cId ? 'WHERE projet_id IN (SELECT id FROM projets WHERE commune_id = $1)' : '';
    const args = cId ? [cId] : [];

    const stats_budget = {};
    stats_budget.budget_total = Number(
      (await queryOne(`SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets ${pCond}`, args)).s
    );
    stats_budget.depenses_total = Number(
      (await queryOne(`SELECT COALESCE(SUM(montant), 0) AS s FROM depenses ${dCond ? dCond + ' AND' : 'WHERE'} validee = true`, args)).s
    );
    stats_budget.nb_projets = Number(
      (await queryOne(`SELECT COUNT(*) AS c FROM projets ${pCond}`, args)).c
    );
    stats_budget.depenses_attente = Number(
      (await queryOne(`SELECT COUNT(*) AS c FROM depenses ${dCond ? dCond + ' AND' : 'WHERE'} validee = false`, args)).c
    );
    stats_budget.restant = stats_budget.budget_total - stats_budget.depenses_total;
    stats_budget.pourcentage =
      stats_budget.budget_total > 0
        ? Math.round((stats_budget.depenses_total / stats_budget.budget_total) * 1000) / 10
        : 0;

    const projets = await query(`
      SELECT p.*, t.nom AS type_nom, t.couleur, c.nom AS commune_nom,
             COALESCE(SUM(CASE WHEN d.validee = true THEN d.montant ELSE 0 END), 0) AS total_depenses,
             COUNT(CASE WHEN d.validee = true THEN 1 END) AS nb_depenses,
             COUNT(CASE WHEN d.validee = false AND d.id IS NOT NULL THEN 1 END) AS nb_attente
      FROM projets p
      LEFT JOIN types_projets t ON p.type_projet_id = t.id
      LEFT JOIN communes c ON p.commune_id = c.id
      LEFT JOIN depenses d ON d.projet_id = p.id
      ${cId ? 'WHERE p.commune_id = $1' : ''}
      GROUP BY p.id, t.nom, t.couleur, c.nom
      ORDER BY p.budget_actuel DESC
    `, args);

    res.render('budget/liste', {
      page_title: 'Gestion Budgétaire',
      stats_budget,
      projets,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/depenses', async (req, res, next) => {
  try {
    const cId = req.session.commune_id;
    const projet_id = parseInt(req.query.projet_id, 10) || 0;
    const projet = await queryOne(
      `SELECT p.*, t.nom AS type_nom, c.nom AS commune_nom, t.couleur
       FROM projets p
       LEFT JOIN types_projets t ON p.type_projet_id = t.id
       LEFT JOIN communes c ON p.commune_id = c.id
       WHERE p.id = $1 ${cId ? 'AND p.commune_id = $2' : ''}`,
      cId ? [projet_id, cId] : [projet_id]
    );

    if (!projet) {
      setFlash(req, 'danger', 'Projet introuvable.');
      return res.redirect('/projets/liste');
    }

    const depenses_list = await query(
      'SELECT * FROM depenses WHERE projet_id = $1 ORDER BY date_depense DESC',
      [projet_id]
    );

    const total_depenses = depenses_list.reduce((s, d) => s + Number(d.montant), 0);
    const budget_restant = projet.budget_actuel - total_depenses;
    const pourcentage_utilise =
      projet.budget_actuel > 0
        ? Math.round((total_depenses / projet.budget_actuel) * 1000) / 10
        : 0;

    let bar_class = 'bg-success';
    if (pourcentage_utilise > 80) bar_class = 'bg-danger';
    else if (pourcentage_utilise > 50) bar_class = 'bg-warning';

    res.render('budget/depenses', {
      page_title: 'Gestion des Dépenses',
      projet,
      projet_id,
      depenses_list,
      total_depenses,
      budget_restant,
      pourcentage_utilise,
      bar_class,
      erreurs: [],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/depenses', requireRole('gestionnaire'), async (req, res, next) => {
  try {
    const projet_id = parseInt(req.query.projet_id || req.body.projet_id, 10) || 0;
    if (req.body.action !== 'ajouter') {
      return res.redirect(`/budget/depenses?projet_id=${projet_id}`);
    }

    const erreurs = [];
    const libelle = (req.body.libelle || '').trim();
    const montant = parseMontantInput(req.body.montant);
    const date_depense = req.body.date_depense || new Date().toISOString().slice(0, 10);

    if (!libelle) erreurs.push('Le libellé est requis');
    if (montant <= 0) erreurs.push('Le montant doit être supérieur à 0');
    if (!date_depense) erreurs.push('La date est requise');

    if (erreurs.length) {
      const projet = await queryOne(
        `SELECT p.*, t.nom AS type_nom, c.nom AS commune_nom, t.couleur
         FROM projets p
         LEFT JOIN types_projets t ON p.type_projet_id = t.id
         LEFT JOIN communes c ON p.commune_id = c.id
         WHERE p.id = $1`,
        [projet_id]
      );
      const depenses_list = await query(
        'SELECT * FROM depenses WHERE projet_id = $1 ORDER BY date_depense DESC',
        [projet_id]
      );
      const total_depenses = depenses_list.reduce((s, d) => s + Number(d.montant), 0);
      const pourcentage_utilise =
        projet.budget_actuel > 0
          ? Math.round((total_depenses / projet.budget_actuel) * 1000) / 10
          : 0;
      let bar_class = 'bg-success';
      if (pourcentage_utilise > 80) bar_class = 'bg-danger';
      else if (pourcentage_utilise > 50) bar_class = 'bg-warning';

      return res.render('budget/depenses', {
        page_title: 'Gestion des Dépenses',
        projet,
        projet_id,
        depenses_list,
        total_depenses,
        budget_restant: projet.budget_actuel - total_depenses,
        pourcentage_utilise,
        bar_class,
        erreurs,
      });
    }

    await query(
      `INSERT INTO depenses
        (projet_id, libelle, description, montant, date_depense, numero_facture, fournisseur, saisi_par, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        projet_id,
        libelle,
        (req.body.description || '').trim() || null,
        montant,
        date_depense,
        (req.body.numero_facture || '').trim() || null,
        (req.body.fournisseur || '').trim() || null,
        req.session.is_super_admin ? null : req.session.utilisateur_id,
      ]
    );

    setFlash(req, 'success', 'Dépense ajoutée avec succès !');
    res.redirect(`/budget/depenses?projet_id=${projet_id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
