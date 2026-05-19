const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne } = require('../db');
const { requireConnexion, requireSuperAdmin } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { logAction } = require('../middleware/journal');

const router = express.Router();
router.use(requireConnexion, requireSuperAdmin);

// ── Liste de tous les comptes de toutes les communes ───────────────────────
router.get('/comptes', async (req, res, next) => {
  try {
    const { statut, commune_id, role } = req.query;
    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');

    let sql = `
      SELECT u.id, u.prenom, u.nom, u.email, u.role, u.statut, u.actif,
             u.commune_id, u.created_at, u.derniere_connexion, u.doit_changer_mdp,
             c.nom AS commune_nom
      FROM utilisateurs u
      LEFT JOIN communes c ON u.commune_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (statut) { conditions.push('u.statut = $' + (params.length + 1)); params.push(statut); }
    if (commune_id) { conditions.push('u.commune_id = $' + (params.length + 1)); params.push(commune_id); }
    if (role) { conditions.push('u.role = $' + (params.length + 1)); params.push(role); }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY c.nom ASC, u.role ASC, u.nom ASC';

    const utilisateurs = await query(sql, params);

    res.render('super-admin/comptes/liste', {
      page_title: 'Gestion des Comptes Communes',
      utilisateurs,
      communes,
      filtre: { statut, commune_id, role },
    });
  } catch (err) { next(err); }
});

// ── Formulaire création compte par Super Admin ─────────────────────────────
router.get('/comptes/creer', async (req, res, next) => {
  try {
    const communes = await query('SELECT id, nom FROM communes WHERE statut = $1 ORDER BY nom', ['actif']);
    res.render('super-admin/comptes/creer', {
      page_title: 'Créer un Compte Responsable',
      communes,
      erreurs: [],
      body: {},
    });
  } catch (err) { next(err); }
});

router.post('/comptes/creer', async (req, res, next) => {
  try {
    const communes = await query('SELECT id, nom FROM communes WHERE statut = $1 ORDER BY nom', ['actif']);
    const { prenom, nom, email, role, commune_id, mot_de_passe } = req.body;
    const erreurs = [];

    if (!prenom) erreurs.push('Le prénom est requis');
    if (!nom) erreurs.push('Le nom est requis');
    if (!email) erreurs.push("L'email est requis");
    if (!commune_id) erreurs.push('La commune est requise');
    if (!role || !['admin', 'gestionnaire', 'lecteur'].includes(role)) erreurs.push('Le rôle est invalide');
    if (!mot_de_passe || mot_de_passe.length < 6) erreurs.push('Le mot de passe doit faire au moins 6 caractères');

    if (!erreurs.length) {
      const exists = await queryOne('SELECT id FROM utilisateurs WHERE email = $1', [email]);
      if (exists) erreurs.push('Cet email est déjà utilisé');
    }

    if (erreurs.length) {
      return res.render('super-admin/comptes/creer', {
        page_title: 'Créer un Compte Responsable',
        communes, erreurs, body: req.body,
      });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const roleIdMap = { admin: 1, gestionnaire: 3, lecteur: 5 };

    await query(
      `INSERT INTO utilisateurs (commune_id, role_id, nom, prenom, email, password_hash, role, statut, actif, doit_changer_mdp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'actif', true, true, NOW())`,
      [parseInt(commune_id), roleIdMap[role] || 5, nom, prenom, email, hash, role]
    );

    await logAction(req, 'CREATE_COMPTE', `Compte ${role} créé pour ${prenom} ${nom} (${email}) — Commune ID: ${commune_id}`);
    setFlash(req, 'success', `✅ Compte créé pour ${prenom} ${nom}. Il devra changer son mot de passe à la première connexion.`);
    res.redirect('/super-admin/comptes');
  } catch (err) { next(err); }
});

// ── Toggle statut ──────────────────────────────────────────────────────────
router.post('/comptes/:id/toggle', async (req, res, next) => {
  try {
    const u = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [req.params.id]);
    if (!u) return res.redirect('/super-admin/comptes');

    const newStatut = u.statut === 'actif' ? 'suspendu' : 'actif';
    await query('UPDATE utilisateurs SET statut = $1, actif = $2 WHERE id = $3', [newStatut, newStatut === 'actif', req.params.id]);

    await logAction(req, 'TOGGLE_COMPTE', `Compte ${u.prenom} ${u.nom} (${u.email}) → ${newStatut}`);
    setFlash(req, newStatut === 'actif' ? 'success' : 'warning', `Compte de ${u.prenom} ${u.nom} ${newStatut === 'actif' ? 'réactivé' : 'suspendu'}.`);
    res.redirect('/super-admin/comptes');
  } catch (err) { next(err); }
});

// ── Modifier rôle d'un compte ──────────────────────────────────────────────
router.post('/comptes/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'gestionnaire', 'lecteur'].includes(role)) {
      setFlash(req, 'danger', 'Rôle invalide');
      return res.redirect('/super-admin/comptes');
    }
    const u = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [req.params.id]);
    if (!u) return res.redirect('/super-admin/comptes');

    const roleIdMap = { admin: 1, gestionnaire: 3, lecteur: 5 };
    await query('UPDATE utilisateurs SET role = $1, role_id = $2 WHERE id = $3', [role, roleIdMap[role], req.params.id]);

    await logAction(req, 'CHANGE_ROLE', `Rôle de ${u.prenom} ${u.nom} changé de ${u.role} → ${role}`);
    setFlash(req, 'success', `Rôle de ${u.prenom} ${u.nom} mis à jour → ${role}`);
    res.redirect('/super-admin/comptes');
  } catch (err) { next(err); }
});

// ── Supprimer un compte ────────────────────────────────────────────────────
router.post('/comptes/:id/supprimer', async (req, res, next) => {
  try {
    const u = await queryOne('SELECT * FROM utilisateurs WHERE id = $1', [req.params.id]);
    if (!u) { setFlash(req, 'danger', 'Compte introuvable'); return res.redirect('/super-admin/comptes'); }

    await query('DELETE FROM utilisateurs WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE_COMPTE', `Compte ${u.prenom} ${u.nom} (${u.email}) supprimé`);
    setFlash(req, 'success', `Compte de ${u.prenom} ${u.nom} supprimé.`);
    res.redirect('/super-admin/comptes');
  } catch (err) { next(err); }
});

// ── Journal global ─────────────────────────────────────────────────────────
router.get('/journal', async (req, res, next) => {
  try {
    const { commune_id, action, depuis } = req.query;
    const communes = await query('SELECT id, nom FROM communes ORDER BY nom');

    let sql = `
      SELECT j.*, 
             u.prenom || ' ' || u.nom AS agent_nom,
             u.role AS agent_role,
             u.email AS agent_email,
             c.nom AS commune_nom
      FROM journal j
      LEFT JOIN utilisateurs u ON j.utilisateur_id = u.id
      LEFT JOIN communes c ON j.commune_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (commune_id) { conditions.push('j.commune_id = $' + (params.length + 1)); params.push(commune_id); }
    if (action) { conditions.push('j.action ILIKE $' + (params.length + 1)); params.push('%' + action + '%'); }
    if (depuis) { conditions.push('j.created_at >= $' + (params.length + 1)); params.push(depuis); }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY j.created_at DESC LIMIT 500';

    const entrees = await query(sql, params);

    res.render('super-admin/journal', {
      page_title: 'Journal des Actions',
      entrees,
      communes,
      filtre: { commune_id, action, depuis },
    });
  } catch (err) { next(err); }
});

module.exports = router;
