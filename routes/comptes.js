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
    const { statut, commune_id } = req.query;
    
    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');
    
    let sql = `
      SELECT u.*, c.nom AS commune_nom
      FROM utilisateurs u
      LEFT JOIN communes c ON u.commune_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (statut) {
      conditions.push('u.statut = ?');
      params.push(statut);
    }
    if (commune_id) {
      conditions.push('u.commune_id = ?');
      params.push(commune_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY u.created_at DESC';

    const rawUsers = await query(sql, params);
    const utilisateurs = rawUsers.map(u => ({
      ...u,
      created_at: u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'
    }));

    res.render('super-admin/comptes/liste', {
      page_title: 'Gestion des Comptes',
      utilisateurs,
      communes,
      filtre: { statut, commune_id }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/toggle', async (req, res, next) => {
  try {
    const u = await queryOne('SELECT statut FROM utilisateurs WHERE id = ?', [req.params.id]);
    if (!u) return res.redirect('/comptes');

    const newStatut = u.statut === 'actif' ? 'suspendu' : 'actif';
    const isActif = newStatut === 'actif';
    
    await query('UPDATE utilisateurs SET statut = ?, actif = ? WHERE id = ?', [newStatut, isActif, req.params.id]);
    res.redirect('/comptes');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
