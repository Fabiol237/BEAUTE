const config = require('../config');
const helpers = require('../lib/helpers');
const { renderFlash } = require('./flash');

function attachLocals(req, res, next) {
  res.locals.siteUrl = config.siteUrl;
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
  next();
}

module.exports = attachLocals;
