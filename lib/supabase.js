const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const config = require('../config');

if (!config.supabase.url || !config.supabase.key) {
  console.warn('⚠️  SUPABASE_URL ou SUPABASE_ANON_KEY manquant dans .env — les uploads seront désactivés.');
}

// Client public (lecture, auth)
const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.key || 'placeholder',
  {
    auth: { persistSession: false },
    realtime: { transport: ws },
  }
);

// Client admin avec service_role key — bypasse les RLS pour les uploads serveur
const supabaseAdmin = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceKey || config.supabase.key || 'placeholder',
  {
    auth: { persistSession: false },
    realtime: { transport: ws },
  }
);

/**
 * Uploade un fichier vers Supabase Storage et retourne l'URL publique.
 * Utilise la clé service_role pour bypasser les RLS.
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} filename - Le nom final du fichier (ex: projet_123.jpg)
 * @param {string} mimeType - Le type MIME (ex: image/jpeg)
 * @returns {Promise<string>} L'URL publique du fichier
 */
async function uploadToSupabase(fileBuffer, filename, mimeType) {
  if (!config.supabase.url || !config.supabase.key) {
    throw new Error('Configuration Supabase manquante (SUPABASE_URL ou SUPABASE_ANON_KEY non définis dans .env)');
  }

  const { data, error } = await supabaseAdmin.storage
    .from('uploads')
    .upload(filename, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error('❌ Supabase Storage error:', error);
    if (error.message && error.message.toLowerCase().includes('bucket')) {
      throw new Error('Bucket "uploads" introuvable dans Supabase Storage — créez-le dans le tableau de bord Supabase.');
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw new Error('Clé API Supabase invalide ou insuffisante pour accéder au Storage (vérifiez SUPABASE_SERVICE_KEY dans .env).');
    }
    throw new Error('Erreur upload Supabase: ' + error.message);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('uploads')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

module.exports = { supabase, supabaseAdmin, uploadToSupabase };
