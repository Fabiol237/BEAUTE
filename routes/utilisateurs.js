const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const { requireConnexion, requireAdmin } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');

const router = express.Router();

const ROLE_MAP = { admin: 1, gestionnaire: 3, lecteur: 5 };

router.use(requireConnexion);
router.use(requireAdmin);

router.get('/liste', async (req, res, next) => {
  try {
    const utilisateurs = await query(`
      SELECT *, COALESCE(created_at, date_creation) AS date_inscription
      FROM utilisateurs
      ORDER BY COALESCE(created_at, date_creation) DESC
    `);

    const stats = { total: utilisateurs.length, actifs: 0, admins: 0, inactifs: 0 };
    utilisateurs.forEach((u) => {
      if (Number(u.actif) === 1) stats.actifs++;
      else stats.inactifs++;
      if (u.role === 'admin') stats.admins++;
    });

    res.render('utilisateurs/liste', {
      page_title: 'Gestion des Utilisateurs',
      utilisateurs,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/ajouter', (req, res) => {
  res.render('utilisateurs/ajouter', {
    page_title: 'Ajouter un Utilisateur',
    erreurs: [],
    body: {},
  });
});

router.post('/ajouter', async (req, res, next) => {
  try {
    const erreurs = [];
    const email = (req.body.email || '').trim();
    const nom = (req.body.nom || '').trim();
    const prenom = (req.body.prenom || '').trim();
    const role = req.body.role || 'lecteur';
    const mot_de_passe = req.body.mot_de_passe || '';
    const confirmer_mdp = req.body.confirmer_mdp || '';
    const actif = req.body.actif ? 1 : 0;

    if (!email) erreurs.push("L'email est requis");
    if (!nom) erreurs.push('Le nom est requis');
    if (!prenom) erreurs.push('Le prénom est requis');
    if (!mot_de_passe) erreurs.push('Le mot de passe est requis');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("L'email n'est pas valide");
    if (mot_de_passe.length < 6)
      erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
    if (mot_de_passe !== confirmer_mdp) erreurs.push('Les mots de passe ne correspondent pas');

    if (!erreurs.length) {
      const exists = await queryOne('SELECT id FROM utilisateurs WHERE email = ?', [email]);
      if (exists) erreurs.push('Cet email est déjà utilisé');
    }

    if (erreurs.length) {
      return res.render('utilisateurs/ajouter', {
        page_title: 'Ajouter un Utilisateur',
        erreurs,
        body: req.body,
      });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const role_id = ROLE_MAP[role] || 5;

    await query(
      `INSERT INTO utilisateurs (email, nom, prenom, password_hash, role, role_id, actif, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'actif', NOW())`,
      [email, nom, prenom, hash, role, role_id, actif]
    );

    setFlash(req, 'success', 'Utilisateur créé avec succès !');
    res.redirect('/utilisateurs/liste');
  } catch (err) {
    next(err);
  }
});

router.get('/modifier/:id', async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id, 10);
    const user = await queryOne('SELECT * FROM utilisateurs WHERE id = ?', [user_id]);
    if (!user) {
      setFlash(req, 'danger', 'Utilisateur introuvable');
      return res.redirect('/utilisateurs/liste');
    }
    res.render('utilisateurs/modifier', {
      page_title: 'Modifier un Utilisateur',
      user,
      user_id,
      erreurs: [],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/modifier/:id', async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id, 10);
    const erreurs = [];
    const email = (req.body.email || '').trim();
    const nom = (req.body.nom || '').trim();
    const prenom = (req.body.prenom || '').trim();
    const role = req.body.role || 'lecteur';
    const actif = req.body.actif ? 1 : 0;
    const nouveau_mdp = req.body.nouveau_mdp || '';
    const confirmer_mdp = req.body.confirmer_mdp || '';

    if (!email) erreurs.push("L'email est requis");
    if (!nom) erreurs.push('Le nom est requis');
    if (!prenom) erreurs.push('Le prénom est requis');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("L'email n'est pas valide");

    if (!erreurs.length) {
      const exists = await queryOne(
        'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
        [email, user_id]
      );
      if (exists) erreurs.push('Cet email est déjà utilisé par un autre utilisateur');
    }

    if (nouveau_mdp) {
      if (nouveau_mdp.length < 6)
        erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
      if (nouveau_mdp !== confirmer_mdp) erreurs.push('Les mots de passe ne correspondent pas');
    }

    const user = await queryOne('SELECT * FROM utilisateurs WHERE id = ?', [user_id]);
    if (!user) {
      setFlash(req, 'danger', 'Utilisateur introuvable');
      return res.redirect('/utilisateurs/liste');
    }

    if (erreurs.length) {
      return res.render('utilisateurs/modifier', {
        page_title: 'Modifier un Utilisateur',
        user: { ...user, email, nom, prenom, role, actif },
        user_id,
        erreurs,
      });
    }

    const role_id = ROLE_MAP[role] || 5;
    if (nouveau_mdp) {
      const hash = await bcrypt.hash(nouveau_mdp, 10);
      await query(
        `UPDATE utilisateurs SET email=?, nom=?, prenom=?, role=?, role_id=?, actif=?, password_hash=? WHERE id=?`,
        [email, nom, prenom, role, role_id, actif, hash, user_id]
      );
    } else {
      await query(
        `UPDATE utilisateurs SET email=?, nom=?, prenom=?, role=?, role_id=?, actif=? WHERE id=?`,
        [email, nom, prenom, role, role_id, actif, user_id]
      );
    }

    setFlash(req, 'success', 'Utilisateur modifié avec succès !');
    res.redirect('/utilisateurs/liste');
  } catch (err) {
    next(err);
  }
});

router.get('/supprimer/:id', async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id, 10);
    const user = await queryOne(
      'SELECT id, prenom, nom, email FROM utilisateurs WHERE id = ?',
      [user_id]
    );
    if (!user) {
      setFlash(req, 'danger', 'Utilisateur introuvable');
      return res.redirect('/utilisateurs/liste');
    }
    if (user_id === req.session.utilisateur_id) {
      setFlash(req, 'danger', 'Vous ne pouvez pas supprimer votre propre compte.');
      return res.redirect('/utilisateurs/liste');
    }
    res.render('utilisateurs/supprimer', {
      page_title: 'Supprimer un utilisateur',
      user,
      user_id,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/supprimer/:id', async (req, res, next) => {
  try {
    const user_id = parseInt(req.params.id, 10);
    if (!req.body.confirmer) {
      return res.redirect('/utilisateurs/liste');
    }
    if (user_id === req.session.utilisateur_id) {
      setFlash(req, 'danger', 'Vous ne pouvez pas supprimer votre propre compte.');
      return res.redirect('/utilisateurs/liste');
    }
    await query('DELETE FROM utilisateurs WHERE id = ?', [user_id]);
    setFlash(req, 'success', 'Utilisateur supprimé avec succès.');
    res.redirect('/utilisateurs/liste');
  } catch (err) {
    setFlash(req, 'danger', `Erreur : ${err.message}`);
    res.redirect('/utilisateurs/liste');
  }
});

module.exports = router;
