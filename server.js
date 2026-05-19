const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
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

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use('/assets', express.static(path.join(config.rootDir, 'assets')));
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

app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(`<h1>Erreur serveur</h1><pre style="background:#f4f4f4;padding:15px;border:1px solid #ddd;white-space:pre-wrap;">${err.stack || err.message || err}</pre>`);
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
