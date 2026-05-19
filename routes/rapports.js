const express = require('express');
const { query, queryOne } = require('../db');
const { requireConnexion } = require('../middleware/auth');
const router = express.Router();

router.use(requireConnexion, (req, res, next) => {
  if (req.session.utilisateur_role !== 'super_admin') {
    return res.status(403).send('Accès interdit');
  }
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const communes_rows = await query(`
      SELECT c.*,
        COUNT(DISTINCT p.id)                                        AS total_projets,
        COALESCE(SUM(p.budget_actuel), 0)                          AS budget_total,
        COALESCE(AVG(p.avancement_physique), 0)                    AS taux_avancement,
        SUM(CASE WHEN p.statut = 'en_cours'  THEN 1 ELSE 0 END)   AS en_cours,
        SUM(CASE WHEN p.statut = 'terminé'   THEN 1 ELSE 0 END)   AS termines,
        SUM(CASE WHEN p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE THEN 1 ELSE 0 END) AS en_retard
      FROM communes c
      LEFT JOIN projets p ON p.commune_id = c.id
      GROUP BY c.id ORDER BY c.nom
    `);
    const communes = communes_rows.map(c => ({
      ...c,
      taux_avancement: Math.round(Number(c.taux_avancement) || 0),
      en_retard: Number(c.en_retard) || 0,
      en_cours: Number(c.en_cours) || 0,
      termines: Number(c.termines) || 0,
      budget_total: Number(c.budget_total) || 0,
      total_projets: Number(c.total_projets) || 0
    }));

    const stats = {};
    stats.total = communes.length;
    stats.termines = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'terminé'")).c);
    stats.budget_total = Number((await queryOne("SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets")).s);
    stats.taux_moyen = Math.round(Number((await queryOne("SELECT COALESCE(AVG(avancement_physique), 0) AS s FROM projets")).s) || 0);

    res.render('super-admin/rapports', { 
      page_title: 'Rapports & Analyses', 
      communes, 
      stats 
    });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;
