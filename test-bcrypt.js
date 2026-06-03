const bcrypt = require('bcrypt');

async function test() {
  const hash = '$2b$10$tvd1fMf/4kWLunRpZ81.eeStrOeI8i6REsL7EYCNXsHZe9mj21oSi';
  const h2 = '$2b$10$nzLV86RjrYJOlEI7WMeNoeEs05VMD0vCjznLrAjbYft7ARPs9RQd6';
  
  console.log('admin munipro2024:', await bcrypt.compare('munipro2024', hash));
  console.log('admin commune2024:', await bcrypt.compare('commune2024', hash));
  console.log('user munipro2024:', await bcrypt.compare('munipro2024', h2));
  console.log('user commune2024:', await bcrypt.compare('commune2024', h2));
}

test();
