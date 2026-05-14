<?php
$page_title = 'Carte des Projets';
require_once 'includes/header.php';
require_connexion();
require_once 'includes/navbar.php';

// Récupérer tous les projets avec coordonnées
$projets = $pdo->query("
    SELECT 
        p.*,
        c.nom as commune_nom,
        t.nom as type_nom,
        t.couleur as type_couleur
    FROM projets p
    LEFT JOIN communes c ON p.commune_id = c.id
    LEFT JOIN types_projets t ON p.type_projet_id = t.id
    WHERE p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    ORDER BY p.created_at DESC
")->fetchAll();


// Récupérer les communes pour les filtres
$communes = $pdo->query("SELECT id, nom FROM communes ORDER BY nom")->fetchAll();

// Statistiques pour la carte
$stats_carte = [
    'total' => count($projets),
    'en_cours' => count(array_filter($projets, fn($p) => $p['statut'] === 'en_cours')),
    'planifie' => count(array_filter($projets, fn($p) => $p['statut'] === 'planifié')),
    'termine' => count(array_filter($projets, fn($p) => $p['statut'] === 'terminé')),
];
?>

<style>
#map {
    height: 600px;
    width: 100%;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.legend-card {
    background: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.legend-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.filter-section {
    background: white;
    padding: 20px;
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 20px;
}

.leaflet-popup-content-wrapper {
    border-radius: 10px;
}

.leaflet-popup-content {
    margin: 15px;
    min-width: 250px;
}

.popup-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 10px;
}

.popup-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: #6b7280;
}

.popup-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.stat-mini-card {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
}

.stat-mini-card h3 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 5px;
}

.stat-mini-card p {
    font-size: 0.85rem;
    margin: 0;
    opacity: 0.9;
}
</style>

<div class="container-fluid mt-4">
    <!-- En-tête de page -->
    <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1><i class="bi bi-geo-alt-fill me-2"></i>Carte des Projets</h1>
                <p class="text-muted mb-0">
                    Visualisation géographique des projets municipaux
                </p>
            </div>
            <a href="<?= SITE_URL ?>/dashboard.php" class="btn btn-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Retour
            </a>
        </div>
    </div>
    
    <!-- Statistiques rapides -->
    <div class="row mb-4">
        <div class="col-md-3 mb-3">
            <div class="stat-mini-card" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);">
                <h3><?= $stats_carte['total'] ?></h3>
                <p>Projets localisés</p>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-mini-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <h3><?= $stats_carte['en_cours'] ?></h3>
                <p>En cours</p>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-mini-card" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
                <h3><?= $stats_carte['planifie'] ?></h3>
                <p>Planifiés</p>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="stat-mini-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <h3><?= $stats_carte['termine'] ?></h3>
                <p>Terminés</p>
            </div>
        </div>
    </div>
    
    <!-- Filtres -->
    <div class="filter-section">
        <div class="row align-items-end">
            <div class="col-md-4 mb-3">
                <label class="form-label fw-bold">
                    <i class="bi bi-funnel me-1"></i>
                    Filtrer par Commune
                </label>
                <select id="communeFilter" class="form-select">
                    <option value="">Toutes les communes</option>
                    <?php foreach ($communes as $commune): ?>
                    <option value="<?= $commune['id'] ?>"><?= e($commune['nom']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="col-md-4 mb-3">
                <label class="form-label fw-bold">
                    <i class="bi bi-flag me-1"></i>
                    Filtrer par Statut
                </label>
                <select id="statutFilter" class="form-select">
                    <option value="">Tous les statuts</option>
                    <option value="planifié">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminé">Terminé</option>
                    <option value="suspendu">Suspendu</option>
                </select>
            </div>
            
            <div class="col-md-4 mb-3">
                <button id="resetFilters" class="btn btn-outline-secondary w-100">
                    <i class="bi bi-x-circle me-2"></i>
                    Réinitialiser les filtres
                </button>
            </div>
        </div>
    </div>
    
    <!-- Carte et Légende -->
    <div class="row">
        <div class="col-lg-9 mb-4">
            <div id="map"></div>
        </div>
        
        <div class="col-lg-3 mb-4">
            <div class="legend-card">
                <h5 class="mb-3">
                    <i class="bi bi-info-circle me-2"></i>
                    Légende
                </h5>
                
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #3b82f6;"></div>
                    <span>En cours</span>
                </div>
                
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #64748b;"></div>
                    <span>Planifié</span>
                </div>
                
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #10b981;"></div>
                    <span>Terminé</span>
                </div>
                
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #f59e0b;"></div>
                    <span>Suspendu</span>
                </div>
                
                <hr class="my-3">
                
                <h6 class="mb-2">
                    <i class="bi bi-hand-index me-2"></i>
                    Interactions
                </h6>
                <ul class="small text-muted mb-0" style="list-style: none; padding: 0;">
                    <li class="mb-2">
                        <i class="bi bi-cursor me-2"></i>
                        Cliquez sur un marqueur pour voir les détails
                    </li>
                    <li class="mb-2">
                        <i class="bi bi-zoom-in me-2"></i>
                        Utilisez la molette pour zoomer
                    </li>
                    <li>
                        <i class="bi bi-arrows-move me-2"></i>
                        Glissez pour déplacer la carte
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>

<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
// Données des projets
const projetsData = <?= json_encode($projets, JSON_HEX_TAG | JSON_HEX_AMP) ?>; /* XSS CORRIGÉ : JSON_HEX_TAG échappe <> pour éviter injection </script> */

// Couleurs par statut
const statusColors = {
    'en_cours': '#3b82f6',
    'planifié': '#64748b',
    'terminé': '#10b981',
    'suspendu': '#f59e0b'
};

// Initialiser la carte centrée sur Douala
const map = L.map('map').setView([4.0511, 9.7679], 11);

// Ajouter la couche de tuiles (carte de fond)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// Stocker les marqueurs
let markers = [];

// Fonction pour créer le popup HTML
function createPopupContent(projet) {
    const statusLabels = {
        'en_cours': 'En cours',
        'planifié': 'Planifié',
        'terminé': 'Terminé',
        'suspendu': 'Suspendu'
    };
    
    const statusClasses = {
        'en_cours': 'bg-primary',
        'planifié': 'bg-secondary',
        'terminé': 'bg-success',
        'suspendu': 'bg-warning'
    };
    
    return `
        <div>
            <div class="popup-title">${projet.titre}</div>
            
            <div class="popup-info">
                <i class="bi bi-geo-alt-fill text-primary"></i>
                <span>${projet.commune_nom}</span>
            </div>
            
            <div class="popup-info">
                <i class="bi bi-tag-fill" style="color: ${projet.type_couleur}"></i>
                <span>${projet.type_nom}</span>
            </div>
            
            <div class="popup-info">
                <i class="bi bi-wallet2 text-warning"></i>
                <span>${(projet.budget_actuel / 1000000).toFixed(1)}M FCFA</span>
            </div>
            
            <div class="popup-info">
                <i class="bi bi-graph-up text-success"></i>
                <span>${projet.avancement_physique}% complété</span>
            </div>
            
            <div class="mt-2">
                <span class="popup-badge ${statusClasses[projet.statut]} text-white">
                    ${statusLabels[projet.statut]}
                </span>
            </div>
            
            <div class="mt-3">
                <a href="<?= SITE_URL ?>/projets/details.php?id=${projet.id}" 
                   class="btn btn-sm btn-primary w-100">
                    <i class="bi bi-eye me-1"></i>
                    Voir les détails
                </a>
            </div>
        </div>
    `;
}

// Fonction pour ajouter les marqueurs
function addMarkers(filteredProjects = projetsData) {
    // Supprimer les marqueurs existants
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Ajouter les nouveaux marqueurs
    filteredProjects.forEach(projet => {
        if (projet.latitude && projet.longitude) {
            // Créer une icône personnalisée
            const markerColor = statusColors[projet.statut] || '#64748b';
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background-color: ${markerColor};
                        width: 30px;
                        height: 30px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        border: 3px solid white;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                    ">
                        <div style="
                            transform: rotate(45deg);
                            margin-top: 3px;
                            margin-left: 3px;
                            color: white;
                            font-size: 14px;
                        ">
                            <i class="bi bi-geo-alt-fill"></i>
                        </div>
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });
            
            // Créer le marqueur
            const marker = L.marker([projet.latitude, projet.longitude], {
                icon: markerIcon
            })
            .bindPopup(createPopupContent(projet))
            .addTo(map);
            
            // Stocker les données du projet dans le marqueur
            marker.projetData = projet;
            
            markers.push(marker);
        }
    });
    
    // Ajuster la vue pour montrer tous les marqueurs
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Ajouter les marqueurs initiaux
addMarkers();

// Gestion des filtres
document.getElementById('communeFilter').addEventListener('change', applyFilters);
document.getElementById('statutFilter').addEventListener('change', applyFilters);

function applyFilters() {
    const communeId = document.getElementById('communeFilter').value;
    const statut = document.getElementById('statutFilter').value;
    
    const filteredProjects = projetsData.filter(projet => {
        const matchCommune = !communeId || projet.commune_id == communeId;
        const matchStatut = !statut || projet.statut === statut;
        return matchCommune && matchStatut;
    });
    
    addMarkers(filteredProjects);
}

// Réinitialiser les filtres
document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('communeFilter').value = '';
    document.getElementById('statutFilter').value = '';
    addMarkers();
});
</script>

<?php require_once 'includes/footer.php'; ?>
