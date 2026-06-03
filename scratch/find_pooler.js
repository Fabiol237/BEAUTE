const { Client } = require('pg');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-north-1',
  'me-south-1',
  'sa-east-1'
];

const projectRef = 'aewdvkgozowfypbyliwt';
const password = 'Z0kof@ro123';
const user = `postgres.${projectRef}`;
const database = 'postgres';
const port = 6543;

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host,
    user,
    password,
    database,
    port,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000 // short timeout
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return host;
  } catch (error) {
    if (client) {
      client.end().catch(() => {});
    }
    // Only return null, don't throw, we expect most to fail
    return null;
  }
}

async function findPooler() {
  console.log(`Recherche du pooler Supabase pour le projet ${projectRef}...`);
  for (const region of regions) {
    process.stdout.write(`Test de la région ${region}... `);
    const successHost = await testRegion(region);
    if (successHost) {
      console.log('✅ SUCCÈS !');
      console.log(`\nTrouvé : ${successHost}`);
      return successHost;
    } else {
      console.log('❌ Échec.');
    }
  }
  console.log('\nAucun pooler trouvé.');
}

findPooler();
