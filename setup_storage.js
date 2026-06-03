require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Assign ws to global for Supabase realtime compatibility on Node < 22
global.WebSocket = require('ws');

const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: { persistSession: false },
});

async function setupBucket() {
  console.log('🔄 Création du bucket "uploads" dans Supabase Storage...');
  
  // Create bucket
  const { data, error } = await supabase.storage.createBucket('uploads', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (
      error.message.includes('already exists') || 
      error.message.includes('duplicate key') ||
      error.message.includes('existe déjà') ||
      error.message.includes('la ressource existe')
    ) {
      console.log('✅ Le bucket "uploads" existe déjà.');
    } else {
      console.error('❌ Erreur lors de la création du bucket:', error);
      return;
    }
  } else {
    console.log('✅ Bucket "uploads" créé avec succès !', data);
  }

  console.log('✅ Configuration Supabase Storage terminée.');
}

setupBucket();
