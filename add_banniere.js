const { pool } = require('./db');

async function run() {
  try {
    const res = await pool.query(`ALTER TABLE communes ADD COLUMN banniere VARCHAR(255)`);
    console.log('Column added successfully', res);
  } catch(e) {
    console.error('Error adding column:', e.message);
  } finally {
    pool.end();
  }
}
run();
