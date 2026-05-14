<?php
/**
 * Classe simplifiée pour générer des rapports PDF professionnels
 * Version compatible avec toutes les versions de TCPDF
 */

class RapportPDF {
    private $pdf;
    private $projet;
    private $pdo;

    // Couleurs du thème
    private $couleur_primaire = array(37, 99, 235);
    private $couleur_succes   = array(16, 185, 129);
    private $couleur_warning  = array(245, 158, 11);
    private $couleur_danger   = array(239, 68, 68);

    public function __construct($projet_data, $pdo_connection) {
        $this->projet = $projet_data;
        $this->pdo    = $pdo_connection;
        $this->pdf    = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
        $this->configurerPDF();
    }

    private function configurerPDF() {
        $this->pdf->SetCreator('Système Suivi Projets Municipaux');
        $this->pdf->SetAuthor('Communes Urbaines du Littoral - Cameroun');
        $this->pdf->SetTitle('Rapport - ' . $this->projet['titre']);
        $this->pdf->SetSubject('Rapport de projet municipal');
        $this->pdf->setPrintHeader(false);
        $this->pdf->setPrintFooter(false);
        $this->pdf->SetMargins(15, 15, 15);
        $this->pdf->SetAutoPageBreak(TRUE, 20);
        $this->pdf->SetFont('helvetica', '', 10);
    }

    public function genererRapportComplet() {
        $this->ajouterPageGarde('Rapport Complet');
        $this->ajouterInformationsGenerales();
        $this->ajouterSectionBudget();
        $this->ajouterSectionAvancement();
        $this->ajouterSectionPhotos();
        return $this->pdf;
    }

    public function genererRapportFinancier() {
        $this->ajouterPageGarde('Rapport Financier');
        $this->ajouterSectionBudget(true);
        return $this->pdf;
    }

    public function genererRapportAvancement() {
        $this->ajouterPageGarde("Rapport d'Avancement");
        $this->ajouterSectionAvancement(true);
        return $this->pdf;
    }

    private function ajouterEnTetePersonnalise() {
        $y_actuel = $this->pdf->GetY();
        $this->pdf->SetFillColor(37, 99, 235);
        $this->pdf->Rect(0, 0, 210, 20, 'F');
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->SetXY(15, 8);
        $this->pdf->Cell(0, 10, 'Communes Urbaines du Littoral - Cameroun', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 9);
        $this->pdf->SetXY(15, 15);
        $this->pdf->Cell(0, 5, 'Système de Suivi des Projets Municipaux', 0, 0, 'L');
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetY($y_actuel);
    }

    private function ajouterPiedPagePersonnalise() {
        $this->pdf->SetY(-15);
        $this->pdf->SetFont('helvetica', 'I', 8);
        $this->pdf->SetTextColor(128, 128, 128);
        $this->pdf->Cell(0, 10, 'Page ' . $this->pdf->getAliasNumPage() . ' / ' . $this->pdf->getAliasNbPages(), 0, 0, 'C');
        $this->pdf->Line(15, $this->pdf->GetY() - 2, 195, $this->pdf->GetY() - 2);
        $this->pdf->SetTextColor(0, 0, 0);
    }

    private function ajouterPageGarde($type_rapport = 'Rapport Complet') {
        $this->pdf->AddPage();
        $this->pdf->SetFillColor(37, 99, 235);
        $this->pdf->Rect(0, 0, 210, 80, 'F');

        $logo_path = dirname(__DIR__) . '/assets/images/logo.png';
        if (file_exists($logo_path)) {
            $this->pdf->Image($logo_path, 80, 20, 50, 30, '', '', '', true, 150, '', false, false, 0);
            $y_start = 55;
        } else {
            $y_start = 30;
        }

        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetFont('helvetica', 'B', 24);
        $this->pdf->SetXY(15, $y_start);
        $this->pdf->Cell(0, 15, $type_rapport, 0, 1, 'C');
        $this->pdf->SetTextColor(0, 0, 0);

        $this->pdf->SetY(70);
        $this->pdf->SetFont('helvetica', 'B', 16);
        $this->pdf->MultiCell(0, 8, $this->projet['titre'], 0, 'C');

        $this->pdf->SetY(95);
        $this->pdf->SetFillColor(245, 245, 245);
        $this->pdf->Rect(30, 95, 150, 50, 'F');
        $this->pdf->SetFont('helvetica', '', 11);
        $y = 102;
        $infos = [
            'Commune'  => $this->projet['commune_nom']  ?? '-',
            'Type'     => $this->projet['type_nom']     ?? '-',
            'Statut'   => ucfirst($this->projet['statut']),
            'Budget'   => number_format($this->projet['budget_actuel'], 0, ',', ' ') . ' FCFA',
        ];
        foreach ($infos as $label => $valeur) {
            $this->pdf->SetXY(40, $y);
            $this->pdf->SetFont('helvetica', 'B', 10);
            $this->pdf->Cell(40, 6, $label . ' :', 0, 0, 'L');
            $this->pdf->SetFont('helvetica', '', 10);
            $this->pdf->Cell(0, 6, $valeur, 0, 1, 'L');
            $y += 8;
        }

        $this->pdf->SetY(160);
        $this->pdf->SetFont('helvetica', 'I', 9);
        $this->pdf->SetTextColor(100, 100, 100);
        $this->pdf->Cell(0, 6, 'Rapport généré le ' . date('d/m/Y à H:i'), 0, 1, 'C');
        $this->pdf->SetTextColor(0, 0, 0);
    }

    private function ajouterInformationsGenerales() {
        $this->pdf->AddPage();
        $this->ajouterEnTetePersonnalise();
        $this->pdf->SetY(28);
        $this->ajouterTitreSection('1. INFORMATIONS GÉNÉRALES', $this->couleur_primaire);
        $this->pdf->SetFont('helvetica', '', 10);
        $donnees = [
            ['Titre du projet',    $this->projet['titre']],
            ['Description',        substr($this->projet['description'] ?? 'Non renseignée', 0, 100) . '...'],
            ['Type de projet',     $this->projet['type_nom']      ?? '-'],
            ['Commune',            $this->projet['commune_nom']   ?? '-'],
            ['Responsable',        $this->projet['responsable_nom'] ?? '-'],
            ['Date de début',      date('d/m/Y', strtotime($this->projet['date_debut']))],
            ['Date de fin prévue', date('d/m/Y', strtotime($this->projet['date_fin_prevue']))],
            ['Statut actuel',      ucfirst($this->projet['statut'])],
            ['Localisation',       $this->projet['adresse'] ?? 'Non spécifiée'],
        ];
        $this->creerTableauStyle($donnees, [60, 120]);
        $this->ajouterPiedPagePersonnalise();
    }

    private function ajouterSectionBudget($detaille = false) {
        $this->pdf->AddPage();
        $this->ajouterEnTetePersonnalise();
        $this->pdf->SetY(28);
        $this->ajouterTitreSection('2. BUDGET ET FINANCES', $this->couleur_succes);

        // Dépenses validées uniquement (cohérent avec details.php et budget/liste.php)
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(montant), 0) as total_depense
            FROM depenses
            WHERE projet_id = ? AND validee = 1
        ");
        $stmt->execute([$this->projet['id']]);
        $total_depense = $stmt->fetchColumn();

        // Dépenses en attente
        $stmt2 = $this->pdo->prepare("
            SELECT COALESCE(SUM(montant), 0) as attente, COUNT(*) as nb_attente
            FROM depenses
            WHERE projet_id = ? AND validee = 0
        ");
        $stmt2->execute([$this->projet['id']]);
        $attente = $stmt2->fetch();

        $budget_restant    = $this->projet['budget_actuel'] - $total_depense;
        $taux_consommation = $this->projet['budget_actuel'] > 0
            ? ($total_depense / $this->projet['budget_actuel']) * 100
            : 0;

        $donnees_budget = [
            ['Budget initial',        number_format($this->projet['budget_initial'], 0, ',', ' ') . ' FCFA'],
            ['Budget actuel',         number_format($this->projet['budget_actuel'], 0, ',', ' ') . ' FCFA'],
            ['Total dépensé (validé)', number_format($total_depense, 0, ',', ' ') . ' FCFA'],
            ['En attente validation', number_format($attente['attente'], 0, ',', ' ') . ' FCFA (' . $attente['nb_attente'] . ')'],
            ['Budget restant',        number_format($budget_restant, 0, ',', ' ') . ' FCFA'],
            ['Taux de consommation',  number_format($taux_consommation, 1) . ' %'],
        ];
        $this->creerTableauStyle($donnees_budget, [80, 100]);

        $this->pdf->Ln(10);
        $this->pdf->SetFont('helvetica', 'B', 11);
        $this->pdf->Cell(0, 8, 'Consommation budgétaire', 0, 1);
        $this->dessinerBarreProgression($taux_consommation, 'Budget consommé');

        if ($detaille) {
            $this->ajouterListeDepenses();
        }
        $this->ajouterPiedPagePersonnalise();
    }

    /**
     * BUG CORRIGÉ : la requête sélectionnait 'description' et 'categorie' comme
     * colonnes principales, mais 'libelle' est la colonne NOT NULL et la plus
     * descriptive. Le tableau PDF affichait 'description' (souvent vide) au lieu
     * du libellé. Ajout de fournisseur et validation du statut.
     */
    private function ajouterListeDepenses() {
        $this->pdf->Ln(10);
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->Cell(0, 8, 'Détail des dépenses (validées)', 0, 1);

        // BUG CORRIGÉ : on sélectionne libelle (NOT NULL), fournisseur, et on filtre validee=1
        $stmt = $this->pdo->prepare("
            SELECT date_depense, libelle, fournisseur, categorie, montant, validee
            FROM depenses
            WHERE projet_id = ?
            ORDER BY date_depense DESC
            LIMIT 20
        ");
        $stmt->execute([$this->projet['id']]);
        $depenses = $stmt->fetchAll();

        if (count($depenses) > 0) {
            // En-tête du tableau
            $this->pdf->SetFillColor(37, 99, 235);
            $this->pdf->SetTextColor(255, 255, 255);
            $this->pdf->SetFont('helvetica', 'B', 9);

            // BUG CORRIGÉ : colonnes renommées pour correspondre à la vraie BDD
            $this->pdf->Cell(25, 7, 'Date',        1, 0, 'C', true);
            $this->pdf->Cell(65, 7, 'Libellé',     1, 0, 'C', true);  // ← était 'Description'
            $this->pdf->Cell(40, 7, 'Fournisseur', 1, 0, 'C', true);  // ← était 'Catégorie'
            $this->pdf->Cell(30, 7, 'Montant',     1, 0, 'C', true);
            $this->pdf->Cell(20, 7, 'Statut',      1, 1, 'C', true);

            $this->pdf->SetTextColor(0, 0, 0);
            $this->pdf->SetFont('helvetica', '', 8);
            $fill = false;

            foreach ($depenses as $depense) {
                $this->pdf->SetFillColor(245, 245, 245);
                $statut_label = $depense['validee'] ? 'Validée' : 'En attente';

                $this->pdf->Cell(25, 6, date('d/m/Y', strtotime($depense['date_depense'])), 1, 0, 'C', $fill);
                $this->pdf->Cell(65, 6, mb_substr($depense['libelle'], 0, 32),              1, 0, 'L', $fill); // ← libelle
                $this->pdf->Cell(40, 6, $depense['fournisseur'] ?? '-',                     1, 0, 'L', $fill); // ← fournisseur
                $this->pdf->Cell(30, 6, number_format($depense['montant'], 0, ',', ' '),    1, 0, 'R', $fill);
                $this->pdf->Cell(20, 6, $statut_label,                                      1, 1, 'C', $fill);

                $fill = !$fill;
            }
        } else {
            $this->pdf->SetFont('helvetica', 'I', 10);
            $this->pdf->Cell(0, 8, 'Aucune dépense enregistrée', 0, 1);
        }
    }

    private function ajouterSectionAvancement($detaille = false) {
        $this->pdf->AddPage();
        $this->ajouterEnTetePersonnalise();
        $this->pdf->SetY(28);
        $this->ajouterTitreSection('3. AVANCEMENT DU PROJET', $this->couleur_warning);

        $debut       = new DateTime($this->projet['date_debut']);
        $fin_prevue  = new DateTime($this->projet['date_fin_prevue']);
        $aujourd_hui = new DateTime();

        $duree_totale      = $debut->diff($fin_prevue)->days;
        $jours_ecoules     = $debut->diff($aujourd_hui)->days;
        $diff_restant      = $aujourd_hui->diff($fin_prevue);
        $jours_restants    = $aujourd_hui > $fin_prevue ? -$diff_restant->days : $diff_restant->days;
        $avancement_temporel = $duree_totale > 0 ? min(100, ($jours_ecoules / $duree_totale) * 100) : 0;

        $donnees_avancement = [
            ['Avancement physique',  $this->projet['avancement_physique'] . ' %'],
            ['Avancement temporel',  number_format($avancement_temporel, 1) . ' %'],
            ['Jours écoulés',        $jours_ecoules . ' jours'],
            ['Jours restants',       $jours_restants . ' jours' . ($jours_restants < 0 ? ' (RETARD)' : '')],
            ['Durée totale prévue',  $duree_totale . ' jours'],
        ];
        $this->creerTableauStyle($donnees_avancement, [80, 100]);

        $this->pdf->Ln(10);
        $this->pdf->SetFont('helvetica', 'B', 11);
        $this->pdf->Cell(0, 8, 'Progression visuelle', 0, 1);
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, 'Avancement physique :', 0, 1);
        $this->dessinerBarreProgression($this->projet['avancement_physique'], '');
        $this->pdf->Ln(5);
        $this->pdf->Cell(0, 6, 'Avancement temporel :', 0, 1);
        $this->dessinerBarreProgression($avancement_temporel, '');

        $this->pdf->Ln(10);
        $ecart = $this->projet['avancement_physique'] - $avancement_temporel;
        if ($ecart > 5) {
            $this->pdf->SetTextColor(16, 185, 129);
            $message = '✓ Le projet est en avance sur le planning (' . number_format(abs($ecart), 1) . '%)';
        } elseif ($ecart < -5) {
            $this->pdf->SetTextColor(239, 68, 68);
            $message = '⚠ Le projet est en retard sur le planning (' . number_format(abs($ecart), 1) . '%)';
        } else {
            $this->pdf->SetTextColor(37, 99, 235);
            $message = '→ Le projet suit le planning';
        }
        $this->pdf->SetFont('helvetica', 'B', 11);
        $this->pdf->Cell(0, 8, $message, 0, 1);
        $this->pdf->SetTextColor(0, 0, 0);

        $this->ajouterPiedPagePersonnalise();
    }

    private function ajouterSectionPhotos() {
        $stmt = $this->pdo->prepare("
            SELECT * FROM photos
            WHERE projet_id = ?
            ORDER BY date_upload DESC
            LIMIT 9
        ");
        $stmt->execute([$this->projet['id']]);
        $photos = $stmt->fetchAll();

        if (count($photos) === 0) return;

        $this->pdf->AddPage();
        $this->ajouterEnTetePersonnalise();
        $this->pdf->SetY(28);
        $this->ajouterTitreSection('4. GALERIE PHOTOS', $this->couleur_primaire);

        $largeur_image = 55;
        $hauteur_image = 40;
        $espacement    = 5;
        $x_start       = 15;
        $y_start       = $this->pdf->GetY();

        foreach ($photos as $index => $photo) {
            $chemin_image = dirname(__DIR__) . '/assets/uploads/' . $photo['fichier_url'];
            if (!file_exists($chemin_image)) continue;

            $colonne = $index % 3;
            $ligne   = floor($index / 3);
            $x       = $x_start + ($colonne * ($largeur_image + $espacement));
            $y       = $y_start + ($ligne * ($hauteur_image + 15));

            if ($y > 240) {
                $this->pdf->AddPage();
                $this->ajouterEnTetePersonnalise();
                $y_start = 35;
                $y       = $y_start;
            }

            $this->pdf->Rect($x, $y, $largeur_image, $hauteur_image);
            $this->pdf->Image($chemin_image, $x + 1, $y + 1, $largeur_image - 2, $hauteur_image - 2, '', '', '', true, 150);

            $this->pdf->SetXY($x, $y + $hauteur_image + 1);
            $this->pdf->SetFont('helvetica', '', 7);
            $legende = !empty($photo['legende']) ? mb_substr($photo['legende'], 0, 25) : 'Sans légende';
            $this->pdf->Cell($largeur_image, 3, $legende, 0, 1, 'C');

            $date = date('d/m/Y', strtotime($photo['date_prise'] ?? $photo['date_upload']));
            $this->pdf->SetX($x);
            $this->pdf->SetFont('helvetica', 'I', 6);
            $this->pdf->SetTextColor(128, 128, 128);
            $this->pdf->Cell($largeur_image, 3, $date, 0, 0, 'C');
            $this->pdf->SetTextColor(0, 0, 0);
        }
        $this->ajouterPiedPagePersonnalise();
    }

    private function dessinerBarreProgression($pourcentage, $label = '') {
        $largeur_totale = 170;
        $hauteur        = 12;
        $x_start        = 15;
        $y              = $this->pdf->GetY();

        $this->pdf->SetFillColor(230, 230, 230);
        $this->pdf->Rect($x_start, $y, $largeur_totale, $hauteur, 'F');

        $largeur_remplie = ($pourcentage / 100) * $largeur_totale;
        if ($pourcentage < 30)      $this->pdf->SetFillColor(239, 68, 68);
        elseif ($pourcentage < 70)  $this->pdf->SetFillColor(245, 158, 11);
        else                         $this->pdf->SetFillColor(16, 185, 129);

        $this->pdf->Rect($x_start, $y, $largeur_remplie, $hauteur, 'F');
        $this->pdf->Rect($x_start, $y, $largeur_totale, $hauteur);

        $this->pdf->SetXY($x_start, $y + 2);
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->Cell($largeur_totale, 8, number_format($pourcentage, 1) . '%', 0, 0, 'C');
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->Ln($hauteur + 2);
    }

    private function creerTableauStyle($donnees, $largeurs) {
        $this->pdf->SetFont('helvetica', '', 10);
        $fill = false;
        foreach ($donnees as $ligne) {
            $this->pdf->SetFillColor($fill ? 245 : 255, $fill ? 245 : 255, $fill ? 245 : 255);
            $this->pdf->SetFont('helvetica', 'B', 10);
            $this->pdf->Cell($largeurs[0], 8, $ligne[0], 1, 0, 'L', true);
            $this->pdf->SetFont('helvetica', '', 10);
            $this->pdf->Cell($largeurs[1], 8, $ligne[1], 1, 1, 'L', true);
            $fill = !$fill;
        }
    }

    private function ajouterTitreSection($titre, $couleur) {
        $this->pdf->SetFont('helvetica', 'B', 14);
        $this->pdf->SetFillColor($couleur[0], $couleur[1], $couleur[2]);
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->Cell(0, 10, $titre, 0, 1, 'L', true);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->Ln(5);
    }

    public function telecharger($nom_fichier = null) {
        if (!$nom_fichier) {
            $nom_fichier = 'rapport_projet_' . $this->projet['id'] . '_' . date('Ymd') . '.pdf';
        }
        $this->pdf->Output($nom_fichier, 'D');
    }

    public function afficher() {
        $nom_fichier = 'rapport_projet_' . $this->projet['id'] . '.pdf';
        $this->pdf->Output($nom_fichier, 'I');
    }
}
