const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

/**
 * Convertit automatiquement les paramètres MySQL '?' en paramètres PostgreSQL '$1', '$2', etc.
 * Cela permet de garder toutes vos requêtes SQL inchangées !
 */
function convertSqlParameters(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Exécute une requête SQL et retourne TOUS les résultats.
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  const pgSql = convertSqlParameters(sql);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

/**
 * Exécute une requête SQL et retourne le PREMIER résultat.
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Object|null>}
 */
async function queryOne(sql, params = []) {
  const pgSql = convertSqlParameters(sql);
  const result = await pool.query(pgSql, params);
  return result.rows[0] || null;
}

module.exports = { pool, query, queryOne };
