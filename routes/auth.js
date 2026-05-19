const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const { guestOnly } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const crypto = require('crypto');

const router = express.Router();

async function comparePassword(plain, hash) {
  if (!hash) return false;
  const normalized = hash.replace(/^\$2y\$/, '$2b$');
  return bcrypt.compare(plain, normalized);
}

router.get('/login', guestOnly, (req, res) => {
  res.render('login', { page_title: 'Connexion', erreur: null, body: {} });
});

router.post('/login', guestOnly, async (req, res) => {
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.render('login', {
      page_title: 'Connexion',
      erreur: 'Veuillez remplir tous les champs',
      body: { email },
    });
  }

  try {
    let user = await queryOne(
      `SELECT u.*, r.nom AS role_nom
       FROM utilisateurs u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?
         AND u.statut = 'actif'
         AND u.actif = true`,
      [email]
    );

    // Vérification Utilisateur normal (Agent Commune)
    if (user && (await comparePassword(password, user.password_hash))) {
      req.session.utilisateur_id = user.id;
      req.session.utilisateur_nom = user.nom;
      req.session.utilisateur_prenom = user.prenom;
      req.session.utilisateur_email = user.email;
      req.session.role_id = user.role_id;
      req.session.role_nom = user.role_nom;
      req.session.utilisateur_role = user.role;
      req.session.commune_id = user.commune_id;

      await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?', [user.id]);
      return res.redirect('/dashboard');
    }

    // Si pas trouvé, Vérification Super Admin (MuniPro)
    const superAdmin = await queryOne(
      `SELECT * FROM munipro_admins WHERE email = ? AND statut = 'actif'`,
      [email]
    );

    if (superAdmin && (await comparePassword(password, superAdmin.password_hash))) {
      req.session.utilisateur_id = superAdmin.id;
      req.session.utilisateur_nom = superAdmin.nom;
      req.session.utilisateur_prenom = 'Super';
      req.session.utilisateur_email = superAdmin.email;
      req.session.role_id = 0;
      req.session.role_nom = 'super_admin';
      req.session.utilisateur_role = 'super_admin';
      req.session.is_super_admin = true;

      await query('UPDATE munipro_admins SET derniere_connexion = NOW() WHERE id = ?', [superAdmin.id]);
      return res.redirect('/dashboard');
    }

    res.render('login', {
      page_title: 'Connexion',
      erreur: 'Email ou mot de passe incorrect',
      body: { email },
    });
  } catch (err) {
    console.error(err);
    res.render('login', {
      page_title: 'Connexion',
      erreur: 'Erreur serveur. Réessayez.',
      body: { email },
    });
  }
});

// Inscription sécurisée d'un Administrateur de Commune (GET)
router.get('/inscription', guestOnly, async (req, res, next) => {
  const commune_id = parseInt(req.query.commune_id, 10);
  const token = req.query.token || '';

  if (isNaN(commune_id) || !token) {
    return res.render('login', {
      page_title: 'Connexion',
      erreur: "Le lien d'inscription est invalide ou expiré.",
      body: {},
    });
  }

  try {
    // Valider le token MD5 avec la clé secrète
    const secret = process.env.SESSION_SECRET || 'changez-moi-en-production';
    const calculatedToken = crypto.createHash('md5').update(`${commune_id}-${secret}`).digest('hex');

    if (calculatedToken !== token) {
      return res.render('login', {
        page_title: 'Connexion',
        erreur: "Le lien d'inscription est invalide ou expiré.",
        body: {},
      });
    }

    // Récupérer les détails de la commune
    const commune = await queryOne('SELECT * FROM communes WHERE id = ? AND statut = ?', [commune_id, 'actif']);
    if (!commune) {
      return res.render('login', {
        page_title: 'Connexion',
        erreur: "La commune associée à cette invitation est introuvable ou inactive.",
        body: {},
      });
    }

    res.render('inscription', {
      page_title: 'Inscription Administrateur Commune',
      commune,
      token,
      erreurs: [],
      body: {},
    });
  } catch (err) {
    next(err);
  }
});

// Inscription sécurisée d'un Administrateur de Commune (POST)
router.post('/inscription', guestOnly, async (req, res, next) => {
  const commune_id = parseInt(req.query.commune_id, 10);
  const token = req.query.token || '';
  const prenom = (req.body.prenom || '').trim();
  const nom = (req.body.nom || '').trim();
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const confirmer_mdp = req.body.confirmer_mdp || '';

  if (isNaN(commune_id) || !token) {
    return res.redirect('/login');
  }

  try {
    // Re-valider le token et la commune
    const secret = process.env.SESSION_SECRET || 'changez-moi-en-production';
    const calculatedToken = crypto.createHash('md5').update(`${commune_id}-${secret}`).digest('hex');

    if (calculatedToken !== token) {
      return res.redirect('/login');
    }

    const commune = await queryOne('SELECT * FROM communes WHERE id = ? AND statut = ?', [commune_id, 'actif']);
    if (!commune) {
      return res.redirect('/login');
    }

    const erreurs = [];
    if (!prenom) erreurs.push('Le prénom est requis');
    if (!nom) erreurs.push('Le nom est requis');
    if (!email) erreurs.push("L'adresse email est requise");
    if (!password) erreurs.push('Le mot de passe est requis');
    if (password.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
    if (password !== confirmer_mdp) erreurs.push('Les mots de passe ne correspondent pas');

    if (!erreurs.length) {
      // Vérifier l'unicité de l'email
      const userExists = await queryOne('SELECT id FROM utilisateurs WHERE email = ?', [email]);
      if (userExists) erreurs.push('Cette adresse email est déjà enregistrée.');
    }

    if (erreurs.length) {
      return res.render('inscription', {
        page_title: 'Inscription Administrateur Commune',
        commune,
        token,
        erreurs,
        body: req.body,
      });
    }

    // Chiffrer le mot de passe avec bcrypt
    const hash = await bcrypt.hash(password, 10);

    // Insertion du compte utilisateur lié à sa commune (rôle ID 1 correspond à 'admin')
    const insertResult = await query(
      `INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, password_hash, role, statut, actif, created_at)
       VALUES (?, 1, ?, ?, ?, ?, 'admin', 'actif', true, NOW()) RETURNING id`,
      [commune_id, nom, prenom, email, hash]
    );

    // Connexion automatique immédiate après inscription
    req.session.utilisateur_id = insertResult[0].id;
    req.session.utilisateur_nom = nom;
    req.session.utilisateur_prenom = prenom;
    req.session.utilisateur_email = email;
    req.session.role_id = 1;
    req.session.role_nom = 'admin';
    req.session.utilisateur_role = 'admin';
    req.session.commune_id = commune_id;

    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?', [insertResult[0].id]);
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
