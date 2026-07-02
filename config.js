require('dotenv').config();
const path = require('path');

function resolveSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  return `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`;
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  siteUrl: resolveSiteUrl(),
  siteName: process.env.SITE_NAME || 'Suivi Projets Municipaux',
  sessionSecret: process.env.SESSION_SECRET || 'suivi-projets-dev-secret',
  invitationSecret: process.env.SESSION_SECRET || 'suivi-projets-dev-secret',
  db: {
    host: process.env.DB_HOST || 'db.aewdvkgozowfypbyliwt.supabase.co',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'postgres',
  },
  rootDir: __dirname,
  uploadsDir: path.join(__dirname, 'public', 'assets', 'uploads'),
  signalementsDir: path.join(__dirname, 'public', 'assets', 'uploads', 'signalements'),
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'da22qmu1g',
    apiKey: process.env.CLOUDINARY_API_KEY || '723179179819453',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'cznVoKxaUng2jaum31S95ji7kUA'
  }
};
