const bcrypt = require('bcrypt');

const hashes = [
  '$2b$10$tvd1fMf/4kWLunRpZ81.eeStrOeI8i6REsL7EYCNXsHZe9mj21oSi', // admin@munipro.cm
  '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6'  // admin@douala1.cm
];

const passwords = ['admin123', 'admin', 'password', 'feicom', 'feicom123', 'admin2024', '123456', 'admin@munipro.cm', 'admin@douala1.cm'];

async function main() {
  for (const hash of hashes) {
    console.log('Testing hash:', hash);
    for (const pw of passwords) {
      const match = await bcrypt.compare(pw, hash);
      if (match) {
        console.log(`  MATCH: "${pw}"`);
      }
    }
  }
}

main();
