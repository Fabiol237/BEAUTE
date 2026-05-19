const express = require('express');
const { requireConnexion } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes /super-admin/* redirigent vers /dashboard
// Le dashboard principal gère les deux rôles (super_admin et admin commune)
router.use(requireConnexion, (req, res) => {
  res.redirect('/dashboard');
});

module.exports = router;
