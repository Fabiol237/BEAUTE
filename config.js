require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  siteName: process.env.SITE_NAME || 'Suivi Projets Municipaux',
  sessionSecret: process.env.SESSION_SECRET || 'suivi-projets-dev-secret',
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
  }
};
