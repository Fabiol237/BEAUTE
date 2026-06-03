const config = require('../config');
const helpers = require('../lib/helpers');
const { renderFlash } = require('./flash');

const { queryOne } = require('../db');

async function attachLocals(req, res, next) {
  // Reconstruit l'URL de base depuis le req pour fonctionner sur Vercel, localhost, etc.
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  res.locals.siteUrl = `${proto}://${host}`;
  res.locals.siteName = config.siteName;
  res.locals.session = req.session;
  res.locals.req = req;
  res.locals.helpers = helpers;
  res.locals.e = helpers.e;
  res.locals.formatMontant = helpers.formatMontant;
  res.locals.formatDate = helpers.formatDate;
  res.locals.formatDatetime = helpers.formatDatetime;
  res.locals.getStatutBadge = helpers.getStatutBadge;
  res.locals.getProgressClass = helpers.getProgressClass;
  res.locals.joursRestants = helpers.joursRestants;
  res.locals.peutFaire = (role) => helpers.peutFaire(req.session, role);
  res.locals.getFlash = () => renderFlash(req, helpers);
  res.locals.todayFr = helpers.todayFr;
  res.locals.todayIso = helpers.todayIso;
  res.locals.imageUrl = helpers.imageUrl;
  res.locals.__ = res.__ || function(key){return key;};

  try {
    const admin = await queryOne('SELECT banniere_globale FROM munipro_admins LIMIT 1');
    res.locals.globalBanner = admin?.banniere_globale || '/assets/images/hero-bg.jpg';
  } catch (err) {
    res.locals.globalBanner = '/assets/images/hero-bg.jpg';
  }

  next();
}

module.exports = attachLocals;
