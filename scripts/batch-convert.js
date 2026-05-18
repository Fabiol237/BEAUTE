const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const pairs = [
  ['../dashboard.php', 'views/dashboard.ejs'],
  ['../carte.php', 'views/carte.ejs'],
  ['../projets/liste.php', 'views/projets/liste.ejs'],
  ['../projets/details.php', 'views/projets/details.ejs'],
  ['../projets/supprimer.php', 'views/projets/supprimer.ejs'],
  ['../projets/upload-photos.php', 'views/projets/upload-photos.ejs'],
  ['../projets/rapports.php', 'views/projets/rapports.ejs'],
  ['../projets/creer.php', 'views/projets/creer.ejs'],
  ['../projets/modifier.php', 'views/projets/modifier.ejs'],
  ['../budget/liste.php', 'views/budget/liste.ejs'],
  ['../budget/depenses.php', 'views/budget/depenses.ejs'],
  ['../utilisateurs/liste.php', 'views/utilisateurs/liste.ejs'],
  ['../utilisateurs/ajouter.php', 'views/utilisateurs/ajouter.ejs'],
  ['../utilisateurs/modifier.php', 'views/utilisateurs/modifier.ejs'],
  ['../utilisateurs/supprimer.php', 'views/utilisateurs/supprimer.ejs'],
  ['../portail-citoyen/index.php', 'views/portail/index.ejs'],
  ['../portail-citoyen/projets.php', 'views/portail/projets.ejs'],
  ['../portail-citoyen/projet.php', 'views/portail/projet.ejs'],
  ['../portail-citoyen/suggestion.php', 'views/portail/suggestion.ejs'],
];

function wrapAdmin(content, pageTitle) {
  const isPortail = content.includes('nav-portail') || content.includes('hero-section');
  if (isPortail) {
    return content
      .replace(/<\?=\s*SITE_URL\s*\?>/g, '<%= siteUrl %>')
      .replace(/href="\.\.\/assets\//g, 'href="<%= siteUrl %>/assets/')
      .replace(/url\('\.\.\/assets\//g, "url('<%= siteUrl %>/assets/");
  }
  return (
    `<%- include('../partials/header', { page_title: '${pageTitle}' }) %>\n` +
    `<%- include('../partials/navbar') %>\n` +
    content +
    `\n<%- include('../partials/footer') %>`
  );
}

for (const [src, dest] of pairs) {
  const srcPath = path.join(root, src);
  const destPath = path.join(root, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn('Skip missing:', src);
    continue;
  }
  execSync(`node "${path.join(__dirname, 'convert-php-view.js')}" "${srcPath}" "${destPath}"`, {
    cwd: root,
    stdio: 'inherit',
  });
  let c = fs.readFileSync(destPath, 'utf8');
  c = c.replace(/details\.php\?id=/g, '/projets/details/');
  c = c.replace(/modifier\.php\?id=/g, '/projets/modifier/');
  c = c.replace(/supprimer\.php\?id=/g, '/projets/supprimer/');
  c = c.replace(/upload-photos\.php\?id=/g, '/projets/upload-photos/');
  c = c.replace(/rapports\.php\?id=/g, '/projets/rapports/');
  c = c.replace(/generer-rapport\.php\?id=/g, '/projets/generer-rapport/');
  c = c.replace(/depenses\.php\?projet_id=/g, '/budget/depenses?projet_id=');
  c = c.replace(/liste\.php/g, '/liste');
  c = c.replace(/creer\.php/g, '/creer');
  c = c.replace(/dashboard\.php/g, '/dashboard');
  c = c.replace(/carte\.php/g, '/carte');
  c = c.replace(/utilisateurs\/ajouter\.php/g, '/utilisateurs/ajouter');
  c = c.replace(/utilisateurs\/modifier\.php\?id=/g, '/utilisateurs/modifier/');
  c = c.replace(/utilisateurs\/liste\.php/g, '/utilisateurs/liste');
  c = c.replace(/budget\/liste\.php/g, '/budget/liste');
  c = c.replace(/projets\/liste\.php/g, '/projets/liste');
  c = c.replace(/projets\/creer\.php/g, '/projets/creer');
  c = c.replace(/projets\/details\.php/g, '/projets/details');
  c = c.replace(/portail-citoyen\/projets\.php/g, '/portail-citoyen/projets');
  c = c.replace(/portail-citoyen\/projet\.php\?id=/g, '/portail-citoyen/projet/');
  c = c.replace(/portail-citoyen\/suggestion\.php/g, '/portail-citoyen/suggestion');
  c = c.replace(/portail-citoyen\/index\.php/g, '/portail-citoyen');
  c = c.replace(/action="details\.php/g, 'action="/projets/details');
  c = c.replace(/method="POST" action=""/g, 'method="POST"');
  c = c.replace(/method="POST" action=""/g, 'method="POST"');

  const title = dest.includes('portail') ? 'Portail' : path.basename(dest, '.ejs');
  if (!dest.includes('portail/')) {
    c = wrapAdmin(c, title);
  } else {
    c = c.replace(/<\?=\s*\$page_title\s*\?>/g, '<%= page_title %>');
  }
  fs.writeFileSync(destPath, c);
  console.log('OK', dest);
}
