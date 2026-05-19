const express = require('express');
const { query } = require('../db');
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
    const projets = await query(`
      SELECT p.*, c.nom AS commune_nom
      FROM projets p
      JOIN communes c ON p.commune_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    const communes_rows = await query(`
      SELECT c.*, COUNT(p.id) AS total_projets
      FROM communes c
      LEFT JOIN projets p ON p.commune_id = c.id
      GROUP BY c.id
      ORDER BY c.nom
    `);
    const communes = communes_rows.map(c => ({
      ...c,
      total_projets: Number(c.total_projets) || 0
    }));

    const en_retard = projets.filter(p => p.statut === 'en_cours' && p.date_fin_prevue && new Date(p.date_fin_prevue) < new Date());
    const communes_inactives  = communes.filter(c => c.statut === 'inactice' || c.statut === 'inactif');
    const communes_suspendues = communes.filter(c => c.statut === 'suspendu');
    const projets_bloques     = projets.filter(p => p.statut === 'suspendu');

    res.render('super-admin/alertes', { 
      page_title: 'Alertes & Notifications', 
      en_retard, 
      communes_inactives, 
      communes_suspendues, 
      projets_bloques 
    });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;
