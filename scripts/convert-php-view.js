/**
 * Convertit un fichier PHP (vue) en EJS approximatif.
 * Usage: node scripts/convert-php-view.js ../login.php views/login.ejs
 */
const fs = require('fs');
const path = require('path');

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node convert-php-view.js <source.php> <dest.ejs>');
  process.exit(1);
}

let c = fs.readFileSync(path.resolve(src), 'utf8');

// Retirer le bloc PHP d'en-tête (require, logique serveur)
c = c.replace(/^<\?php[\s\S]*?\?>\s*/m, '');

// SITE_URL
c = c.replace(/<\?=\s*SITE_URL\s*\?>/g, '<%= siteUrl %>');

// e() helper
c = c.replace(/<\?=\s*e\(\$_POST\[([^\]]+)\]\s*\?\?\s*''\)\s*\?>/g, "<%= e(body.$1 || '') %>");
c = c.replace(/<\?=\s*e\(\$([a-zA-Z0-9_\[\]'"]+)\)\s*\?>/g, '<%= e($1) %>');

// Simple echo variables
c = c.replace(/<\?=\s*\$([a-zA-Z0-9_\[\]'"]+)\s*\?>/g, '<%= $1 %>');

// get_flash, get_statut_badge, etc.
c = c.replace(/<\?=\s*get_flash\(\)\s*\?>/g, '<%- getFlash() %>');
c = c.replace(/<\?=\s*get_statut_badge\(\$([^)]+)\)\s*\?>/g, '<%- getStatutBadge($1) %>');
c = c.replace(/<\?=\s*get_progress_class\(\$([^)]+)\)\s*\?>/g, '<%= getProgressClass($1) %>');
c = c.replace(/<\?=\s*format_montant\(\$([^)]+)\)\s*\?>/g, '<%= formatMontant($1) %>');
c = c.replace(/<\?=\s*format_date\(\$([^)]+)\)\s*\?>/g, '<%= formatDate($1) %>');
c = c.replace(/<\?=\s*format_datetime\(\$([^)]+)\)\s*\?>/g, '<%= formatDatetime($1) %>');
c = c.replace(/<\?=\s*jours_restants\(\$([^)]+)\)\s*\?>/g, '<%= joursRestants($1) %>');
c = c.replace(/<\?=\s*date\('([^']+)'\)\s*\?>/g, "<%= todayFr() %>");
c = c.replace(/<\?=\s*date\('Y-m-d'\)\s*\?>/g, '<%= todayIso() %>');

// number_format
c = c.replace(/<\?=\s*number_format\(\$([^,]+),\s*([^)]+)\)\s*\?>/g, '<%= Number($1).toLocaleString("fr-FR", { maximumFractionDigits: $2 }) %>');

// foreach
c = c.replace(/<\?php\s+foreach\s*\(\$([^)]+)\s+as\s+\$([^)]+)\):\s*\?>/g, '<% $1.forEach(function($2) { %>');
c = c.replace(/<\?php\s+endforeach;\s*\?>/g, '<% }); %>');

// if empty
c = c.replace(/<\?php\s+if\s*\(empty\(\$([^)]+)\)\):\s*\?>/g, '<% if (!$1 || !$1.length) { %>');
c = c.replace(/<\?php\s+if\s*\(!empty\(\$([^)]+)\)\):\s*\?>/g, '<% if ($1 && $1.length) { %>');
c = c.replace(/<\?php\s+if\s*\(\$([^)]+)\):\s*\?>/g, '<% if ($1) { %>');
c = c.replace(/<\?php\s+endif;\s*\?>/g, '<% } %>');

// require footer/header - strip
c = c.replace(/<\?php\s+require_once[^;]+;\s*\?>/g, '');

// json_encode for charts - keep as EJS unescaped
c = c.replace(/<\?=\s*json_encode\(([^)]+)\)\s*\?>/g, '<%- JSON.stringify($1) %>');

// Remaining PHP blocks - comment for manual fix
c = c.replace(/<\?php[\s\S]*?\?>/g, '<!-- TODO: PHP block removed -->');

// .php links -> clean routes
c = c.replace(/\.php/g, '');

// Relative assets
c = c.replace(/src="\/projet-municipal\//g, 'src="<%= siteUrl %>/');
c = c.replace(/href="\.\.\/assets\//g, 'href="<%= siteUrl %>/assets/');
c = c.replace(/url\('\.\.\/assets\//g, "url('<%= siteUrl %>/assets/");

fs.mkdirSync(path.dirname(path.resolve(dest)), { recursive: true });
fs.writeFileSync(path.resolve(dest), c, 'utf8');
console.log('Converted:', dest);
