<?php
/**
 * RapportPDFPro — Moteur de rapports PDF professionnel
 * Communes Urbaines du Littoral — Cameroun
 *
 * Remplacement de RapportPDF.php avec un rendu moderne et soigné.
 * Utilise TCPDF 6.x déjà présent dans includes/tcpdf/
 *
 * Usage (identique à l'ancien fichier, drop-in replacement) :
 *   require_once '../includes/RapportPDFPro.php';
 *   $rapport = new RapportPDFPro($projet, $pdo);
 *   $rapport->genererRapportComplet();
 *   $rapport->telecharger('mon_rapport.pdf');
 */

class RapportPDFPro {

    // ─── Données ──────────────────────────────────────────────────────────────
    private $pdf;    // TCPDF
    private $projet; // array
    private $pdo;    // PDO

    // ─── Palette ──────────────────────────────────────────────────────────────
    // Bleu institutionnel
    private array $BLEU     = [15,  82, 186];
    private array $BLEU_L   = [235, 242, 255];   // fond clair bleu
    // Vert forêt
    private array $VERT     = [22, 130,  82];
    private array $VERT_L   = [230, 248, 239];
    // Ambre / avertissement
    private array $AMBRE    = [180, 100,  10];
    private array $AMBRE_L  = [255, 243, 220];
    // Rouge danger
    private array $ROUGE    = [185,  28,  28];
    private array $ROUGE_L  = [255, 235, 235];
    // Gris neutres
    private array $GRIS_1   = [248, 249, 252];   // fond page
    private array $GRIS_2   = [233, 236, 240];   // séparateurs
    private array $GRIS_3   = [108, 117, 125];   // texte secondaire
    private array $NOIR     = [ 25,  35,  45];   // texte principal
    private array $BLANC    = [255, 255, 255];

    // ─── Marges & géométrie ───────────────────────────────────────────────────
    private int   $MARGE    = 18;   // mm
    private int   $LARGEUR  = 174;  // 210 - 2×18

    // ─── État interne ─────────────────────────────────────────────────────────
    private string $type_rapport   = 'complet';
    private string $titre_rapport  = 'Rapport de projet';
    private int    $numero_page    = 0;

    // ═════════════════════════════════════════════════════════════════════════
    public function __construct($projet_data, $pdo_connection) {
        $this->projet = $projet_data;
        $this->pdo    = $pdo_connection;
        $this->_init();
    }

    // ─── Initialisation TCPDF ────────────────────────────────────────────────
    private function _init() {
        $this->pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);

        $this->pdf->SetCreator('Système Suivi Projets Municipaux v2');
        $this->pdf->SetAuthor('Communes Urbaines du Littoral — Cameroun');
        $this->pdf->SetTitle($this->titre_rapport . ' · ' . ($this->projet['titre'] ?? ''));

        $this->pdf->setPrintHeader(false);
        $this->pdf->setPrintFooter(false);
        $this->pdf->SetMargins($this->MARGE, $this->MARGE, $this->MARGE);
        $this->pdf->SetAutoPageBreak(true, 28);
        $this->pdf->SetFont('dejavusans', '', 9);
        $this->pdf->SetTextColor(...$this->NOIR);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── API PUBLIQUE ─────────────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    public function genererRapportComplet() {
        $this->type_rapport  = 'complet';
        $this->titre_rapport = 'Rapport Complet';
        $this->_pageGarde();
        $this->_pageSommaire();
        $this->_sectionInfosGenerales();
        $this->_sectionBudget(true);
        $this->_sectionAvancement(true);
        $this->_sectionPhotos();
    }

    public function genererRapportFinancier() {
        $this->type_rapport  = 'financier';
        $this->titre_rapport = 'Rapport Financier';
        $this->_pageGarde();
        $this->_sectionBudget(true);
    }

    public function genererRapportAvancement() {
        $this->type_rapport  = 'avancement';
        $this->titre_rapport = "Rapport d'Avancement";
        $this->_pageGarde();
        $this->_sectionAvancement(true);
    }

    public function telecharger($nom = '') {
        if (!$nom) $nom = 'rapport_' . ($this->projet['id'] ?? 0) . '_' . date('Ymd') . '.pdf';
        $this->pdf->Output($nom, 'D');
    }

    public function afficher() {
        $nom = 'rapport_' . ($this->projet['id'] ?? 0) . '.pdf';
        $this->pdf->Output($nom, 'I');
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── PAGE DE GARDE ────────────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _pageGarde() {
        $this->pdf->AddPage();
        $this->numero_page = 0;   // page de garde ne compte pas

        $pdf = $this->pdf;
        $w   = 210; $h = 297;

        // ── Bandeau haut coloré (60 mm) ──────────────────────────────────────
        $pdf->SetFillColor(...$this->BLEU);
        $pdf->Rect(0, 0, $w, 62, 'F');

        // Bande décorative fine en bas du bandeau
        $pdf->SetFillColor(...$this->VERT);
        $pdf->Rect(0, 60, $w, 3, 'F');

        // Texte institution dans le bandeau
        $pdf->SetTextColor(...$this->BLANC);
        $pdf->SetFont('dejavusansb', 'B', 11);
        $pdf->SetXY($this->MARGE, 14);
        $pdf->Cell($this->LARGEUR, 8, 'COMMUNES URBAINES DU LITTORAL', 0, 1, 'C');
        $pdf->SetFont('dejavusans', '', 8.5);
        $pdf->SetX($this->MARGE);
        $pdf->Cell($this->LARGEUR, 6, 'République du Cameroun — Système de Suivi des Projets Municipaux', 0, 1, 'C');

        // Ligne séparatrice fine blanche
        $pdf->SetDrawColor(...$this->BLANC);
        $pdf->SetLineWidth(0.3);
        $pdf->Line($this->MARGE + 30, 32, $w - $this->MARGE - 30, 32);

        // Type de rapport dans le bandeau
        $pdf->SetFont('dejavusans', '', 9);
        $pdf->SetXY($this->MARGE, 36);
        $pdf->Cell($this->LARGEUR, 7, mb_strtoupper($this->titre_rapport), 0, 1, 'C');

        // ── Zone titre centrale ───────────────────────────────────────────────
        $pdf->SetTextColor(...$this->NOIR);

        // Fond carte centrale
        $pdf->SetFillColor(255, 255, 255);
        $pdf->SetDrawColor(...$this->GRIS_2);
        $pdf->SetLineWidth(0.4);
        $pdf->RoundedRect($this->MARGE, 74, $this->LARGEUR, 70, 4, '1111', 'FD');

        // Titre du projet
        $pdf->SetFont('dejavusansb', 'B', 14);
        $pdf->SetTextColor(...$this->BLEU);
        $pdf->SetXY($this->MARGE + 6, 82);
        $pdf->MultiCell($this->LARGEUR - 12, 9, $this->projet['titre'] ?? '', 0, 'L');

        // Ligne accent
        $y = $pdf->GetY() + 3;
        $pdf->SetFillColor(...$this->BLEU);
        $pdf->Rect($this->MARGE + 6, $y, 28, 1, 'F');

        // Métadonnées rapides (commune, type, statut)
        $pdf->SetTextColor(...$this->NOIR);
        $pdf->SetFont('dejavusans', '', 9);
        $pdf->SetXY($this->MARGE + 6, $y + 5);

        $statut_label = $this->_labelStatut($this->projet['statut'] ?? '');
        $items = [
            ['Commune',  $this->projet['commune_nom'] ?? '—'],
            ['Type',     $this->projet['type_nom']    ?? '—'],
            ['Statut',   $statut_label],
            ['Budget',   number_format(($this->projet['budget_actuel'] ?? 0), 0, ',', ' ') . ' FCFA'],
        ];
        foreach ($items as [$label, $val]) {
            $pdf->SetFont('dejavusans', '', 8);
            $pdf->SetTextColor(...$this->GRIS_3);
            $pdf->Cell(30, 6, $label . ' :', 0, 0, 'L');
            $pdf->SetFont('dejavusansb', 'B', 8.5);
            $pdf->SetTextColor(...$this->NOIR);
            $pdf->Cell(0, 6, $val, 0, 1, 'L');
            $pdf->SetX($this->MARGE + 6);
        }

        // ── Barre de progression en page de garde ─────────────────────────────
        $avancement = (int)($this->projet['avancement_physique'] ?? 0);
        $y_bar = 152;
        $pdf->SetFont('dejavusans', '', 8);
        $pdf->SetTextColor(...$this->GRIS_3);
        $pdf->SetXY($this->MARGE, $y_bar);
        $pdf->Cell(80, 5, 'Avancement physique du projet', 0, 0);
        $pdf->SetFont('dejavusansb', 'B', 9);
        $pdf->SetTextColor(...$this->BLEU);
        $pdf->Cell(0, 5, $avancement . '%', 0, 1, 'R');
        $this->_barreProgression($this->MARGE, $pdf->GetY(), $this->LARGEUR, 5, $avancement);

        // ── Bloc dates ────────────────────────────────────────────────────────
        $pdf->SetY($pdf->GetY() + 10);
        $this->_cartesDates();

        // ── Pied de page de garde ─────────────────────────────────────────────
        $pdf->SetFillColor(...$this->GRIS_1);
        $pdf->Rect(0, $h - 28, $w, 28, 'F');
        $pdf->SetFillColor(...$this->BLEU);
        $pdf->Rect(0, $h - 28, $w, 1, 'F');

        $pdf->SetTextColor(...$this->GRIS_3);
        $pdf->SetFont('dejavusans', '', 8);
        $pdf->SetXY($this->MARGE, $h - 22);
        $pdf->Cell($this->LARGEUR / 2, 5, 'Généré le ' . date('d/m/Y à H:i'), 0, 0, 'L');
        $pdf->Cell($this->LARGEUR / 2, 5, 'Document confidentiel — Usage interne', 0, 0, 'R');
        $pdf->SetXY($this->MARGE, $h - 15);
        $pdf->SetTextColor(...$this->BLEU);
        $pdf->SetFont('dejavusansb', 'B', 8);
        $pdf->Cell($this->LARGEUR, 5, 'suivi-projets.communes-littoral.cm', 0, 0, 'C');
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── PAGE SOMMAIRE ────────────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _pageSommaire() {
        $this->_nouvellePage('Sommaire');

        $sections = [
            '1' => ['Informations générales',   "Vue d'ensemble du projet, localisation et responsables"],
            '2' => ['Budget & Finances',         'Détail des dépenses, taux de consommation, historique'],
            '3' => ['Avancement & Planning',     'État physique et temporel, jalons, observations'],
            '4' => ['Galerie photos',            'Documentation photographique du chantier'],
        ];

        $y = $this->pdf->GetY() + 4;
        foreach ($sections as $num => [$titre, $desc]) {
            $this->pdf->SetFillColor(...$this->GRIS_1);
            $this->pdf->SetDrawColor(...$this->GRIS_2);
            $this->pdf->RoundedRect($this->MARGE, $y, $this->LARGEUR, 18, 3, '1111', 'FD');

            // Numéro
            $this->pdf->SetFillColor(...$this->BLEU);
            $this->pdf->Circle($this->MARGE + 9, $y + 9, 5, 0, 360, 'F');
            $this->pdf->SetFont('dejavusansb', 'B', 9);
            $this->pdf->SetTextColor(...$this->BLANC);
            $this->pdf->SetXY($this->MARGE + 4, $y + 5);
            $this->pdf->Cell(10, 8, $num, 0, 0, 'C');

            // Titre section
            $this->pdf->SetFont('dejavusansb', 'B', 10);
            $this->pdf->SetTextColor(...$this->NOIR);
            $this->pdf->SetXY($this->MARGE + 20, $y + 3);
            $this->pdf->Cell(0, 6, $titre, 0, 1, 'L');

            // Description
            $this->pdf->SetFont('dejavusans', '', 8);
            $this->pdf->SetTextColor(...$this->GRIS_3);
            $this->pdf->SetXY($this->MARGE + 20, $y + 9);
            $this->pdf->Cell(0, 5, $desc, 0, 1, 'L');

            $y += 23;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── SECTION 1 : INFOS GÉNÉRALES ─────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _sectionInfosGenerales() {
        $this->_nouvellePage('1. Informations générales');

        $p = $this->projet;
        $donnees = [
            ['Titre du projet',    $p['titre']          ?? '—'],
            ['Description',        $this->_tronquer($p['description'] ?? 'Non renseignée', 120)],
            ['Type de projet',     $p['type_nom']       ?? '—'],
            ['Commune',            $p['commune_nom']    ?? '—'],
            ['Responsable',        $p['responsable_nom'] ?? '—'],
            ['Rôle responsable',   $p['role_nom']       ?? '—'],
            ['Date de début',      $this->_date($p['date_debut'] ?? '')],
            ['Date de fin prévue', $this->_date($p['date_fin_prevue'] ?? '')],
            ['Date de fin réelle', $this->_date($p['date_fin_reelle'] ?? '')],
            ['Statut',             $this->_labelStatut($p['statut'] ?? '')],
            ['Avancement physique', ($p['avancement_physique'] ?? 0) . ' %'],
            ['Visible portail',    ($p['visible_public'] ?? 0) ? 'Oui — visible des citoyens' : 'Non'],
            ['Adresse',            $p['adresse'] ?? 'Non renseignée'],
            ['Coordonnées GPS',    ($p['latitude'] && $p['longitude']) ? $p['latitude'] . ', ' . $p['longitude'] : 'Non renseignées'],
        ];

        $this->_tableauDeuxColonnes($donnees);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── SECTION 2 : BUDGET ──────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _sectionBudget($detail = false) {
        $this->_nouvellePage('2. Budget & Finances');

        // Dépenses validées
        $stmt = $this->pdo->prepare("SELECT COALESCE(SUM(montant),0) FROM depenses WHERE projet_id=? AND validee=1");
        $stmt->execute([$this->projet['id']]);
        $total_valide = (float)$stmt->fetchColumn();

        // Dépenses en attente
        $stmt2 = $this->pdo->prepare("SELECT COALESCE(SUM(montant),0), COUNT(*) FROM depenses WHERE projet_id=? AND validee=0");
        $stmt2->execute([$this->projet['id']]);
        [$montant_attente, $nb_attente] = $stmt2->fetch(PDO::FETCH_NUM);

        $budget = (float)($this->projet['budget_actuel'] ?? 0);
        $budget_init = (float)($this->projet['budget_initial'] ?? 0);
        $restant  = $budget - $total_valide;
        $taux     = $budget > 0 ? ($total_valide / $budget * 100) : 0;

        // ── Cartes KPI ────────────────────────────────────────────────────────
        $this->_carteKPIRangee([
            ['Budget initial',    $this->_fcfa($budget_init),   $this->BLEU,  $this->BLEU_L],
            ['Budget actuel',     $this->_fcfa($budget),        $this->VERT,  $this->VERT_L],
            ['Dépenses validées', $this->_fcfa($total_valide),  $this->AMBRE, $this->AMBRE_L],
            ['Budget restant',    $this->_fcfa($restant),       $restant >= 0 ? $this->VERT : $this->ROUGE,
                                                                 $restant >= 0 ? $this->VERT_L : $this->ROUGE_L],
        ]);

        // ── Taux de consommation ──────────────────────────────────────────────
        $this->pdf->Ln(4);
        $this->_sousTitre('Taux de consommation budgétaire');
        $y = $this->pdf->GetY();
        $this->pdf->SetFont('dejavusansb', 'B', 10);
        $couleur_tx = $taux > 80 ? $this->ROUGE : ($taux > 50 ? $this->AMBRE : $this->VERT);
        $this->pdf->SetTextColor(...$couleur_tx);
        $this->pdf->SetXY($this->MARGE, $y);
        $this->pdf->Cell($this->LARGEUR, 6, round($taux, 1) . ' %', 0, 1, 'R');
        $this->_barreProgression($this->MARGE, $this->pdf->GetY(), $this->LARGEUR, 7, $taux, $couleur_tx);
        $this->pdf->Ln(4);

        if ((float)$montant_attente > 0) {
            $this->_alerteInfo(
                $nb_attente . ' dépense(s) en attente de validation pour ' . $this->_fcfa((float)$montant_attente) . ' — non incluses dans les totaux.',
                $this->AMBRE_L, $this->AMBRE
            );
        }

        if (!$detail) return;

        // ── Tableau détaillé des dépenses ─────────────────────────────────────
        $this->pdf->Ln(5);
        $this->_sousTitre('Historique des dépenses');

        $stmt = $this->pdo->prepare("
            SELECT date_depense, libelle, fournisseur, montant, validee, numero_facture
            FROM depenses WHERE projet_id=?
            ORDER BY date_depense DESC
        ");
        $stmt->execute([$this->projet['id']]);
        $depenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($depenses) {
            $cols = [
                ['Date',       22, 'C'],
                ['Libellé',    60, 'L'],
                ['Fournisseur',40, 'L'],
                ['Montant',    30, 'R'],
                ['N° Facture', 22, 'C'],
            ];
            $this->_enteteTableau($cols);

            $alt = false;
            foreach ($depenses as $d) {
                $this->_verifierSautPage(8);
                $this->_ligneTableau($cols, [
                    $this->_date($d['date_depense']),
                    $this->_tronquer($d['libelle'], 30),
                    $this->_tronquer($d['fournisseur'] ?? '—', 20),
                    $this->_fcfa((float)$d['montant']),
                    $d['numero_facture'] ?? '—',
                ], $alt, (int)$d['validee'] === 0);
                $alt = !$alt;
            }

            // Ligne total
            $this->pdf->SetFillColor(...$this->BLEU_L);
            $this->pdf->SetDrawColor(...$this->GRIS_2);
            $lw = 0;
            foreach ($cols as [$l, $larg, $align]) $lw += $larg;
            $this->pdf->SetFont('dejavusansb', 'B', 8.5);
            $this->pdf->SetTextColor(...$this->BLEU);
            $this->pdf->SetXY($this->MARGE, $this->pdf->GetY());
            $this->pdf->Cell($lw - 30 - 22, 7, 'TOTAL VALIDÉ', 1, 0, 'R', true);
            $this->pdf->Cell(30, 7, $this->_fcfa($total_valide), 1, 0, 'R', true);
            $this->pdf->Cell(22, 7, '', 1, 1, 'C', true);
        } else {
            $this->_alerteInfo('Aucune dépense enregistrée pour ce projet.', $this->GRIS_1, $this->GRIS_3);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── SECTION 3 : AVANCEMENT ──────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _sectionAvancement($detail = false) {
        $this->_nouvellePage("3. Avancement & Planning");

        $p = $this->projet;
        $avancement  = (int)($p['avancement_physique'] ?? 0);

        $debut      = new DateTime($p['date_debut'] ?? 'today');
        $fin_prevue = new DateTime($p['date_fin_prevue'] ?? 'today');
        $auj        = new DateTime();

        $duree_totale     = (int)$debut->diff($fin_prevue)->days;
        $jours_ecoules    = (int)$debut->diff($auj)->days;
        $diff_restant     = $auj->diff($fin_prevue);
        $jours_restants   = $auj > $fin_prevue ? -(int)$diff_restant->days : (int)$diff_restant->days;
        $pct_temps        = $duree_totale > 0 ? min(100, round($jours_ecoules / $duree_totale * 100, 1)) : 0;

        // ── Cartes KPI avancement ─────────────────────────────────────────────
        $couleur_retard = $jours_restants < 0 ? $this->ROUGE : $this->VERT;
        $couleur_retard_l = $jours_restants < 0 ? $this->ROUGE_L : $this->VERT_L;

        $this->_carteKPIRangee([
            ['Avancement physique', $avancement . ' %',          $this->BLEU,  $this->BLEU_L],
            ['Avancement temporel', $pct_temps . ' %',           $this->VERT,  $this->VERT_L],
            ['Jours écoulés',       $jours_ecoules . ' j',       $this->GRIS_3, $this->GRIS_1],
            ['Jours restants',      abs($jours_restants) . ($jours_restants < 0 ? ' j retard' : ' j'), $couleur_retard, $couleur_retard_l],
        ]);

        // ── Double barre de progression ───────────────────────────────────────
        $this->pdf->Ln(5);
        $this->_sousTitre('Progression visuelle');

        $this->pdf->SetFont('dejavusans', '', 8);
        $this->pdf->SetTextColor(...$this->GRIS_3);
        $this->pdf->SetXY($this->MARGE, $this->pdf->GetY());
        $this->pdf->Cell($this->LARGEUR - 20, 5, 'Avancement physique', 0, 0, 'L');
        $this->pdf->SetFont('dejavusansb', 'B', 8.5);
        $this->pdf->SetTextColor(...$this->BLEU);
        $this->pdf->Cell(20, 5, $avancement . '%', 0, 1, 'R');
        $this->_barreProgression($this->MARGE, $this->pdf->GetY(), $this->LARGEUR, 6, $avancement);
        $this->pdf->Ln(5);

        $this->pdf->SetFont('dejavusans', '', 8);
        $this->pdf->SetTextColor(...$this->GRIS_3);
        $this->pdf->SetXY($this->MARGE, $this->pdf->GetY());
        $this->pdf->Cell($this->LARGEUR - 20, 5, 'Avancement temporel', 0, 0, 'L');
        $this->pdf->SetFont('dejavusansb', 'B', 8.5);
        $this->pdf->SetTextColor(...$this->VERT);
        $this->pdf->Cell(20, 5, $pct_temps . '%', 0, 1, 'R');
        $couleur_barre_temps = $pct_temps > $avancement + 10 ? $this->ROUGE : $this->VERT;
        $this->_barreProgression($this->MARGE, $this->pdf->GetY(), $this->LARGEUR, 6, $pct_temps, $couleur_barre_temps);
        $this->pdf->Ln(4);

        // ── Analyse écart ─────────────────────────────────────────────────────
        $ecart = $avancement - $pct_temps;
        if ($ecart > 5) {
            $msg = 'Le projet est en avance sur le planning (écart : +' . round(abs($ecart), 1) . '%). Bonne performance.';
            $this->_alerteInfo($msg, $this->VERT_L, $this->VERT);
        } elseif ($ecart < -10) {
            $msg = 'Attention : le projet accuse un retard de ' . round(abs($ecart), 1) . '% par rapport au calendrier prévu.';
            $this->_alerteInfo($msg, $this->ROUGE_L, $this->ROUGE);
        } else {
            $msg = 'Le projet suit le calendrier prévu (écart : ' . round($ecart, 1) . '%).';
            $this->_alerteInfo($msg, $this->BLEU_L, $this->BLEU);
        }

        if (!$detail) return;

        // ── Historique des avancements ────────────────────────────────────────
        $this->pdf->Ln(5);
        $this->_sousTitre('Historique des mises à jour');

        $stmt = $this->pdo->prepare("
            SELECT a.date_constat, a.pourcentage, a.description, a.observations,
                   CONCAT(u.prenom,' ',u.nom) as auteur
            FROM avancements a
            JOIN utilisateurs u ON a.utilisateur_id = u.id
            WHERE a.projet_id = ?
            ORDER BY a.date_constat DESC
            LIMIT 15
        ");
        $stmt->execute([$this->projet['id']]);
        $avancements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($avancements) {
            $cols = [
                ['Date',          26, 'C'],
                ['%',             14, 'C'],
                ['Description',   72, 'L'],
                ['Auteur',        40, 'L'],
            ];
            $this->_enteteTableau($cols);
            $alt = false;
            foreach ($avancements as $av) {
                $this->_verifierSautPage(8);
                $this->_ligneTableau($cols, [
                    $this->_date($av['date_constat']),
                    $av['pourcentage'] . '%',
                    $this->_tronquer($av['description'] ?? '—', 40),
                    $this->_tronquer($av['auteur'], 22),
                ], $alt, false);
                $alt = !$alt;
            }
        } else {
            $this->_alerteInfo('Aucune mise à jour d\'avancement enregistrée.', $this->GRIS_1, $this->GRIS_3);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── SECTION 4 : PHOTOS ──────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _sectionPhotos() {
        $stmt = $this->pdo->prepare("SELECT * FROM photos WHERE projet_id=? ORDER BY date_upload DESC LIMIT 9");
        $stmt->execute([$this->projet['id']]);
        $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$photos) return;

        $this->_nouvellePage('4. Galerie photos');

        $col_w   = ($this->LARGEUR - 8) / 3;
        $col_h   = 42;
        $leg_h   = 8;
        $gap     = 4;
        $x_start = $this->MARGE;
        $y_start = $this->pdf->GetY();

        foreach ($photos as $idx => $photo) {
            $chemin = dirname(__DIR__) . '/assets/uploads/' . $photo['fichier_url'];
            if (!file_exists($chemin)) continue;

            $col = $idx % 3;
            $lig = (int)floor($idx / 3);
            $x   = $x_start + $col * ($col_w + $gap);
            $y   = $y_start + $lig * ($col_h + $leg_h + $gap + 2);

            if ($y + $col_h + $leg_h > 270) {
                $this->_nouvellePage('4. Galerie photos (suite)');
                $y_start = $this->pdf->GetY();
                $y       = $y_start;
            }

            // Cadre photo
            $this->pdf->SetFillColor(...$this->GRIS_2);
            $this->pdf->SetDrawColor(...$this->GRIS_2);
            $this->pdf->RoundedRect($x, $y, $col_w, $col_h, 2, '1111', 'FD');

            // Image
            try {
                $this->pdf->Image($chemin, $x + 1, $y + 1, $col_w - 2, $col_h - 2, '', '', '', true, 150, '', false, false, 0, 'CM');
            } catch (Exception $e) { /* ignore */ }

            // Légende
            $legende = !empty($photo['legende']) ? $photo['legende'] : 'Sans légende';
            $date_ph = $this->_date($photo['date_prise'] ?? $photo['date_upload']);
            $this->pdf->SetFont('dejavusans', '', 6.5);
            $this->pdf->SetTextColor(...$this->GRIS_3);
            $this->pdf->SetXY($x, $y + $col_h + 1);
            $this->pdf->MultiCell($col_w, 3.5, $this->_tronquer($legende, 22) . ' · ' . $date_ph, 0, 'C');
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── COMPOSANTS GRAPHIQUES ────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    /** Nouvelle page avec en-tête coloré et pied de page */
    private function _nouvellePage($titre_section) {
        $this->pdf->AddPage();
        $this->numero_page++;
        $pdf = $this->pdf;

        // En-tête page intérieure
        $pdf->SetFillColor(...$this->BLEU);
        $pdf->Rect(0, 0, 210, 14, 'F');
        $pdf->SetFillColor(...$this->VERT);
        $pdf->Rect(0, 13, 210, 1.5, 'F');

        $pdf->SetFont('dejavusansb', 'B', 8);
        $pdf->SetTextColor(...$this->BLANC);
        $pdf->SetXY($this->MARGE, 3);
        $pdf->Cell($this->LARGEUR / 2, 7, 'Communes Urbaines du Littoral — Cameroun', 0, 0, 'L');
        $pdf->Cell($this->LARGEUR / 2, 7, $this->_tronquer($this->projet['titre'] ?? '', 40), 0, 0, 'R');

        // Pied de page
        $pdf->SetFont('dejavusans', '', 7.5);
        $pdf->SetFillColor(...$this->GRIS_1);
        $pdf->Rect(0, 285, 210, 12, 'F');
        $pdf->SetFillColor(...$this->GRIS_2);
        $pdf->Rect(0, 285, 210, 0.5, 'F');

        $pdf->SetTextColor(...$this->GRIS_3);
        $pdf->SetXY($this->MARGE, 287);
        $pdf->Cell($this->LARGEUR / 3, 5, $this->titre_rapport, 0, 0, 'L');
        $pdf->Cell($this->LARGEUR / 3, 5, date('d/m/Y'), 0, 0, 'C');
        $pdf->Cell($this->LARGEUR / 3, 5, 'Page ' . $this->numero_page, 0, 0, 'R');

        // Titre de section
        $pdf->SetTextColor(...$this->NOIR);
        $pdf->SetFont('dejavusansb', 'B', 13);
        $pdf->SetXY($this->MARGE, 20);
        $pdf->Cell(0, 8, $titre_section, 0, 1, 'L');

        // Ligne accent
        $pdf->SetFillColor(...$this->BLEU);
        $pdf->Rect($this->MARGE, $pdf->GetY(), 35, 1, 'F');
        $pdf->Ln(5);
    }

    /** Barre de progression graphique */
    private function _barreProgression($x, $y, $w, $h, $pct, $couleur = null) {
        $pct    = max(0, min(100, $pct));
        $couleur = $couleur ?? ($pct > 80 ? $this->ROUGE : ($pct > 50 ? $this->AMBRE : $this->VERT));

        // Fond
        $this->pdf->SetFillColor(...$this->GRIS_2);
        $this->pdf->RoundedRect($x, $y, $w, $h, $h / 2, '1111', 'F');

        // Remplissage
        if ($pct > 0) {
            $w_rempli = max($h, $w * $pct / 100);   // au moins un demi-cercle
            $this->pdf->SetFillColor(...$couleur);
            $this->pdf->RoundedRect($x, $y, $w_rempli, $h, $h / 2, '1111', 'F');
        }

        $this->pdf->SetY($y + $h + 1);
    }

    /** Rangée de 4 cartes KPI */
    private function _carteKPIRangee($kpis) {
        $card_w = ($this->LARGEUR - 9) / 4;
        $card_h = 24;
        $y      = $this->pdf->GetY();

        foreach ($kpis as $i => [$label, $valeur, $couleur, $fond]) {
            $x = $this->MARGE + $i * ($card_w + 3);
            $this->pdf->SetFillColor(...$fond);
            $this->pdf->SetDrawColor(...$couleur);
            $this->pdf->SetLineWidth(0.4);
            $this->pdf->RoundedRect($x, $y, $card_w, $card_h, 3, '1111', 'FD');

            // Valeur principale
            $this->pdf->SetFont('dejavusansb', 'B', 10);
            $this->pdf->SetTextColor(...$couleur);
            $this->pdf->SetXY($x + 2, $y + 4);
            $this->pdf->Cell($card_w - 4, 7, $valeur, 0, 1, 'C');

            // Label
            $this->pdf->SetFont('dejavusans', '', 7);
            $this->pdf->SetTextColor(...$this->GRIS_3);
            $this->pdf->SetXY($x + 2, $y + 13);
            $this->pdf->Cell($card_w - 4, 5, $label, 0, 0, 'C');
        }

        $this->pdf->SetY($y + $card_h + 2);
    }

    /** Tableau 2 colonnes label/valeur */
    private function _tableauDeuxColonnes($donnees) {
        $col_label = 50;
        $col_val   = $this->LARGEUR - $col_label;
        $h_ligne   = 7;
        $alt       = false;

        foreach ($donnees as [$label, $valeur]) {
            $this->_verifierSautPage($h_ligne + 2);
            $y = $this->pdf->GetY();

            if ($alt) {
                $this->pdf->SetFillColor(...$this->GRIS_1);
                $this->pdf->Rect($this->MARGE, $y, $this->LARGEUR, $h_ligne, 'F');
            }

            $this->pdf->SetFont('dejavusans', '', 8);
            $this->pdf->SetTextColor(...$this->GRIS_3);
            $this->pdf->SetXY($this->MARGE + 2, $y + 0.5);
            $this->pdf->Cell($col_label - 2, $h_ligne, $label, 0, 0, 'L');

            $this->pdf->SetFont('dejavusans', '', 8.5);
            $this->pdf->SetTextColor(...$this->NOIR);
            $this->pdf->Cell($col_val, $h_ligne, $valeur, 0, 1, 'L');

            // Ligne fine séparatrice
            $this->pdf->SetDrawColor(...$this->GRIS_2);
            $this->pdf->SetLineWidth(0.2);
            $this->pdf->Line($this->MARGE, $this->pdf->GetY(), $this->MARGE + $this->LARGEUR, $this->pdf->GetY());

            $alt = !$alt;
        }
        $this->pdf->Ln(2);
    }

    /** En-tête de tableau multi-colonnes */
    private function _enteteTableau($cols) {
        $this->_verifierSautPage(14);
        $this->pdf->SetFillColor(...$this->BLEU);
        $this->pdf->SetTextColor(...$this->BLANC);
        $this->pdf->SetFont('dejavusansb', 'B', 8);
        $this->pdf->SetXY($this->MARGE, $this->pdf->GetY());

        foreach ($cols as [$label, $larg, $align]) {
            $this->pdf->Cell($larg, 8, $label, 0, 0, $align, true);
        }
        $this->pdf->Ln();
    }

    /** Ligne de tableau multi-colonnes */
    private function _ligneTableau($cols, $vals, bool $alt, $attente = false) {
        $y = $this->pdf->GetY();
        if ($alt) {
            $this->pdf->SetFillColor(...$this->GRIS_1);
            $tw = array_sum(array_column($cols, 1));
            $this->pdf->Rect($this->MARGE, $y, $tw, 7, 'F');
        }

        $this->pdf->SetFont('dejavusans', '', 8);
        $this->pdf->SetXY($this->MARGE, $y);

        foreach ($cols as $i => [$label, $larg, $align]) {
            $val = $vals[$i] ?? '';
            if ($attente && $i === 0) {
                $this->pdf->SetTextColor(...$this->AMBRE);
            } else {
                $this->pdf->SetTextColor(...$this->NOIR);
            }
            $this->pdf->Cell($larg, 7, $val, 0, 0, $align);
        }

        // Ligne séparatrice
        $this->pdf->SetDrawColor(...$this->GRIS_2);
        $this->pdf->SetLineWidth(0.2);
        $tw = array_sum(array_column($cols, 1));
        $this->pdf->Line($this->MARGE, $this->pdf->GetY() + 7, $this->MARGE + $tw, $this->pdf->GetY() + 7);
        $this->pdf->Ln(7);
    }

    /** Sous-titre de section */
    private function _sousTitre($texte) {
        $this->pdf->SetFont('dejavusansb', 'B', 9.5);
        $this->pdf->SetTextColor(...$this->BLEU);
        $this->pdf->SetXY($this->MARGE, $this->pdf->GetY());
        $this->pdf->Cell(0, 7, $texte, 0, 1, 'L');

        $this->pdf->SetFillColor(...$this->GRIS_2);
        $this->pdf->Rect($this->MARGE, $this->pdf->GetY(), $this->LARGEUR, 0.4, 'F');
        $this->pdf->Ln(3);
        $this->pdf->SetTextColor(...$this->NOIR);
    }

    /** Bloc d'alerte/info coloré */
    private function _alerteInfo($msg, $fond, $bord) {
        $this->_verifierSautPage(14);
        $y = $this->pdf->GetY();
        $h = 12;

        $this->pdf->SetFillColor(...$fond);
        $this->pdf->SetDrawColor(...$bord);
        $this->pdf->SetLineWidth(0.4);
        $this->pdf->RoundedRect($this->MARGE, $y, $this->LARGEUR, $h, 2, '1111', 'FD');

        // Barre gauche
        $this->pdf->SetFillColor(...$bord);
        $this->pdf->Rect($this->MARGE, $y, 2, $h, 'F');

        $this->pdf->SetFont('dejavusans', '', 8);
        $this->pdf->SetTextColor(...$bord);
        $this->pdf->SetXY($this->MARGE + 5, $y + 2.5);
        $this->pdf->Cell($this->LARGEUR - 7, $h - 5, $msg, 0, 1, 'L');
        $this->pdf->Ln(2);
    }

    /** Cartes dates (bandeau bas page de garde) */
    private function _cartesDates() {
        $dates = [
            ['Début',           $this->_date($this->projet['date_debut'] ?? ''),      $this->BLEU_L, $this->BLEU],
            ['Fin prévue',      $this->_date($this->projet['date_fin_prevue'] ?? ''), $this->VERT_L, $this->VERT],
            ['Mise à jour',     $this->_date($this->projet['updated_at'] ?? 'today'), $this->GRIS_1, $this->GRIS_3],
        ];
        $w = ($this->LARGEUR - 8) / 3;
        $y = $this->pdf->GetY();
        foreach ($dates as $i => [$label, $val, $fond, $coul]) {
            $x = $this->MARGE + $i * ($w + 4);
            $this->pdf->SetFillColor(...$fond);
            $this->pdf->SetDrawColor(...$coul);
            $this->pdf->SetLineWidth(0.4);
            $this->pdf->RoundedRect($x, $y, $w, 18, 3, '1111', 'FD');
            $this->pdf->SetFont('dejavusans', '', 7);
            $this->pdf->SetTextColor(...$coul);
            $this->pdf->SetXY($x + 2, $y + 2.5);
            $this->pdf->Cell($w - 4, 5, $label, 0, 1, 'C');
            $this->pdf->SetFont('dejavusansb', 'B', 9);
            $this->pdf->SetTextColor(...$coul);
            $this->pdf->SetXY($x + 2, $y + 7.5);
            $this->pdf->Cell($w - 4, 7, $val, 0, 0, 'C');
        }
        $this->pdf->SetY($y + 22);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ─── HELPERS ──────────────────────────────────────────────────────────────
    // ═════════════════════════════════════════════════════════════════════════

    private function _verifierSautPage($hauteur_requise) {
        if ($this->pdf->GetY() + $hauteur_requise > 280) {
            $this->pdf->AddPage();
            $this->numero_page++;
            // Re-poser pied et en-tête
            $pdf = $this->pdf;
            $pdf->SetFillColor(...$this->BLEU);
            $pdf->Rect(0, 0, 210, 14, 'F');
            $pdf->SetFillColor(...$this->VERT);
            $pdf->Rect(0, 13, 210, 1.5, 'F');
            $pdf->SetFont('dejavusansb', 'B', 8);
            $pdf->SetTextColor(...$this->BLANC);
            $pdf->SetXY($this->MARGE, 3);
            $pdf->Cell($this->LARGEUR, 7, 'Communes Urbaines du Littoral — Cameroun', 0, 0, 'L');

            $pdf->SetFont('dejavusans', '', 7.5);
            $pdf->SetFillColor(...$this->GRIS_1);
            $pdf->Rect(0, 285, 210, 12, 'F');
            $pdf->SetFillColor(...$this->GRIS_2);
            $pdf->Rect(0, 285, 210, 0.5, 'F');
            $pdf->SetTextColor(...$this->GRIS_3);
            $pdf->SetXY($this->MARGE, 287);
            $pdf->Cell($this->LARGEUR / 3, 5, $this->titre_rapport, 0, 0, 'L');
            $pdf->Cell($this->LARGEUR / 3, 5, date('d/m/Y'), 0, 0, 'C');
            $pdf->Cell($this->LARGEUR / 3, 5, 'Page ' . $this->numero_page, 0, 0, 'R');

            $pdf->SetY(20);
        }
    }

    private function _date($d) {
        if (!$d || $d === '0000-00-00' || substr($d, 0, 4) === '0000') return '—';
        try { return (new DateTime($d))->format('d/m/Y'); }
        catch (\Exception $e) { return '—'; }
    }

    private function _fcfa(float $v) {
        return number_format($v, 0, ',', ' ') . ' FCFA';
    }

    private function _tronquer($s, $max) {
        $s = strip_tags($s);
        return mb_strlen($s) > $max ? mb_substr($s, 0, $max) . '…' : $s;
    }

    private function _labelStatut($s) {
        $map = [
            'planifié' => 'Planifié',
            'en_cours' => 'En cours',
            'terminé'  => 'Terminé',
            'suspendu' => 'Suspendu',
            'annulé'   => 'Annulé',
        ];
        return $map[$s] ?? ucfirst($s ?: '—');
    }
}
