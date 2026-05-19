const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { requireConnexion } = require('../middleware/auth');

const router = express.Router();
router.use(requireConnexion);

router.get('/', async (req, res, next) => {
  const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
  const commune_id   = req.session.commune_id;

  // Un admin de commune sans commune_id en session → déconnexion propre
  if (!isSuperAdmin && !commune_id) {
    return res.redirect('/logout');
  }

  try {
    const secret = process.env.SESSION_SECRET || 'suivi-projets-dev-secret';
    const stats = {};

    if (isSuperAdmin) {
      // ── SUPER ADMIN : données globales toutes communes ──────────────────
      stats.total_projets    = Number((await queryOne('SELECT COUNT(*) AS c FROM projets')).c);
      stats.projets_en_cours = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours'")).c);
      stats.projets_termines = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'terminé'")).c);
      stats.projets_retard   = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours' AND date_fin_prevue < CURRENT_DATE")).c);
      stats.budget_total     = Number((await queryOne('SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets')).s);
      stats.depenses_total   = Number((await queryOne('SELECT COALESCE(SUM(montant), 0) AS s FROM depenses WHERE validee = true')).s);
      stats.depenses_attente = Number((await queryOne('SELECT COUNT(*) AS c FROM depenses WHERE validee = false')).c);
      stats.budget_restant   = stats.budget_total - stats.depenses_total;
      stats.taux_consommation = stats.budget_total > 0
        ? Math.round((stats.depenses_total / stats.budget_total) * 1000) / 10 : 0;
      stats.total_communes   = Number((await queryOne("SELECT COUNT(*) AS c FROM communes WHERE statut = 'actif'")).c);
      stats.total_admins     = Number((await queryOne("SELECT COUNT(*) AS c FROM utilisateurs WHERE role = 'admin' AND actif = true")).c);

    } else {
      // ── ADMIN COMMUNE : données filtrées par commune_id ─────────────────
      stats.total_projets    = Number((await queryOne('SELECT COUNT(*) AS c FROM projets WHERE commune_id = ?', [commune_id])).c);
      stats.projets_en_cours = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours' AND commune_id = ?", [commune_id])).c);
      stats.projets_termines = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'terminé' AND commune_id = ?", [commune_id])).c);
      stats.projets_retard   = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours' AND date_fin_prevue < CURRENT_DATE AND commune_id = ?", [commune_id])).c);
      stats.budget_total     = Number((await queryOne('SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets WHERE commune_id = ?', [commune_id])).s);
      stats.depenses_total   = Number((await queryOne(
        'SELECT COALESCE(SUM(d.montant), 0) AS s FROM depenses d JOIN projets p ON d.projet_id = p.id WHERE d.validee = true AND p.commune_id = ?',
        [commune_id]
      )).s);
      stats.depenses_attente = Number((await queryOne(
        'SELECT COUNT(*) AS c FROM depenses d JOIN projets p ON d.projet_id = p.id WHERE d.validee = false AND p.commune_id = ?',
        [commune_id]
      )).c);
      stats.budget_restant    = stats.budget_total - stats.depenses_total;
      stats.taux_consommation = stats.budget_total > 0
        ? Math.round((stats.depenses_total / stats.budget_total) * 1000) / 10 : 0;
    }

    // ── Derniers projets ─────────────────────────────────────────────────
    const derniersProjetsSql = isSuperAdmin
      ? `SELECT p.*, c.nom AS commune_nom, tp.nom AS type_nom, tp.couleur
         FROM projets p
         JOIN communes c ON p.commune_id = c.id
         JOIN types_projets tp ON p.type_projet_id = tp.id
         ORDER BY p.created_at DESC LIMIT 6`
      : `SELECT p.*, c.nom AS commune_nom, tp.nom AS type_nom, tp.couleur
         FROM projets p
         JOIN communes c ON p.commune_id = c.id
         JOIN types_projets tp ON p.type_projet_id = tp.id
         WHERE p.commune_id = ?
         ORDER BY p.created_at DESC LIMIT 6`;
    const derniers_projets = isSuperAdmin
      ? await query(derniersProjetsSql)
      : await query(derniersProjetsSql, [commune_id]);

    // ── Projets en retard ────────────────────────────────────────────────
    const retardSql = isSuperAdmin
      ? `SELECT p.*, c.nom AS commune_nom FROM projets p JOIN communes c ON p.commune_id = c.id
         WHERE p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE ORDER BY p.date_fin_prevue LIMIT 5`
      : `SELECT p.*, c.nom AS commune_nom FROM projets p JOIN communes c ON p.commune_id = c.id
         WHERE p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE AND p.commune_id = ?
         ORDER BY p.date_fin_prevue LIMIT 5`;
    const projets_retard = isSuperAdmin
      ? await query(retardSql)
      : await query(retardSql, [commune_id]);

    // ── Communes groupées (Super Admin uniquement) ───────────────────────
    let communes_stats = [];
    if (isSuperAdmin) {
      communes_stats = await query(`
        SELECT
          c.id, c.nom, c.region, c.statut,
          COUNT(DISTINCT p.id)  AS nb_projets,
          COUNT(DISTINCT u.id)  AS nb_admins,
          COALESCE(SUM(p.budget_actuel), 0) AS budget_total,
          COUNT(DISTINCT CASE WHEN p.statut = 'en_cours' THEN p.id END) AS projets_en_cours,
          MAX(u.derniere_connexion) AS derniere_connexion_admin
        FROM communes c
        LEFT JOIN projets p ON c.id = p.commune_id
        LEFT JOIN utilisateurs u ON c.id = u.commune_id AND u.actif = true
        GROUP BY c.id, c.nom, c.region, c.statut
        ORDER BY c.nom ASC
      `);
      communes_stats.forEach(c => {
        const token = crypto.createHash('md5').update(`${c.id}-${secret}`).digest('hex');
        c.inscription_link = `${req.protocol}://${req.get('host')}/inscription?commune_id=${c.id}&token=${token}`;
        c.has_admin = Number(c.nb_admins) > 0;
      });
    }

    // ── Graphiques ───────────────────────────────────────────────────────
    const statutFilter = isSuperAdmin ? '' : ' WHERE commune_id = ?';
    const statutParams = isSuperAdmin ? [] : [commune_id];
    const projets_statut = await query(`
      SELECT CASE
        WHEN statut = 'planifié' THEN 'Planifié' WHEN statut = 'en_cours' THEN 'En cours'
        WHEN statut = 'terminé'  THEN 'Terminé'  WHEN statut = 'suspendu' THEN 'Suspendu'
        WHEN statut = 'annulé'   THEN 'Annulé'   ELSE statut END AS statut_label,
        COUNT(*) AS nombre FROM projets${statutFilter} GROUP BY statut
    `, statutParams);

    const budget_types = isSuperAdmin
      ? await query(`SELECT t.nom AS type, COALESCE(SUM(p.budget_actuel), 0) AS budget_total, t.couleur
         FROM types_projets t LEFT JOIN projets p ON t.id = p.type_projet_id
         GROUP BY t.id, t.nom, t.couleur ORDER BY budget_total DESC LIMIT 5`)
      : await query(`SELECT t.nom AS type, COALESCE(SUM(p.budget_actuel), 0) AS budget_total, t.couleur
         FROM types_projets t LEFT JOIN projets p ON t.id = p.type_projet_id AND p.commune_id = ?
         GROUP BY t.id, t.nom, t.couleur ORDER BY budget_total DESC LIMIT 5`, [commune_id]);

    const evolutionFilter = isSuperAdmin ? '' : ' AND commune_id = ?';
    const evolutionParams = isSuperAdmin ? [] : [commune_id];
    const evolution_projets = await query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS mois, COUNT(*) AS nombre FROM projets
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'${evolutionFilter}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY mois ASC
    `, evolutionParams);

    const budget_communes = isSuperAdmin
      ? await query(`SELECT c.nom AS commune, COALESCE(SUM(p.budget_actuel), 0) AS budget_total
         FROM communes c LEFT JOIN projets p ON c.id = p.commune_id
         GROUP BY c.id, c.nom ORDER BY budget_total DESC`)
      : [];

    const commune_info = !isSuperAdmin
      ? await queryOne('SELECT * FROM communes WHERE id = ?', [commune_id])
      : null;

    res.render('dashboard', {
      page_title: 'Dashboard',
      stats,
      derniers_projets,
      projets_retard,
      budget_communes,
      projets_statut,
      budget_types,
      evolution_projets,
      communes_stats,
      commune_info,
      is_super_admin: isSuperAdmin,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
