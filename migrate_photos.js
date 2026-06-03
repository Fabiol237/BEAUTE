/**
 * migrate_photos.js
 * ─────────────────────────────────────────────────────────────────
 * Migre TOUTES les photos locales vers Supabase Storage :
 *   - projets.photo          (bannière de projet)
 *   - communes.banniere      (bannière de commune)
 *   - photos.fichier_url     (galerie photos d'un projet)
 *   - signalement_photos.fichier_url (pièces jointes citoyennes)
 *
 * Usage : node migrate_photos.js
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// ── Config ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'public', 'assets', 'uploads');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const BUCKET      = 'uploads';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Variables SUPABASE_URL et SUPABASE_ANON_KEY manquantes dans .env');
  process.exit(1);
}

if (!global.WebSocket) {
  global.WebSocket = require('ws');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const pool = new Pool({
  host    : process.env.DB_HOST,
  user    : process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'postgres',
  port    : parseInt(process.env.DB_PORT) || 5432,
  ssl     : { rejectUnauthorized: false },
});

// ── Helper : upload un fichier local → Supabase ───────────────────
async function uploadFile(localPath, destName, mimeType) {
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(destName, buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(destName);
  return data.publicUrl;
}

// ── Détecte le mime-type d'après l'extension ──────────────────────
function mimeOf(filename) {
  const ext = path.extname(filename).toLowerCase();
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
           '.png': 'image/png', '.gif': 'image/gif',
           '.webp': 'image/webp' }[ext] || 'image/jpeg';
}

// ── Migre une colonne d'une table ─────────────────────────────────
async function migrateColumn(client, table, idCol, photoCol, label) {
  const { rows } = await client.query(
    `SELECT ${idCol}, ${photoCol} FROM ${table}
     WHERE ${photoCol} IS NOT NULL
       AND ${photoCol} <> ''
       AND ${photoCol} NOT LIKE 'http%'`
  );
  console.log(`\n📁  ${label} : ${rows.length} entrée(s) à migrer`);

  let ok = 0, skip = 0, fail = 0;

  for (const row of rows) {
    const filename = row[photoCol];
    const localPath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.log(`   ⚠️  Fichier introuvable localement : ${filename} — ignoré`);
      skip++;
      continue;
    }

    try {
      const destName = `migrated_${Date.now()}_${Math.random().toString(36).slice(2)}_${path.basename(filename)}`;
      const url = await uploadFile(localPath, destName, mimeOf(filename));
      await client.query(
        `UPDATE ${table} SET ${photoCol} = $1 WHERE ${idCol} = $2`,
        [url, row[idCol]]
      );
      console.log(`   ✅  ${filename}  →  ${url.substring(0, 60)}…`);
      ok++;
    } catch (err) {
      console.log(`   ❌  Erreur pour ${filename} : ${err.message}`);
      fail++;
    }
  }

  console.log(`   → Résultat : ${ok} migrée(s), ${skip} ignorée(s), ${fail} en erreur`);
  return { ok, skip, fail };
}

// ── Point d'entrée ────────────────────────────────────────────────
async function main() {
  console.log('🚀  Démarrage de la migration des photos vers Supabase…\n');
  const client = await pool.connect();

  try {
    await migrateColumn(client, 'projets',           'id', 'photo',       'Bannières de projets');
    await migrateColumn(client, 'communes',           'id', 'banniere',    'Bannières de communes');
    await migrateColumn(client, 'photos',             'id', 'fichier_url', 'Galeries photos');
    await migrateColumn(client, 'signalement_photos', 'id', 'fichier_url', 'Photos de signalements');

    console.log('\n🎉  Migration terminée avec succès !');
  } catch (err) {
    console.error('\n💥  Erreur fatale :', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
