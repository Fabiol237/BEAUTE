const PDFDocument = require('pdfkit');
const path = require('path');
const { query, queryOne } = require('../db');

const BLEU = '#0F52BA';
const VERT = '#168252';
const GRIS = '#6C757D';

function fcfa(n) {
  return `${(Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;
}

function labelStatut(s) {
  const m = {
    planifié: 'Planifié',
    en_cours: 'En cours',
    suspendu: 'Suspendu',
    terminé: 'Terminé',
    annulé: 'Annulé',
  };
  return m[s] || s || '—';
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('fr-FR');
}

async function loadProjetForPdf(projetId) {
  return queryOne(
    `SELECT p.*, t.nom AS type_nom, t.couleur, c.nom AS commune_nom, r2.nom AS region_nom,
            CONCAT(u.prenom,' ',u.nom) AS responsable_nom, r.nom AS role_nom
     FROM projets p
     LEFT JOIN types_projets t ON p.type_projet_id = t.id
     LEFT JOIN communes c ON p.commune_id = c.id
     LEFT JOIN regions r2 ON c.region_id = r2.id
     LEFT JOIN utilisateurs u ON p.responsable_id = u.id
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE p.id = ?`,
    [projetId]
  );
}

function drawHeader(doc, titre) {
  doc.rect(0, 0, doc.page.width, 70).fill(BLEU);
  doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold');
  doc.text('COMMUNES URBAINES DU LITTORAL', 40, 18, { align: 'center', width: doc.page.width - 80 });
  doc.fontSize(8).font('Helvetica');
  doc.text('République du Cameroun — Suivi des Projets Municipaux', 40, 32, {
    align: 'center',
    width: doc.page.width - 80,
  });
  doc.fontSize(9).text(titre.toUpperCase(), 40, 48, { align: 'center', width: doc.page.width - 80 });
  doc.fillColor('#000');
  doc.y = 90;
}

function sectionTitle(doc, text) {
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(BLEU).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
  doc.strokeColor(BLEU).lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fillColor('#000').font('Helvetica');
}

function keyValue(doc, label, value) {
  doc.fontSize(9).fillColor(GRIS).text(`${label} :`, { continued: true });
  doc.fillColor('#000').font('Helvetica-Bold').text(` ${value || '—'}`);
  doc.font('Helvetica');
}

async function sectionInfos(doc, projet) {
  sectionTitle(doc, '1. Informations générales');
  const rows = [
    ['Titre', projet.titre],
    ['Type', projet.type_nom],
    ['Commune', projet.commune_nom],
    ['Région', projet.region_nom || '—'],
    ['Responsable', projet.responsable_nom],
    ['Date début', fmtDate(projet.date_debut)],
    ['Date fin prévue', fmtDate(projet.date_fin_prevue)],
    ['Statut', labelStatut(projet.statut)],
    ['Avancement', `${projet.avancement_physique || 0} %`],
    ['Budget actuel', fcfa(projet.budget_actuel)],
  ];
  rows.forEach(([l, v]) => keyValue(doc, l, v));
  if (projet.description) {
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(GRIS).text('Description');
    doc.fillColor('#000').fontSize(9).text(projet.description, { width: doc.page.width - 80 });
  }
}

async function sectionBudget(doc, projet) {
  sectionTitle(doc, '2. Budget & Finances');
  const depVal = await queryOne(
    'SELECT COALESCE(SUM(montant),0) AS s FROM depenses WHERE projet_id=? AND validee=1',
    [projet.id]
  );
  const depAtt = await queryOne(
    'SELECT COALESCE(SUM(montant),0) AS s, COUNT(*) AS c FROM depenses WHERE projet_id=? AND validee=0',
    [projet.id]
  );
  const total = Number(depVal.s);
  const budget = Number(projet.budget_actuel) || 0;
  const restant = budget - total;
  const taux = budget > 0 ? Math.round((total / budget) * 1000) / 10 : 0;

  keyValue(doc, 'Budget initial', fcfa(projet.budget_initial));
  keyValue(doc, 'Budget actuel', fcfa(budget));
  keyValue(doc, 'Dépenses validées', fcfa(total));
  keyValue(doc, 'Budget restant', fcfa(restant));
  keyValue(doc, 'Taux de consommation', `${taux} %`);

  if (Number(depAtt.c) > 0) {
    doc.moveDown(0.3);
    doc.fillColor('#B45309').fontSize(8).text(
      `${depAtt.c} dépense(s) en attente (${fcfa(depAtt.s)}) — non incluses.`
    );
    doc.fillColor('#000');
  }

  const depenses = await query(
    `SELECT date_depense, libelle, fournisseur, montant, validee
     FROM depenses WHERE projet_id=? ORDER BY date_depense DESC LIMIT 30`,
    [projet.id]
  );

  if (depenses.length) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Historique des dépenses');
    doc.moveDown(0.2);
    depenses.forEach((d) => {
      doc.fontSize(8).font('Helvetica');
      const line = `${fmtDate(d.date_depense)} — ${d.libelle || ''} — ${fcfa(d.montant)}${d.validee ? '' : ' (en attente)'}`;
      doc.text(line, { width: doc.page.width - 80 });
    });
  }
}

async function sectionAvancement(doc, projet) {
  sectionTitle(doc, "3. Avancement & Planning");
  const av = Number(projet.avancement_physique) || 0;
  const debut = new Date(projet.date_debut);
  const fin = new Date(projet.date_fin_prevue);
  const now = new Date();
  const duree = Math.max(1, Math.round((fin - debut) / 86400000));
  const ecoules = Math.max(0, Math.round((now - debut) / 86400000));
  const pctTemps = Math.min(100, Math.round((ecoules / duree) * 100));
  const restants = Math.round((fin - now) / 86400000);

  keyValue(doc, 'Avancement physique', `${av} %`);
  keyValue(doc, 'Avancement temporel', `${pctTemps} %`);
  keyValue(doc, 'Jours écoulés', `${ecoules} j`);
  keyValue(
    doc,
    'Jours restants',
    restants < 0 ? `${Math.abs(restants)} j de retard` : `${restants} j`
  );

  const jalons = await query(
    'SELECT titre, statut, date_prevue, pourcentage_completion FROM jalons WHERE projet_id=? ORDER BY ordre',
    [projet.id]
  );
  if (jalons.length) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Jalons / phases');
    jalons.forEach((j) => {
      doc.fontSize(8).font('Helvetica').text(
        `• ${j.titre} — ${j.statut} — ${j.pourcentage_completion || 0}% — ${fmtDate(j.date_prevue)}`
      );
    });
  }

  const hist = await query(
    `SELECT a.pourcentage, a.date_constat, a.description, CONCAT(u.prenom,' ',u.nom) AS auteur
     FROM avancements a JOIN utilisateurs u ON a.utilisateur_id=u.id
     WHERE a.projet_id=? ORDER BY a.date_constat DESC LIMIT 10`,
    [projet.id]
  );
  if (hist.length) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Historique des constats');
    hist.forEach((h) => {
      doc.fontSize(8).text(
        `${fmtDate(h.date_constat)} — ${h.pourcentage}% — ${h.auteur}${h.description ? ' — ' + h.description : ''}`
      );
    });
  }
}

async function sectionPhotos(doc, projet) {
  sectionTitle(doc, '4. Galerie photos');
  const photos = await query(
    'SELECT fichier_url, legende, date_prise FROM photos WHERE projet_id=? ORDER BY date_upload DESC LIMIT 6',
    [projet.id]
  );
  if (!photos.length) {
    doc.fontSize(9).text('Aucune photo enregistrée.');
    return;
  }
  const uploadsDir = path.join(__dirname, '..', '..', 'assets', 'uploads');
  for (const ph of photos) {
    const fp = path.join(uploadsDir, ph.fichier_url);
    try {
      if (require('fs').existsSync(fp)) {
        if (doc.y > doc.page.height - 200) doc.addPage();
        doc.fontSize(8).text(ph.legende || ph.fichier_url);
        doc.image(fp, { width: 200, height: 130, fit: [200, 130] });
        doc.moveDown(0.5);
      }
    } catch {
      doc.fontSize(8).text(`[Image: ${ph.fichier_url}]`);
    }
  }
}

function streamRapport(res, projet, type) {
  return new Promise((resolve, reject) => {
    const titres = {
      complet: 'Rapport Complet',
      financier: 'Rapport Financier',
      avancement: "Rapport d'Avancement",
    };
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    drawHeader(doc, titres[type] || titres.complet);
    doc.fontSize(16).fillColor(BLEU).font('Helvetica-Bold').text(projet.titre || '', {
      align: 'center',
    });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000').font('Helvetica');
    keyValue(doc, 'Commune', projet.commune_nom);
    keyValue(doc, 'Statut', labelStatut(projet.statut));
    doc.moveDown(1);

    (async () => {
      try {
        if (type === 'financier') {
          await sectionBudget(doc, projet);
        } else if (type === 'avancement') {
          await sectionAvancement(doc, projet);
        } else {
          await sectionInfos(doc, projet);
          await sectionBudget(doc, projet);
          await sectionAvancement(doc, projet);
          await sectionPhotos(doc, projet);
        }

        doc.fontSize(7).fillColor(GRIS).text(
          `Généré le ${new Date().toLocaleString('fr-FR')} — Document confidentiel`,
          40,
          doc.page.height - 40,
          { align: 'center', width: doc.page.width - 80 }
        );
        doc.end();
        doc.on('end', resolve);
      } catch (e) {
        reject(e);
      }
    })();
  });
}

module.exports = { loadProjetForPdf, streamRapport, fcfa, labelStatut };
