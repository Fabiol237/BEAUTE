const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

// Polyfill pour WebSocket (requis par @supabase/supabase-js < v22 sur Node 21)
if (!global.WebSocket) {
  global.WebSocket = require('ws');
}

const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: { persistSession: false },
});

/**
 * Uploade un fichier vers Supabase Storage et retourne l'URL publique.
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} filename - Le nom final du fichier (ex: projet_123.jpg)
 * @param {string} mimeType - Le type MIME (ex: image/jpeg)
 * @returns {Promise<string>} L'URL publique du fichier
 */
async function uploadToSupabase(fileBuffer, filename, mimeType) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filename, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error('Erreur upload Supabase: ' + error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

module.exports = { supabase, uploadToSupabase };
