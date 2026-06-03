const { pool } = require('../db');

/**
 * Log an action to the journal table.
 * @param {object} req - Express request
 * @param {string} action - Short action key (e.g. 'CREATE_PROJET')
 * @param {string} description - Human-readable description
 */
async function logAction(req, action, description) {
  try {
    let utilisateur_id = req.session?.utilisateur_id || null;
    const commune_id = req.session?.commune_id || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || null;

    // Le compte super admin a l'id "SUPER_ADMIN" (string) mais la table attend un INTEGER.
    // On met null pour l'ID et on préfixe la description.
    if (utilisateur_id === 'SUPER_ADMIN') {
      utilisateur_id = null;
      description = '[SUPER_ADMIN] ' + description;
    }

    await pool.query(
      `INSERT INTO journal (utilisateur_id, commune_id, action, description, ip, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [utilisateur_id, commune_id, action, description, ip]
    );
  } catch (err) {
    // Never crash the app because of logging failure
    console.error('[Journal] Logging error:', err.message);
  }
}

module.exports = { logAction };
