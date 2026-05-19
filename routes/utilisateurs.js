const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const { requireConnexion, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAction } = require('../middleware/journal');

const router = express.Router();
router.use(requireConnexion);

// Helper: ensure user can only see own commune data (or super_admin sees all)
function ownCommuneOnly(req, res, next) {
  if (req.session.utilisateur_role === 'super_admin') return next();
  if (!req.session.commune_id) { return res.redirect('/logout'); }
  next();
}

// ── Liste utilisateurs (filtré par commune pour admin) ─────────────────────
router.get('/liste', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const commune_id = req.session.commune_id;

    let utilisateurs, commune_info = null;

    if (isSuperAdmin) {
      utilisateurs = await query(`
        SELECT u.*, c.nom AS commune_nom
        FROM utilisateurs u LEFT JOIN communes c ON u.commune_id = c.id
        ORDER BY c.nom ASC, u.nom ASC
      `);
    } else {
      utilisateurs = await query(`
        SELECT u.*, c.nom AS commune_nom
        FROM utilisateurs u LEFT JOIN communes c ON u.commune_id = c.id
        WHERE u.commune_id = $1
        ORDER BY u.role ASC, u.nom ASC
      `, [commune_id]);
      commune_info = await queryOne('SELECT * FROM communes WHERE id = $1', [commune_id]);
    }

    const stats = {
      total: utilisateurs.length,
      actifs: utilisateurs.filter(u => u.actif).length,
      admins: utilisateurs.filter(u => u.role === 'admin').length,
      inactifs: utilisateurs.filter(u => !u.actif).length,
    };

    res.render('utilisateurs/liste', {
      page_title: 'Gestion des Utilisateurs',
      utilisateurs,
      stats,
      commune_info,
      is_super_admin: isSuperAdmin,
    });
  } catch (err) { next(err); }
});

// ── Ajouter utilisateur ────────────────────────────────────────────────────
router.get('/ajouter', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const communes = isSuperAdmin
      ? await query('SELECT id, nom FROM communes WHERE statut = $1 ORDER BY nom', ['actif'])
      : [];
    res.render('utilisateurs/ajouter', {
      page_title: 'Ajouter un Agent',
      erreurs: [],
      body: {},
      communes,
      is_super_admin: isSuperAdmin,
      commune_id_session: req.session.commune_id,
    });
  } catch (err) { next(err); }
});

router.post('/ajouter', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const communes = isSuperAdmin
      ? await query('SELECT id, nom FROM communes WHERE statut = $1 ORDER BY nom', ['actif'])
      : [];

    const erreurs = [];
    const email = (req.body.email || '').trim();
    const nom = (req.body.nom || '').trim();
    const prenom = (req.body.prenom || '').trim();
    const mot_de_passe = req.body.mot_de_passe || '';
    const confirmer_mdp = req.body.confirmer_mdp || '';

    // Role restrictions: admin commune can only create gestionnaire/lecteur
    let role = req.body.role || 'lecteur';
    if (!isSuperAdmin && role === 'admin') {
      role = 'gestionnaire'; // demote silently
    }

    // commune_id: from session for commune admin, from form for super_admin
    const commune_id = isSuperAdmin
      ? parseInt(req.body.commune_id, 10)
      : req.session.commune_id;

    if (!email) erreurs.push("L'email est requis");
    if (!nom) erreurs.push('Le nom est requis');
    if (!prenom) erreurs.push('Le prénom est requis');
    if (!commune_id) erreurs.push('La commune est requise');
    if (!mot_de_passe) erreurs.push('Le mot de passe est requis');
    if (mot_de_passe.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
    if (mot_de_passe !== confirmer_mdp) erreurs.push('Les mots de passe ne correspondent pas');

    if (!erreurs.length) {
      const exists = await queryOne('SELECT id FROM utilisateurs WHERE email = $1', [email]);
      if (exists) erreurs.push('Cet email est déjà utilisé');
    }

    if (erreurs.length) {
      return res.render('utilisateurs/ajouter', {
        page_title: 'Ajouter un Agent', erreurs, body: req.body,
        communes, is_super_admin: isSuperAdmin, commune_id_session: req.session.commune_id,
      });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const roleIdMap = { admin: 1, gestionnaire: 3, lecteur: 5 };

    await query(
      `INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, password_hash, role, statut, actif, doit_changer_mdp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'actif', true, false, NOW())`,
      [commune_id, roleIdMap[role] || 5, nom, prenom, email, hash, role]
    );

    await logAction(req, 'CREATE_UTILISATEUR', `Compte ${role} créé : ${prenom} ${nom} (${email})`);
    setFlash(req, 'success', `✅ Compte agent créé pour ${prenom} ${nom}.`);
    res.redirect('/utilisateurs/liste');
  } catch (err) { next(err); }
});

// ── Modifier utilisateur ───────────────────────────────────────────────────
router.get('/modifier/:id', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const user_id = parseInt(req.params.id, 10);
    const user = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [user_id]);
    if (!user) { setFlash(req, 'danger', 'Utilisateur introuvable'); return res.redirect('/utilisateurs/liste'); }

    // Commune admin cannot modify accounts of other communes
    if (!isSuperAdmin && user.commune_id !== req.session.commune_id) {
      setFlash(req, 'danger', 'Accès refusé.');
      return res.redirect('/utilisateurs/liste');
    }

    res.render('utilisateurs/modifier', {
      page_title: 'Modifier un Agent', user, user_id, erreurs: [], is_super_admin: isSuperAdmin,
    });
  } catch (err) { next(err); }
});

router.post('/modifier/:id', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const user_id = parseInt(req.params.id, 10);
    const erreurs = [];
    const email = (req.body.email || '').trim();
    const nom = (req.body.nom || '').trim();
    const prenom = (req.body.prenom || '').trim();
    const nouveau_mdp = req.body.nouveau_mdp || '';
    const confirmer_mdp = req.body.confirmer_mdp || '';
    let role = req.body.role || 'lecteur';

    if (!email) erreurs.push("L'email est requis");
    if (!nom) erreurs.push('Le nom est requis');
    if (!prenom) erreurs.push('Le prénom est requis');

    // Commune admin cannot promote to admin role
    if (!isSuperAdmin && role === 'admin') role = 'gestionnaire';

    if (nouveau_mdp) {
      if (nouveau_mdp.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
      if (nouveau_mdp !== confirmer_mdp) erreurs.push('Les mots de passe ne correspondent pas');
    }

    const user = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [user_id]);
    if (!user) { setFlash(req, 'danger', 'Utilisateur introuvable'); return res.redirect('/utilisateurs/liste'); }
    if (!isSuperAdmin && user.commune_id !== req.session.commune_id) {
      setFlash(req, 'danger', 'Accès refusé.'); return res.redirect('/utilisateurs/liste');
    }

    if (!erreurs.length) {
      const exists = await queryOne('SELECT id FROM utilisateurs WHERE email = $1 AND id != $2', [email, user_id]);
      if (exists) erreurs.push('Cet email est déjà utilisé');
    }

    if (erreurs.length) {
      return res.render('utilisateurs/modifier', {
        page_title: 'Modifier un Agent', user: { ...user, email, nom, prenom, role },
        user_id, erreurs, is_super_admin: isSuperAdmin,
      });
    }

    const roleIdMap = { admin: 1, gestionnaire: 3, lecteur: 5 };
    if (nouveau_mdp) {
      const hash = await bcrypt.hash(nouveau_mdp, 10);
      await query(
        `UPDATE utilisateurs SET email=$1, nom=$2, prenom=$3, role=$4, role_id=$5, password_hash=$6, doit_changer_mdp=false WHERE id=$7`,
        [email, nom, prenom, role, roleIdMap[role] || 5, hash, user_id]
      );
    } else {
      await query(
        `UPDATE utilisateurs SET email=$1, nom=$2, prenom=$3, role=$4, role_id=$5 WHERE id=$6`,
        [email, nom, prenom, role, roleIdMap[role] || 5, user_id]
      );
    }

    await logAction(req, 'MODIFY_UTILISATEUR', `Compte ${user.email} modifié (rôle: ${role})`);
    setFlash(req, 'success', 'Utilisateur modifié avec succès !');
    res.redirect('/utilisateurs/liste');
  } catch (err) { next(err); }
});

// ── Supprimer utilisateur ──────────────────────────────────────────────────
router.post('/supprimer/:id', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    const user_id = parseInt(req.params.id, 10);
    if (!req.body.confirmer) return res.redirect('/utilisateurs/liste');
    if (user_id === req.session.utilisateur_id) {
      setFlash(req, 'danger', 'Vous ne pouvez pas supprimer votre propre compte.');
      return res.redirect('/utilisateurs/liste');
    }
    const user = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [user_id]);
    if (!user) { setFlash(req, 'danger', 'Introuvable'); return res.redirect('/utilisateurs/liste'); }
    if (!isSuperAdmin && user.commune_id !== req.session.commune_id) {
      setFlash(req, 'danger', 'Accès refusé.'); return res.redirect('/utilisateurs/liste');
    }
    await query('DELETE FROM utilisateurs WHERE id = $1', [user_id]);
    await logAction(req, 'DELETE_UTILISATEUR', `Compte ${user.prenom} ${user.nom} (${user.email}) supprimé`);
    setFlash(req, 'success', 'Utilisateur supprimé.');
    res.redirect('/utilisateurs/liste');
  } catch (err) { setFlash(req, 'danger', `Erreur: ${err.message}`); res.redirect('/utilisateurs/liste'); }
});

// ── Journal de la commune (pour admin commune) ─────────────────────────────
router.get('/journal', requireAdmin, ownCommuneOnly, async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.utilisateur_role === 'super_admin';
    if (isSuperAdmin) return res.redirect('/super-admin/journal');

    const commune_id = req.session.commune_id;
    const commune_info = await queryOne('SELECT * FROM communes WHERE id = $1', [commune_id]);

    const entrees = await query(`
      SELECT j.*,
             u.prenom || ' ' || u.nom AS agent_nom,
             u.role AS agent_role,
             u.email AS agent_email,
             c.nom AS commune_nom
      FROM journal j
      LEFT JOIN utilisateurs u ON j.utilisateur_id = u.id
      LEFT JOIN communes c ON j.commune_id = c.id
      WHERE j.commune_id = $1
      ORDER BY j.created_at DESC LIMIT 200
    `, [commune_id]);

    res.render('utilisateurs/journal', {
      page_title: 'Journal des Actions',
      entrees,
      commune_info,
    });
  } catch (err) { next(err); }
});

module.exports = router;
