const express = require('express');
const { query } = require('../db');
const { requireConnexion } = require('../middleware/auth');

const router = express.Router();

router.use(requireConnexion);

router.get('/', async (req, res, next) => {
  try {
    const projets = await query(`
      SELECT p.*, c.nom AS commune_nom, t.nom AS type_nom, t.couleur AS type_couleur
      FROM projets p
      LEFT JOIN communes c ON p.commune_id = c.id
      LEFT JOIN types_projets t ON p.type_projet_id = t.id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      ORDER BY p.created_at DESC
    `);

    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');

    const stats_carte = {
      total: projets.length,
      en_cours: projets.filter((p) => p.statut === 'en_cours').length,
      planifie: projets.filter((p) => p.statut === 'planifié').length,
      termine: projets.filter((p) => p.statut === 'terminé').length,
    };

    res.render('carte', {
      page_title: 'Carte des Projets',
      projets,
      communes,
      stats_carte,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
