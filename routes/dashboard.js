const express = require('express');
const { query, queryOne } = require('../db');
const { requireConnexion } = require('../middleware/auth');

const router = express.Router();

router.use(requireConnexion);

router.get('/', async (req, res, next) => {
  try {
    const stats = {};
    stats.total_projets = Number(
      (await queryOne('SELECT COUNT(*) AS c FROM projets')).c
    );
    stats.projets_en_cours = Number(
      (await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours'")).c
    );
    stats.projets_termines = Number(
      (await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'terminé'")).c
    );
    stats.projets_retard = Number(
      (
        await queryOne(
          "SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours' AND date_fin_prevue < CURRENT_DATE"
        )
      ).c
    );
    stats.budget_total = Number(
      (await queryOne('SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets')).s
    );
    stats.depenses_total = Number(
      (await queryOne('SELECT COALESCE(SUM(montant), 0) AS s FROM depenses WHERE validee = true')).s
    );
    stats.depenses_attente = Number(
      (await queryOne('SELECT COUNT(*) AS c FROM depenses WHERE validee = false')).c
    );
    stats.budget_restant = stats.budget_total - stats.depenses_total;
    stats.taux_consommation =
      stats.budget_total > 0
        ? Math.round((stats.depenses_total / stats.budget_total) * 1000) / 10
        : 0;

    const derniers_projets = await query(`
      SELECT p.*, c.nom AS commune_nom, tp.nom AS type_nom, tp.couleur
      FROM projets p
      JOIN communes c ON p.commune_id = c.id
      JOIN types_projets tp ON p.type_projet_id = tp.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    const projets_retard = await query(`
      SELECT p.*, c.nom AS commune_nom
      FROM projets p
      JOIN communes c ON p.commune_id = c.id
      WHERE p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE
      ORDER BY p.date_fin_prevue
      LIMIT 5
    `);

    const budget_communes = await query(`
      SELECT c.nom AS commune, COALESCE(SUM(p.budget_actuel), 0) AS budget_total
      FROM communes c
      LEFT JOIN projets p ON c.id = p.commune_id
      GROUP BY c.id, c.nom
      ORDER BY budget_total DESC
    `);

    const projets_statut = await query(`
      SELECT CASE
        WHEN statut = 'planifié' THEN 'Planifié'
        WHEN statut = 'en_cours' THEN 'En cours'
        WHEN statut = 'terminé' THEN 'Terminé'
        WHEN statut = 'suspendu' THEN 'Suspendu'
        WHEN statut = 'annulé' THEN 'Annulé'
        ELSE statut END AS statut_label,
        COUNT(*) AS nombre
      FROM projets
      GROUP BY statut
    `);

    const budget_types = await query(`
      SELECT t.nom AS type, COALESCE(SUM(p.budget_actuel), 0) AS budget_total, t.couleur
      FROM types_projets t
      LEFT JOIN projets p ON t.id = p.type_projet_id
      GROUP BY t.id, t.nom, t.couleur
      ORDER BY budget_total DESC
      LIMIT 5
    `);

    const evolution_projets = await query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS mois, COUNT(*) AS nombre
      FROM projets
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mois ASC
    `);

    res.render('dashboard', {
      page_title: 'Dashboard',
      stats,
      derniers_projets,
      projets_retard,
      budget_communes,
      projets_statut,
      budget_types,
      evolution_projets,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
