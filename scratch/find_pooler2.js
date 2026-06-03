require('dotenv').config();
const { Client } = require('pg');

const projectRef = 'aewdvkgozowfypbyliwt';
const password = process.env.DB_PASS || 'Z0kof@ro123';
const user = `postgres.${projectRef}`;
const database = 'postgres';

// Essai sur le port 5432 ET 6543
const tests = [];
const regions = ['eu-west-3','eu-west-2','eu-west-1','eu-central-1','eu-north-1','us-east-1','us-west-1'];
const ports = [6543, 5432];

for (const region of regions) {
  for (const port of ports) {
    tests.push({ host: `aws-0-${region}.pooler.supabase.com`, port });
  }
}

async function tryConnect({ host, port }) {
  const client = new Client({ host, user, password, database, port, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (e) {
    try { client.end(); } catch(_){}
    return false;
  }
}

(async () => {
  for (const t of tests) {
    process.stdout.write(`Test ${t.host}:${t.port} ... `);
    const ok = await tryConnect(t);
    if (ok) {
      console.log('✅ SUCCÈS !');
      console.log('\n=== METTRE DANS .env ===');
      console.log(`DB_HOST=${t.host}`);
      console.log(`DB_PORT=${t.port}`);
      console.log(`DB_USER=postgres.${projectRef}`);
      process.exit(0);
    } else {
      console.log('❌');
    }
  }
  console.log('\nAucun pooler trouvé. Projet peut-être en pause sur Supabase.');
})();
