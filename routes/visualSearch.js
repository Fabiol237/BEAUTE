const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// ══════════════════════════════════════════════════════════════
//  POST /api/recherche-visuelle
//  Corps : { keywords: string[] }  — labels détectés par MobileNet
//  Retourne : { projets: [], keywords: [] }
// ══════════════════════════════════════════════════════════════
router.post('/recherche-visuelle', async (req, res) => {
  try {
    const { keywords = [] } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.json({ projets: [], keywords: [], message: 'Aucun mot-clé fourni.' });
    }

    // Nettoyage et troncature des mots-clés
    const cleanKeywords = keywords
      .map(k => String(k).trim().substring(0, 80))
      .filter(Boolean)
      .slice(0, 5);

    const searchTerms = cleanKeywords.join(' ');

    let projets = [];

    // ── Tentative 1 : pg_trgm ─────────────────────────────────
    try {
      const trgmSql = `
        SELECT DISTINCT
          p.id,
          p.titre,
          p.description,
          p.statut,
          p.avancement_physique,
          p.photo,
          p.budget_actuel,
          c.nom  AS commune_nom,
          tp.nom AS type_nom,
          GREATEST(
            COALESCE(word_similarity($1, p.titre), 0),
            COALESCE(word_similarity($1, p.description), 0),
            COALESCE(word_similarity($1, tp.nom), 0)
          ) AS score
        FROM projets p
        LEFT JOIN communes       c  ON c.id  = p.commune_id
        LEFT JOIN types_projets  tp ON tp.id = p.type_projet_id
        WHERE p.visible_public = TRUE
          AND (
            word_similarity($1, p.titre)                    > 0.08
            OR word_similarity($1, COALESCE(p.description,'')) > 0.08
            OR word_similarity($1, tp.nom)                  > 0.08
            OR p.titre       ILIKE $2
            OR tp.nom        ILIKE $2
          )
        ORDER BY score DESC
        LIMIT 20
      `;

      const firstKeyword = cleanKeywords[0];
      const result = await pool.query(trgmSql, [
        searchTerms,
        `%${firstKeyword}%`,
      ]);
      projets = result.rows;
    } catch (trgmErr) {
      // ── Fallback : ILIKE simple ─────────────────────────────
      console.warn('[VisualSearch] pg_trgm indisponible — fallback ILIKE:', trgmErr.message);

      const conditions = cleanKeywords.map((_, i) =>
        `(p.titre ILIKE $${i + 1} OR COALESCE(p.description,'') ILIKE $${i + 1} OR tp.nom ILIKE $${i + 1})`
      ).join(' OR ');

      const ilikeSql = `
        SELECT DISTINCT
          p.id, p.titre, p.description, p.statut,
          p.avancement_physique, p.photo, p.budget_actuel,
          c.nom  AS commune_nom,
          tp.nom AS type_nom
        FROM projets p
        LEFT JOIN communes      c  ON c.id  = p.commune_id
        LEFT JOIN types_projets tp ON tp.id = p.type_projet_id
        WHERE p.visible_public = TRUE AND (${conditions})
        ORDER BY p.created_at DESC
        LIMIT 20
      `;

      const result = await pool.query(ilikeSql, cleanKeywords.map(k => `%${k}%`));
      projets = result.rows;
    }

    return res.json({ projets, keywords: cleanKeywords });

  } catch (err) {
    console.error('[VisualSearch] Erreur serveur:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
