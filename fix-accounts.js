require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Nouveau mot de passe pour le super admin
    const newPassword = 'Admin2024!';
    const hash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le super admin dans munipro_admins
    await client.query(
      `UPDATE munipro_admins SET password_hash = $1 WHERE email = 'admin@munipro.cm'`,
      [hash]
    );
    console.log('✅ Super admin mis à jour');

    // Changer l'email du compte utilisateur ZOKO FABIOL pour éviter le conflit
    await client.query(
      `UPDATE utilisateurs SET email = 'fabiol@munipro.cm' WHERE id = 13`
    );
    console.log('✅ Email du compte ZOKO FABIOL changé en: fabiol@munipro.cm');

    // Hasher un mot de passe pour le compte ZOKO aussi
    const hashUser = await bcrypt.hash('Fabiol2024!', 10);
    await client.query(
      `UPDATE utilisateurs SET password_hash = $1 WHERE id = 13`,
      [hashUser]
    );
    console.log('✅ Mot de passe du compte ZOKO FABIOL mis à jour');

    console.log('\n==============================');
    console.log('SUPER ADMIN (toute la plateforme):');
    console.log('  URL     : /admin/login');
    console.log('  Email   : admin@munipro.cm');
    console.log('  Mot de passe: Admin2024!');
    console.log('\nVOTRE COMPTE PERSONNEL (commune):');
    console.log('  URL     : /login');
    console.log('  Email   : fabiol@munipro.cm');
    console.log('  Mot de passe: Fabiol2024!');
    console.log('==============================');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
