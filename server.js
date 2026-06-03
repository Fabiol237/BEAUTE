const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const methodOverride = require('method-override');
const i18n = require('i18n');
const config = require('./config');
const { pool } = require('./db');
const attachLocals = require('./middleware/locals');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const carteRoutes = require('./routes/carte');
const projetsRoutes = require('./routes/projets');
const budgetRoutes = require('./routes/budget');
const utilisateursRoutes = require('./routes/utilisateurs');
const portailRoutes = require('./routes/portail');
const superAdminRoutes = require('./routes/superAdmin');
const communesRoutes = require('./routes/communes');
const alertesRoutes = require('./routes/alertes');
const rapportsRoutes = require('./routes/rapports');
const visualSearchRoutes = require('./routes/visualSearch');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Trust Vercel proxy for secure cookies

i18n.configure({
  locales: ['fr', 'en'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'fr',
  objectNotation: true
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session'
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    },
  })
);

app.use(i18n.init);
app.use((req, res, next) => {
  if (req.query.lang) {
    req.session.lang = req.query.lang;
  }
  if (req.session.lang) {
    i18n.setLocale(req, req.session.lang);
  } else {
    i18n.setLocale(req, 'fr');
  }
  res.locals.currentLang = i18n.getLocale(req);
  next();
});

app.use('/assets', express.static(path.join(config.rootDir, 'public', 'assets')));
// Servir sw.js à la racine (requis pour que le Service Worker ait le bon scope)
app.use(express.static(path.join(config.rootDir, 'public'), { index: false }));
app.use(attachLocals);


app.get('/', (req, res) => {
  res.redirect('/portail-citoyen');
});

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/carte', carteRoutes);
app.use('/projets', projetsRoutes);
app.use('/budget', budgetRoutes);
app.use('/utilisateurs', utilisateursRoutes);
app.use('/portail-citoyen', portailRoutes);
app.use('/super-admin', superAdminRoutes);
app.use('/communes', communesRoutes);
app.use('/alertes', alertesRoutes);
app.use('/rapports', rapportsRoutes);
app.use('/api', visualSearchRoutes);

app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

app.use((err, req, res, next) => {
  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  const errorDetails = isDev ? `<pre style="background:#f4f4f4;padding:15px;border:1px solid #ddd;white-space:pre-wrap;">${err.stack || err.message || err}</pre>` : "<p>Une erreur inattendue s'est produite. Veuillez réessayer plus tard.</p>";
  res.status(500).send(`<h1>Erreur serveur</h1>${errorDetails}`);
});

async function start() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Base de données PostgreSQL connectée.');
  } catch (err) {
    console.warn('⚠️  [Attention] Impossible de se connecter à la base de données:', err.message);
  }
  
  app.listen(config.port, () => {
    console.log(`🏙️  ${config.siteName} — http://localhost:${config.port}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  start();
}

module.exports = app;
