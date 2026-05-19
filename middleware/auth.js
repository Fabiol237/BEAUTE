const { estConnecte, peutFaire } = require('../lib/helpers');
const { setFlash } = require('./flash');
const config = require('../config');

function requireConnexion(req, res, next) {
  if (!estConnecte(req.session)) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!peutFaire(req.session, role)) {
      setFlash(req, 'danger', 'Accès refusé.');
      return res.redirect('/dashboard');
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  const role = req.session.utilisateur_role || '';
  if (role !== 'admin' && role !== 'super_admin') {
    setFlash(req, 'danger', 'Accès refusé. Cette page est réservée aux administrateurs.');
    return res.redirect('/dashboard');
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if ((req.session.utilisateur_role || '') !== 'super_admin') {
    setFlash(req, 'danger', 'Accès refusé. Section réservée au Super Administrateur MuniPro.');
    return res.redirect('/dashboard');
  }
  next();
}

function guestOnly(req, res, next) {
  if (estConnecte(req.session)) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireConnexion, requireRole, requireAdmin, requireSuperAdmin, guestOnly };
