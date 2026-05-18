const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool, query, queryOne } = require('../db');
const config = require('../config');

const router = express.Router();

const sigStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(config.signalementsDir, { recursive: true });
    cb(null, config.signalementsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `sig_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});

const uploadSig = multer({
  storage: sigStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error('Format invalide'), ok);
  },
});

const bannerColors = [
  ['#003F88','#0052B4'], ['#007A3D','#005A2D'], ['#CE1126','#8B0A1A'],
  ['#1D4E89','#0EA5E9'], ['#5B2D8E','#7C3AED'], ['#B45309','#F59E0B'],
];

const formatMontant = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1e9) return (v/1e9).toFixed(2) + ' Md FCFA';
  if (v >= 1e6) return (v/1e6).toFixed(1) + ' M FCFA';
  return Number(v).toLocaleString('fr-FR') + ' FCFA';
};

// ── PAGE SÉLECTION COMMUNE ──────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    let sql = `
      SELECT c.*,
        COUNT(DISTINCT p.id) AS total_projets,
        SUM(CASE WHEN p.statut='en_cours' THEN 1 ELSE 0 END) AS en_cours,
        COALESCE(AVG(p.avancement_physique),0) AS taux_avancement
      FROM communes c
      LEFT JOIN projets p ON p.commune_id = c.id AND p.visible_public = TRUE
      WHERE c.statut = 'actif'
    `;
    const params = [];
    if (q) { sql += ' AND c.nom LIKE ?'; params.push(`%${q}%`); }
    sql += ' GROUP BY c.id ORDER BY c.nom';
    const communes = (await query(sql, params)).map(c => ({
      ...c,
      taux_avancement: Math.round(Number(c.taux_avancement)||0),
      en_cours: Number(c.en_cours)||0,
    }));
    res.render('portail/choix-commune', {
      page_title: 'Portail Citoyen — Choisissez votre Commune',
      layout: false, communes, bannerColors, query: q,
    });
  } catch (err) { next(err); }
});

// ── PAGE DÉTAIL COMMUNE ─────────────────────────────────────────
router.get('/commune/:id', async (req, res, next) => {
  try {
    const commune_id = parseInt(req.params.id, 10);
    const commune = await queryOne(`
      SELECT c.*,
        COUNT(DISTINCT p.id) AS total_projets,
        COALESCE(SUM(p.budget_actuel),0) AS budget_total
      FROM communes c
      LEFT JOIN projets p ON p.commune_id = c.id
      WHERE c.id = ? AND c.statut = 'actif'
      GROUP BY c.id
    `, [commune_id]);
    if (!commune) return res.redirect('/portail-citoyen');

    const projets = await query(`
      SELECT p.*, tp.nom AS type_nom
      FROM projets p
      JOIN types_projets tp ON tp.id = p.type_projet_id
      WHERE p.commune_id = ? AND p.visible_public = TRUE
      ORDER BY p.created_at DESC
    `, [commune_id]);

    const stats = {
      total:    projets.length,
      en_cours: projets.filter(p => p.statut === 'en_cours').length,
      termines: projets.filter(p => p.statut === 'terminé').length,
      taux_moyen: projets.length
        ? Math.round(projets.reduce((s,p) => s + (p.avancement_physique||0), 0) / projets.length)
        : 0,
    };

    const idx = commune_id % bannerColors.length;
    const heroBg = bannerColors[idx];

    res.render('portail/commune', {
      page_title: `${commune.nom} — Portail Citoyen`,
      layout: false, commune, projets, stats, heroBg, formatMontant,
    });
  } catch (err) { next(err); }
});



router.get('/projets', async (req, res, next) => {
  try {
    const recherche = req.query.q || '';
    const commune_id = req.query.commune || '';
    const type_id = req.query.type || '';
    const statut = req.query.statut || '';

    const where = ['p.visible_public = TRUE'];
    const params = [];
    if (recherche) {
      where.push('(p.titre LIKE ? OR p.description LIKE ?)');
      params.push(`%${recherche}%`, `%${recherche}%`);
    }
    if (commune_id) {
      where.push('p.commune_id = ?');
      params.push(commune_id);
    }
    if (type_id) {
      where.push('p.type_projet_id = ?');
      params.push(type_id);
    }
    if (statut) {
      where.push('p.statut = ?');
      params.push(statut);
    }

    const projets = await query(
      `SELECT p.*, t.nom AS type_nom, c.nom AS commune_nom
       FROM projets p
       LEFT JOIN types_projets t ON p.type_projet_id = t.id
       LEFT JOIN communes c ON p.commune_id = c.id
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC`,
      params
    );

    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');
    const types = await query('SELECT id, nom FROM types_projets ORDER BY nom');

    res.render('portail/projets', {
      page_title: 'Projets municipaux',
      layout: false,
      projets,
      communes,
      types,
      recherche,
      commune_id,
      type_id,
      statut,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/projet/:id', async (req, res, next) => {
  try {
    const projet_id = parseInt(req.params.id, 10);
    const projet = await queryOne(
      `SELECT p.*, tp.nom AS type_nom, c.nom AS commune_nom
       FROM projets p
       LEFT JOIN types_projets tp ON tp.id = p.type_projet_id
       LEFT JOIN communes c ON c.id = p.commune_id
       WHERE p.id = ? AND p.visible_public = TRUE`,
      [projet_id]
    );

    if (!projet) return res.redirect('/portail-citoyen');

    const photos_list = await query(
      'SELECT * FROM photos_projets WHERE projet_id = ? ORDER BY created_at DESC LIMIT 9',
      [projet_id]
    );

    const heroColors = [
      'linear-gradient(135deg,#003F88,#0052B4)',
      'linear-gradient(135deg,#007A3D,#005A2D)',
      'linear-gradient(135deg,#CE1126,#8B0A1A)',
      'linear-gradient(135deg,#1D4E89,#0EA5E9)',
      'linear-gradient(135deg,#5B2D8E,#7C3AED)',
    ];
    const heroColor = heroColors[projet_id % heroColors.length];

    res.render('portail/projet', {
      page_title: projet.titre,
      layout: false,
      projet,
      photos_list,
      heroColor,
      formatMontant,
    });
  } catch (err) {
    next(err);
  }
});


router.get('/suggestion', async (req, res, next) => {
  try {
    const projets = await query(
      'SELECT id, titre FROM projets WHERE visible_public = TRUE ORDER BY titre'
    );
    res.render('portail/suggestion', {
      page_title: 'Suggestions & Signalements',
      layout: false,
      projets,
      erreurs: [],
      success: false,
      mode_success: '',
      mode_actif: req.query.mode || 'suggestion',
      body: {},
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/suggestion',
  uploadSig.array('photos', 5),
  async (req, res, next) => {
    const body = req.body;
    const erreurs = [];
    const mode = body.mode || 'suggestion';
    const nom = (body.nom || '').trim();
    const email = (body.email || '').trim();
    const telephone = (body.telephone || '').trim();
    const message = (body.message || '').trim();

    if (!nom) erreurs.push('Le nom est requis');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      erreurs.push('Adresse email invalide');
    if (!message || message.length < 20)
      erreurs.push('La description doit contenir au moins 20 caractères');

    let categorie = body.categorie || body.categorie_probleme || '';
    let projet_id = body.projet_id || null;
    let quartier = (body.quartier || '').trim();
    let priorite_citoyen = body.priorite_citoyen || 'basse';
    let disponible = body.disponible_contact ? 1 : 0;
    let adresse_probleme = (body.adresse_probleme || '').trim();
    let latitude = body.latitude || null;
    let longitude = body.longitude || null;
    let depuis_quand = (body.depuis_quand || '').trim();
    let a_temoins = body.a_temoins ? 1 : 0;
    let urgence = body.urgence || 'normale';

    if (mode === 'suggestion') {
      if (!categorie) erreurs.push('La catégorie de suggestion est requise');
    } else {
      if (!categorie) erreurs.push('La catégorie du problème est requise');
      if (!adresse_probleme && !latitude)
        erreurs.push("Veuillez indiquer l'adresse ou utiliser la localisation GPS");
    }

    const projets = await query(
      'SELECT id, titre FROM projets WHERE visible_public = TRUE ORDER BY titre'
    );

    if (erreurs.length) {
      return res.render('portail/suggestion', {
        page_title: 'Suggestions & Signalements',
        layout: false,
        projets,
        erreurs,
        success: false,
        mode_success: '',
        mode_actif: mode,
        body,
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const prefix =
        mode === 'signalement' ? 'Signalement' : categorie.replace(/_/g, ' ');
      const titre = `${prefix} — ${nom.slice(0, 30)}`;
      const priorite =
        mode === 'signalement' && urgence === 'urgente' ? 'haute' : priorite_citoyen;

      const [result] = await conn.execute(
        `INSERT INTO suggestions
          (mode, citoyen_nom, citoyen_email, citoyen_telephone,
           projet_id, categorie, titre, description,
           quartier, priorite_citoyen, disponible_contact,
           adresse_probleme, latitude, longitude,
           depuis_quand, a_temoins, priorite, date_soumission)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
        [
          mode,
          nom,
          email,
          telephone || null,
          projet_id || null,
          categorie,
          titre,
          message,
          quartier || null,
          priorite_citoyen,
          disponible,
          adresse_probleme || null,
          latitude,
          longitude,
          depuis_quand || null,
          a_temoins,
          priorite,
        ]
      );
      const sid = result.insertId;

      if (mode === 'signalement' && req.files && req.files.length) {
        for (const file of req.files.slice(0, 5)) {
          await conn.execute(
            'INSERT INTO signalement_photos (suggestion_id, fichier_url, fichier_nom, taille) VALUES (?,?,?,?)',
            [sid, file.filename, file.originalname, file.size]
          );
        }
      }

      await conn.commit();
      res.render('portail/suggestion', {
        page_title: 'Suggestions & Signalements',
        layout: false,
        projets,
        erreurs: [],
        success: true,
        mode_success: mode,
        mode_actif: mode,
        body: {},
      });
    } catch (err) {
      await conn.rollback();
      res.render('portail/suggestion', {
        page_title: 'Suggestions & Signalements',
        layout: false,
        projets,
        erreurs: [`Erreur lors de l'envoi : ${err.message}`],
        success: false,
        mode_success: '',
        mode_actif: mode,
        body,
      });
    } finally {
      conn.release();
    }
  }
);

module.exports = router;
