const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config');
const { query, queryOne } = require('../db');
const { requireConnexion } = require('../middleware/auth');

const router = express.Router();
router.use(requireConnexion);

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(config.uploadsDir, 'bannieres');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `banner_${req.session.commune_id || 'sa'}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const uploadBanner = multer({ storage: bannerStorage });

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
      stats.total = Number((await queryOne("SELECT COUNT(*) AS c FROM communes")).c);
      stats.actives = Number((await queryOne("SELECT COUNT(*) AS c FROM communes WHERE statut = 'actif'")).c);
      stats.suspendues = Number((await queryOne("SELECT COUNT(*) AS c FROM communes WHERE statut = 'suspendu'")).c);
      
      stats.total_projets = Number((await queryOne("SELECT COUNT(*) AS c FROM projets")).c);
      stats.en_cours = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours'")).c);
      stats.termines = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'terminé'")).c);
      
      stats.budget_total = Number((await queryOne("SELECT COALESCE(SUM(budget_actuel), 0) AS s FROM projets")).s);
      stats.taux_moyen = Math.round(Number((await queryOne("SELECT COALESCE(AVG(avancement_physique), 0) AS s FROM projets")).s) || 0);
      stats.en_retard = Number((await queryOne("SELECT COUNT(*) AS c FROM projets WHERE statut = 'en_cours' AND date_fin_prevue < CURRENT_DATE")).c);

      const communes_stats = await query(`
        SELECT
          c.id, c.nom, c.region, c.statut,
          COUNT(DISTINCT p.id)  AS nb_projets,
          COUNT(DISTINCT u.id)  AS nb_admins,
          COALESCE(SUM(p.budget_actuel), 0) AS budget_total,
          COUNT(DISTINCT CASE WHEN p.statut = 'en_cours' THEN p.id END) AS projets_en_cours,
          COUNT(DISTINCT CASE WHEN p.statut = 'terminé' THEN p.id END) AS termines,
          COUNT(DISTINCT CASE WHEN p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE THEN p.id END) AS en_retard,
          COALESCE(AVG(p.avancement_physique), 0) AS taux_avancement,
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
        c.taux_avancement = Math.round(Number(c.taux_avancement) || 0);
        c.en_retard = Number(c.en_retard) || 0;
        c.budget_total = Number(c.budget_total) || 0;
        c.total_projets = Number(c.nb_projets) || 0;
        c.nb_projets = Number(c.nb_projets) || 0;
        c.projets_en_cours = Number(c.projets_en_cours) || 0;
      });

      const top_communes = [...communes_stats]
        .filter(c => c.statut === 'actif')
        .sort((a, b) => b.taux_avancement - a.taux_avancement)
        .slice(0, 3);

      const communes_retard = communes_stats
        .filter(c => c.en_retard > 0)
        .sort((a, b) => b.en_retard - a.en_retard)
        .slice(0, 3);

      const budget_communes = communes_stats.map(c => ({
        commune: c.nom,
        budget: c.budget_total
      })).sort((a, b) => b.budget - a.budget);

      const projets_statut = await query(`
        SELECT statut, COUNT(*) AS nombre
        FROM projets
        GROUP BY statut
      `);

      return res.render('super-admin/dashboard', {
        page_title: 'Tableau de Bord MuniPro',
        stats,
        communes: communes_stats,
        top_communes,
        communes_retard,
        budget_communes,
        projet_statuts: projets_statut,
        is_super_admin: true
      });
    }

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

    const derniersProjetsSql = `SELECT p.*, c.nom AS commune_nom, tp.nom AS type_nom, tp.couleur
       FROM projets p
       JOIN communes c ON p.commune_id = c.id
       JOIN types_projets tp ON p.type_projet_id = tp.id
       WHERE p.commune_id = ?
       ORDER BY p.created_at DESC LIMIT 6`;
    const derniers_projets = await query(derniersProjetsSql, [commune_id]);

    const retardSql = `SELECT p.*, c.nom AS commune_nom FROM projets p JOIN communes c ON p.commune_id = c.id
       WHERE p.statut = 'en_cours' AND p.date_fin_prevue < CURRENT_DATE AND p.commune_id = ?
       ORDER BY p.date_fin_prevue LIMIT 5`;
    const projets_retard = await query(retardSql, [commune_id]);

    const projets_statut = await query(`
      SELECT CASE
        WHEN statut = 'planifié' THEN 'Planifié' WHEN statut = 'en_cours' THEN 'En cours'
        WHEN statut = 'terminé'  THEN 'Terminé'  WHEN statut = 'suspendu' THEN 'Suspendu'
        WHEN statut = 'annulé'   THEN 'Annulé'   ELSE statut END AS statut_label,
        COUNT(*) AS nombre FROM projets WHERE commune_id = ? GROUP BY statut
    `, [commune_id]);

    const budget_types = await query(`SELECT t.nom AS type, COALESCE(SUM(p.budget_actuel), 0) AS budget_total, t.couleur
       FROM types_projets t LEFT JOIN projets p ON t.id = p.type_projet_id AND p.commune_id = ?
       GROUP BY t.id, t.nom, t.couleur ORDER BY budget_total DESC LIMIT 5`, [commune_id]);

    const evolution_projets = await query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS mois, COUNT(*) AS nombre FROM projets
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' AND commune_id = ?
      GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY mois ASC
    `, [commune_id]);

    const commune_info = await queryOne('SELECT * FROM communes WHERE id = ?', [commune_id]);

    res.render('dashboard', {
      page_title: 'Dashboard',
      stats,
      derniers_projets,
      projets_retard,
      budget_communes: [],
      projets_statut,
      budget_types,
      evolution_projets,
      communes_stats: [],
      commune_info,
      is_super_admin: false,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/ma-commune', async (req, res, next) => {
  if (req.session.utilisateur_role !== 'admin') return res.redirect('/dashboard');
  try {
    const commune = await queryOne('SELECT * FROM communes WHERE id = ?', [req.session.commune_id]);
    res.render('ma-commune', { page_title: 'Paramètres de ma Commune', commune, is_super_admin: false, message: req.query.success ? 'Mise à jour réussie' : '' });
  } catch(err) {
    next(err);
  }
});

router.post('/ma-commune', uploadBanner.single('banniere'), async (req, res, next) => {
  if (req.session.utilisateur_role !== 'admin') return res.redirect('/dashboard');
  try {
    const { nom, email, telephone, responsable } = req.body;
    let sql, params;

    if (req.file) {
      sql = 'UPDATE communes SET nom=$1, email=$2, telephone=$3, responsable=$4, banniere=$5 WHERE id=$6';
      params = [nom, email, telephone, responsable, req.file.filename, req.session.commune_id];
    } else {
      sql = 'UPDATE communes SET nom=$1, email=$2, telephone=$3, responsable=$4 WHERE id=$5';
      params = [nom, email, telephone, responsable, req.session.commune_id];
    }

    await query(sql, params);
    res.redirect('/dashboard/ma-commune?success=1');
  } catch(err) {
    next(err);
  }
});

router.post('/global-banner', uploadBanner.single('banniere'), (req, res, next) => {
  if (req.session.utilisateur_role !== 'super_admin') return res.redirect('/dashboard');
  if (req.file) {
    const fs = require('fs');
    const path = require('path');
    const config = require('../config');
    const sourcePath = req.file.path;
    const destPath = path.join(config.rootDir, 'public', 'assets', 'images', 'hero-bg.jpg');
    try {
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath); 
      res.redirect('/dashboard?success=banner');
    } catch(err) {
      next(err);
    }
  } else {
    res.redirect('/dashboard');
  }
});

module.exports = router;
