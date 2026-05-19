function e(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMontant(montant) {
  const n = Number(montant) || 0;
  return (
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }).replace(/\s/g, ' ') +
    ' FCFA'
  );
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR');
}

function formatDatetime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatutBadge(statut) {
  const badges = {
    planifié: '<span class="badge bg-secondary">Planifié</span>',
    en_cours: '<span class="badge bg-primary">En cours</span>',
    suspendu: '<span class="badge bg-warning text-dark">Suspendu</span>',
    terminé: '<span class="badge bg-success">Terminé</span>',
    annulé: '<span class="badge bg-danger">Annulé</span>',
  };
  return (
    badges[statut] ||
    `<span class="badge bg-secondary">${e(statut)}</span>`
  );
}

function getProgressClass(pourcentage) {
  const p = Number(pourcentage) || 0;
  if (p < 30) return 'bg-danger';
  if (p < 60) return 'bg-warning';
  if (p < 90) return 'bg-info';
  return 'bg-success';
}

function joursRestants(dateFin) {
  if (!dateFin) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);
  const diff = Math.round((fin - now) / 86400000);
  return diff;
}

function peutFaire(session, roleRequis) {
  const hierarchie = { lecteur: 1, gestionnaire: 2, admin: 3, super_admin: 10 };
  const roleActuel = session?.utilisateur_role || 'lecteur';
  return (hierarchie[roleActuel] || 0) >= (hierarchie[roleRequis] || 99);
}

function estConnecte(session) {
  return Boolean(session?.utilisateur_id);
}

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseMontantInput(val) {
  if (Array.isArray(val)) {
    val = val.find(v => String(v).trim() !== '') || '0';
  }
  return parseFloat(String(val || '0').replace(/\s/g, '').replace(',', '.')) || 0;
}

module.exports = {
  e,
  formatMontant,
  formatDate,
  formatDatetime,
  getStatutBadge,
  getProgressClass,
  joursRestants,
  peutFaire,
  estConnecte,
  todayFr,
  todayIso,
  parseMontantInput,
};
