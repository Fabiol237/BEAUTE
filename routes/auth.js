const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const { guestOnly } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');

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
      req.session.role_id = 0; // Super admin
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

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
