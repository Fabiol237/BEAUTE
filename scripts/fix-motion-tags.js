const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.ejs')) {
      let c = fs.readFileSync(p, 'utf8');
      const before = c;
      c = c.replaceAll('motion', 'div');
      if (c !== before) {
        fs.writeFileSync(p, c);
        console.log('Fixed', p);
      }
    }
  }
}

walk(path.join(__dirname, '..', 'views'));
