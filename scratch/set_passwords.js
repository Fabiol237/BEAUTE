require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('../db');

async function main() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Generated hash for "admin123":', hash);

    await query('UPDATE munipro_admins SET password_hash = ? WHERE email = ?', [hash, 'admin@munipro.cm']);
    console.log('Updated munipro_admins password.');

    await query('UPDATE utilisateurs SET password_hash = ? WHERE email = ?', [hash, 'admin@douala1.cm']);
    console.log('Updated utilisateurs password.');
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
