<?php
$page_title = 'Ajouter des photos';
require_once '../includes/header.php';
require_connexion();
require_once '../includes/navbar.php';

// BUG CORRIGÉ : aucune vérification de rôle — même un lecteur pouvait uploader.
// Seuls les gestionnaires et admins peuvent ajouter des photos.
if (!peut_faire('gestionnaire')) {
    set_flash('danger', "Accès refusé. Vous n'avez pas les droits pour ajouter des photos.");
    header('Location: ' . SITE_URL . '/projets/liste.php');
    exit;
}

// Récupérer l'ID du projet
$projet_id = $_GET['id'] ?? 0;

// Vérifier que le projet existe
$stmt = $pdo->prepare("SELECT id, titre FROM projets WHERE id = ?");
$stmt->execute([$projet_id]);
$projet = $stmt->fetch();

if (!$projet) {
    set_flash('error', 'Projet introuvable');
    header('Location: liste.php');
    exit;
}

// Traitement de l'upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['photos'])) {
    $upload_dir = '../assets/uploads/';
    
    // Créer le dossier s'il n'existe pas
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $uploaded_count = 0;
    $errors = [];
    
    // Parcourir tous les fichiers uploadés
    $files = $_FILES['photos'];
    $file_count = count($files['name']);
    
    for ($i = 0; $i < $file_count; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $tmp_name = $files['tmp_name'][$i];
            $name = $files['name'][$i];
            $size = $files['size'][$i];
            
            // Vérifier le type de fichier
            $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime_type = finfo_file($finfo, $tmp_name);
            finfo_close($finfo);
            
            if (!in_array($mime_type, $allowed_types)) {
                $errors[] = "Le fichier $name n'est pas une image valide";
                continue;
            }
            
            // Vérifier la taille (max 5MB)
            if ($size > 5 * 1024 * 1024) {
                $errors[] = "Le fichier $name est trop volumineux (max 5MB)";
                continue;
            }
            
            // Générer un nom unique
            $extension = pathinfo($name, PATHINFO_EXTENSION);
            $new_name = 'projet_' . $projet_id . '_' . time() . '_' . $i . '.' . $extension;
            $destination = $upload_dir . $new_name;
            
            // Déplacer le fichier
            if (move_uploaded_file($tmp_name, $destination)) {
                // Enregistrer dans la base de données
                $legende = $_POST['legendes'][$i] ?? '';
                $date_prise = $_POST['dates_prise'][$i] ?? date('Y-m-d');
                
                $sql = "INSERT INTO photos (
                    projet_id, fichier_url, fichier_nom, taille, legende, 
                    date_prise, uploaded_by, date_upload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $projet_id,
                    $new_name,
                    $name,
                    $size,
                    $legende,
                    $date_prise,
                    $_SESSION['utilisateur_id']
                ]);
                
                $uploaded_count++;
            } else {
                $errors[] = "Erreur lors de l'upload de $name";
            }
        }
    }
    
    // BUG CORRIGÉ : deux set_flash() successifs s'écrasaient.
    // Le second écrasait toujours le premier — succès ou erreur disparaissait.
    if ($uploaded_count > 0 && empty($errors)) {
        set_flash('success', "$uploaded_count photo(s) ajoutée(s) avec succès !");
    } elseif ($uploaded_count > 0 && !empty($errors)) {
        set_flash('warning', "$uploaded_count photo(s) ajoutée(s). Problème sur " . count($errors) . " fichier(s) : " . implode(' — ', $errors));
    } elseif ($uploaded_count === 0 && !empty($errors)) {
        set_flash('danger', 'Aucune photo uploadée. ' . implode(' — ', $errors));
    } else {
        set_flash('warning', 'Aucun fichier reçu.');
    }
    
    header('Location: details.php?id=' . $projet_id);
    exit;
}
?>

<div class="container-fluid mt-4">
    <?= get_flash() ?>
    
    <!-- En-tête -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-camera me-2"></i>Ajouter des photos</h1>
                <p class="text-muted mb-0">
                    Projet : <strong><?= e($projet['titre']) ?></strong>
                </p>
            </div>
            <a href="<?= SITE_URL ?>/projets/details.php?id=<?= $projet_id ?>" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Retour au projet
            </a>
        </div>
    </div>
    
    <div class="row">
        <div class="col-lg-8 mx-auto">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-cloud-upload me-2"></i>
                        Upload de photos
                    </h5>
                </div>
                <div class="card-body">
                    <form method="POST" action="" enctype="multipart/form-data" id="upload-form">
                        
                        <!-- Zone de drop -->
                        <div class="border border-2 border-dashed rounded p-5 text-center mb-4" 
                             id="drop-zone"
                             style="border-color: var(--primary) !important; background-color: var(--gray-50);">
                            <i class="bi bi-cloud-arrow-up display-1 text-primary mb-3"></i>
                            <h4>Glissez-déposez vos photos ici</h4>
                            <p class="text-muted">ou</p>
                            <label for="photos" class="btn btn-primary btn-lg">
                                <i class="bi bi-folder2-open me-2"></i>
                                Parcourir vos fichiers
                            </label>
                            <input 
                                type="file" 
                                class="d-none" 
                                id="photos" 
                                name="photos[]" 
                                accept="image/*" 
                                multiple
                                required
                            >
                            <p class="text-muted small mt-3 mb-0">
                                Formats acceptés : JPG, PNG, GIF • Taille max : 5 MB par photo
                            </p>
                        </div>
                        
                        <!-- Prévisualisation -->
                        <div id="preview-container" class="mb-4" style="display: none;">
                            <h5 class="mb-3">
                                <i class="bi bi-eye me-2"></i>
                                Prévisualisation (<span id="photo-count">0</span> photo(s))
                            </h5>
                            <div id="preview-grid" class="row g-3"></div>
                        </div>
                        
                        <!-- Boutons -->
                        <div class="d-flex justify-content-between align-items-center">
                            <button type="button" class="btn btn-outline-danger" id="clear-btn" style="display: none;">
                                <i class="bi bi-trash me-2"></i>
                                Tout effacer
                            </button>
                            
                            <button type="submit" class="btn btn-primary btn-lg" id="submit-btn" disabled>
                                <i class="bi bi-cloud-upload me-2"></i>
                                Uploader les photos
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Conseils -->
            <div class="card mt-4">
                <div class="card-body">
                    <h6 class="mb-3">
                        <i class="bi bi-lightbulb me-2"></i>
                        Conseils pour de bonnes photos
                    </h6>
                    <ul class="mb-0">
                        <li>Prenez des photos claires et bien éclairées</li>
                        <li>Montrez différents angles du projet</li>
                        <li>Incluez des photos avant/après si possible</li>
                        <li>Ajoutez une légende descriptive pour chaque photo</li>
                        <li>Prenez des photos régulièrement pour suivre l'évolution</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Gestion de l'upload de photos avec prévisualisation
const photosInput = document.getElementById('photos');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const previewGrid = document.getElementById('preview-grid');
const photoCount = document.getElementById('photo-count');
const submitBtn = document.getElementById('submit-btn');
const clearBtn = document.getElementById('clear-btn');

let selectedFiles = [];

// Clic sur la zone de drop pour ouvrir le sélecteur
dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
        photosInput.click();
    }
});

// Drag & drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = 'var(--gray-50)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'var(--gray-50)';
    
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Sélection de fichiers
photosInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Gérer les fichiers sélectionnés
function handleFiles(files) {
    selectedFiles = Array.from(files);
    
    if (selectedFiles.length === 0) {
        previewContainer.style.display = 'none';
        submitBtn.disabled = true;
        clearBtn.style.display = 'none';
        return;
    }
    
    previewContainer.style.display = 'block';
    submitBtn.disabled = false;
    clearBtn.style.display = 'inline-block';
    photoCount.textContent = selectedFiles.length;
    
    // Afficher les prévisualisations
    previewGrid.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
                <div class="card">
                    <img src="${e.target.result}" class="card-img-top" style="height: 200px; object-fit: cover;">
                    <div class="card-body p-2">
                        <input type="text" 
                               name="legendes[]" 
                               class="form-control form-control-sm mb-2" 
                               placeholder="Légende (optionnel)">
                        <input type="date" 
                               name="dates_prise[]" 
                               class="form-control form-control-sm" 
                               value="${new Date().toISOString().split('T')[0]}">
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger w-100 mt-2 remove-photo" 
                                data-index="${index}">
                            <i class="bi bi-trash"></i> Retirer
                        </button>
                    </div>
                </div>
            `;
            previewGrid.appendChild(col);
        };
        reader.readAsDataURL(file);
    });
}

// Retirer une photo
previewGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-photo') || e.target.closest('.remove-photo')) {
        const btn = e.target.closest('.remove-photo');
        const index = parseInt(btn.dataset.index);
        selectedFiles.splice(index, 1);
        
        // Recréer le DataTransfer
        const dt = new DataTransfer();
        selectedFiles.forEach(file => dt.items.add(file));
        photosInput.files = dt.files;
        
        handleFiles(selectedFiles);
    }
});

// Tout effacer
clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    photosInput.value = '';
    previewContainer.style.display = 'none';
    submitBtn.disabled = true;
    clearBtn.style.display = 'none';
});
</script>

<?php require_once '../includes/footer.php'; ?>
