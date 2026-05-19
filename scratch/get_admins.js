const { query } = require('../db');

async function main() {
  try {
    const superAdmins = await query('SELECT email FROM munipro_admins');
    console.log('Super Admins:', superAdmins);

    const users = await query('SELECT email, role, statut, actif FROM utilisateurs LIMIT 5');
    console.log('Utilisateurs:', users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
