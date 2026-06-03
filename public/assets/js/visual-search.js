/**
 * visual-search.js — Recherche Visuelle par IA
 * TensorFlow.js + MobileNet V1 (alpha 0.25, < 2 Mo)
 * MuniPro Portail Citoyen — Capture MANUELLE
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════
  //  CONFIGURATION
  // ═══════════════════════════════════════════
  var CFG = {
    modelVersion : 1,
    modelAlpha   : 0.25,
    topK         : 5,
    minConf      : 0.12,
    apiEndpoint  : '/api/recherche-visuelle',
    canvasSize   : 224,
    tfCDN        : 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js',
    mnetCDN      : 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js',
  };

  // ═══════════════════════════════════════════
  //  MAPPING  ImageNet → Types de projets MuniPro
  // ═══════════════════════════════════════════
  var LABEL_MAP = {
    // ── Infrastructures ──────────────────────
    'crane'               : 'Infrastructures',
    'gantry crane'        : 'Infrastructures',
    'mobile crane'        : 'Infrastructures',
    'crane machine'       : 'Infrastructures',
    'bulldozer'           : 'Infrastructures',
    'caterpillar'         : 'Infrastructures',
    'excavator'           : 'Infrastructures',
    'tractor'             : 'Infrastructures',
    'bridge'              : 'Infrastructures',
    'steel arch bridge'   : 'Infrastructures',
    'suspension bridge'   : 'Infrastructures',
    'viaduct'             : 'Infrastructures',
    'pier'                : 'Infrastructures',
    'dock'                : 'Infrastructures',
    'scaffolding'         : 'Infrastructures',
    'construction'        : 'Infrastructures',
    'cement'              : 'Infrastructures',
    'concrete'            : 'Infrastructures',
    'brickwork'           : 'Infrastructures',
    'building'            : 'Infrastructures',
    'arch'                : 'Infrastructures',
    'patio'               : 'Infrastructures',
    // ── Santé ─────────────────────────────────
    'ambulance'           : 'Santé',
    'stretcher'           : 'Santé',
    'mask'                : 'Santé',
    'syringe'             : 'Santé',
    'pill bottle'         : 'Santé',
    'hospital'            : 'Santé',
    // ── Éducation ─────────────────────────────
    'school bus'          : 'Éducation',
    'library'             : 'Éducation',
    'book'                : 'Éducation',
    'blackboard'          : 'Éducation',
    'monitor'             : 'Éducation',
    'laptop'              : 'Éducation',
    'pencil box'          : 'Éducation',
    // ── Hydraulique ───────────────────────────
    'dam'                 : 'Hydraulique',
    'fountain'            : 'Hydraulique',
    'water tower'         : 'Hydraulique',
    'pipeline'            : 'Hydraulique',
    'plumber'             : 'Hydraulique',
    'water'               : 'Hydraulique',
    // ── Énergie ───────────────────────────────
    'solar dish'          : 'Énergie',
    'solar panel'         : 'Énergie',
    'power line'          : 'Énergie',
    'electric fan'        : 'Énergie',
    'windmill'            : 'Énergie',
    'generator'           : 'Énergie',
    'transformer'         : 'Énergie',
    // ── Commerce ──────────────────────────────
    'bakery'              : 'Commerce',
    'grocery store'       : 'Commerce',
    'market'              : 'Commerce',
    'shopping cart'       : 'Commerce',
    'cash machine'        : 'Commerce',
    // ── Environnement ─────────────────────────
    'greenhouse'          : 'Environnement',
    'park bench'          : 'Environnement',
    'garden'              : 'Environnement',
    'trash can'           : 'Environnement',
    'compost'             : 'Environnement',
    'tree'                : 'Environnement',
    // ── Voirie ────────────────────────────────
    'street sign'         : 'Voirie',
    'traffic light'       : 'Voirie',
    'road'                : 'Voirie',
    'lane'                : 'Voirie',
    'asphalt'             : 'Voirie',
    'sidewalk'            : 'Voirie',
    'curb'                : 'Voirie',
    'pothole'             : 'Voirie',
    'guardrail'           : 'Voirie',
    'car wheel'           : 'Voirie',
    // ── Social ────────────────────────────────
    'gymnasium'           : 'Social',
    'stadium'             : 'Social',
    'arena'               : 'Social',
    'sports car'          : 'Social',
    'soccer ball'         : 'Social',
  };

  // ═══════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════
  var modelInstance  = null;
  var currentStream  = null;
  var isAnalyzing    = false;
  var modalEl        = null;
  var videoEl        = null;
  var canvasEl       = null;

  // ═══════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════
  function $(id) { return document.getElementById(id); }

  function escHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function showStatus(msg, type) {
    var el = $('vs-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'vs-status vs-status-' + (type || 'info');
    el.style.display = 'flex';
  }

  function hideStatus() {
    var el = $('vs-status');
    if (el) el.style.display = 'none';
  }

  // ═══════════════════════════════════════════
  //  CHARGEMENT LAZY TF.JS + MOBILENET
  // ═══════════════════════════════════════════
  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.onload  = resolve;
      s.onerror = function() { reject(new Error('Échec chargement: ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function loadModel() {
    if (modelInstance) return modelInstance;

    showStatus('Téléchargement du modèle IA… (1 seule fois)', 'loading');

    await loadScript(CFG.tfCDN);
    await loadScript(CFG.mnetCDN);

    showStatus('Initialisation du modèle…', 'loading');

    modelInstance = await window.mobilenet.load({
      version : CFG.modelVersion,
      alpha   : CFG.modelAlpha,
    });

    showStatus('Modèle IA prêt ✓', 'success');
    setTimeout(hideStatus, 2000);

    return modelInstance;
  }

  // ═══════════════════════════════════════════
  //  CAMÉRA
  // ═══════════════════════════════════════════
  async function startCamera() {
    // Contraintes compatibles mobile + desktop
    var constraints = {
      video: {
        facingMode : { ideal: 'environment' },
        width      : { ideal: 1280, max: 1920 },
        height     : { ideal: 720,  max: 1080 },
      },
      audio: false,
    };

    try {
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // iOS Safari : réessayer sans contrainte facingMode
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } else {
        throw err;
      }
    }

    videoEl.srcObject = currentStream;

    // iOS Safari nécessite setAttribute playsinline
    videoEl.setAttribute('playsinline', true);
    videoEl.setAttribute('muted', true);
    videoEl.muted = true;

    await new Promise(function(resolve, reject) {
      videoEl.onloadedmetadata = resolve;
      videoEl.onerror = reject;
    });

    videoEl.play();

    $('vs-camera-section').style.display = 'block';
    $('vs-permission-error').style.display = 'none';
    $('vs-capture-btn').disabled = false;
    $('vs-capture-btn').classList.remove('vs-btn-loading');
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(function(t) { t.stop(); });
      currentStream = null;
    }
    if (videoEl) { videoEl.srcObject = null; }
  }

  // ═══════════════════════════════════════════
  //  CAPTURE + ANALYSE (MANUELLE)
  // ═══════════════════════════════════════════
  async function captureAndAnalyze() {
    if (isAnalyzing) return;
    if (!modelInstance) {
      showStatus('Modèle pas encore prêt, patientez…', 'loading');
      return;
    }

    isAnalyzing = true;
    var captureBtn = $('vs-capture-btn');
    if (captureBtn) {
      captureBtn.disabled = true;
      captureBtn.classList.add('vs-btn-loading');
      captureBtn.innerHTML = '<span class="vs-spinner"></span> Analyse…';
    }

    try {
      // 1) Dessiner la frame vidéo sur le canvas 224×224
      var ctx = canvasEl.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, CFG.canvasSize, CFG.canvasSize);

      // 2) Afficher l'aperçu
      var previewImg = $('vs-preview-img');
      if (previewImg) {
        previewImg.src = canvasEl.toDataURL('image/jpeg', 0.85);
        $('vs-preview-section').style.display = 'block';
      }

      // 3) Cacher anciens résultats
      $('vs-results-section').style.display = 'none';
      showStatus('Identification visuelle en cours…', 'loading');

      // 4) Inférence MobileNet
      var predictions = await modelInstance.classify(canvasEl, CFG.topK);
      console.log('[VisualSearch] Prédictions brutes:', predictions);

      // 5) Filtrer par confiance
      var confident = predictions.filter(function(p) {
        return p.probability >= CFG.minConf;
      });

      if (confident.length === 0) {
        showStatus('Aucune correspondance confiante. Réessayez avec une meilleure image.', 'warning');
        isAnalyzing = false;
        resetCaptureBtn();
        return;
      }

      // 6) Mapper vers types de projets MuniPro
      var keywords = mapToProjectTypes(confident);
      console.log('[VisualSearch] Mots-clés MuniPro:', keywords);

      showStatus('Recherche dans la base de données…', 'loading');

      // 7) Appel API
      await searchProjects(keywords, confident);

    } catch (err) {
      console.error('[VisualSearch] Erreur:', err);
      showStatus('Erreur lors de l\'analyse. Réessayez.', 'error');
    } finally {
      isAnalyzing = false;
      resetCaptureBtn();
    }
  }

  function resetCaptureBtn() {
    var btn = $('vs-capture-btn');
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('vs-btn-loading');
    btn.innerHTML = '<span class="vs-cam-icon">📷</span> Capturer';
  }

  // ═══════════════════════════════════════════
  //  MAPPING LABELS → TYPES PROJETS
  // ═══════════════════════════════════════════
  function mapToProjectTypes(predictions) {
    var types  = new Set();
    var fallback = [];

    predictions.forEach(function(pred) {
      var className = pred.className.toLowerCase();
      var found = false;

      // Recherche exacte ou partielle dans le dictionnaire
      Object.keys(LABEL_MAP).forEach(function(key) {
        if (!found && (className.indexOf(key) !== -1 || key.indexOf(className.split(',')[0].trim()) !== -1)) {
          types.add(LABEL_MAP[key]);
          found = true;
        }
      });

      // Fallback : premier mot du label anglais
      if (!found) {
        fallback.push(pred.className.split(',')[0].trim());
      }
    });

    // Toujours retourner au moins quelque chose
    var result = Array.from(types);
    if (result.length === 0) {
      result = fallback.slice(0, 2);
    }
    // Limiter à 3 mots-clés max
    return result.slice(0, 3);
  }

  // ═══════════════════════════════════════════
  //  APPEL API RECHERCHE
  // ═══════════════════════════════════════════
  async function searchProjects(keywords, rawPredictions) {
    try {
      var response = await fetch(CFG.apiEndpoint, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ keywords: keywords }),
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      var data = await response.json();
      hideStatus();
      renderResults(data.projets || [], keywords, rawPredictions);

    } catch (err) {
      console.error('[VisualSearch] Erreur API:', err);
      showStatus('Erreur de connexion. Vérifiez votre réseau.', 'error');
    }
  }

  // ═══════════════════════════════════════════
  //  RENDU DES RÉSULTATS
  // ═══════════════════════════════════════════
  function renderResults(projets, keywords, rawPredictions) {
    var section   = $('vs-results-section');
    var container = $('vs-results-list');
    var countEl   = $('vs-results-count');
    var labelsEl  = $('vs-detected-labels');

    if (!section || !container) return;
    section.style.display = 'block';

    // Afficher les labels détectés
    if (labelsEl && rawPredictions && rawPredictions.length) {
      labelsEl.innerHTML = rawPredictions
        .slice(0, 3)
        .map(function(p) {
          var pct = Math.round(p.probability * 100);
          return '<span class="vs-label-chip">' + escHtml(p.className.split(',')[0]) + ' <strong>' + pct + '%</strong></span>';
        })
        .join('');
    }

    if (countEl) {
      countEl.textContent = projets.length + ' projet(s) trouvé(s) pour "' + keywords.join(' · ') + '"';
    }

    if (projets.length === 0) {
      container.innerHTML = [
        '<div class="vs-empty">',
        '  <div class="vs-empty-icon">🔍</div>',
        '  <p class="vs-empty-title">Aucun projet correspondant</p>',
        '  <p class="vs-empty-sub">Essayez de photographier une autre partie du chantier,<br>ou utilisez la recherche textuelle.</p>',
        '  <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap;">',
        '    <button onclick="VisualSearch.resetCapture()" class="vs-btn-retry">📷 Nouvelle capture</button>',
        '    <a href="/portail-citoyen/projets" class="vs-btn-all">Voir tous les projets</a>',
        '  </div>',
        '</div>',
      ].join('');
      return;
    }

    container.innerHTML = projets.map(function(p) {
      var progress     = p.avancement_physique || 0;
      var progressColor = progress > 70 ? '#007A3D' : progress > 40 ? '#F59E0B' : '#CE1126';
      var hasPhoto     = Boolean(p.photo);
      var photoUrl = hasPhoto ? (String(p.photo).indexOf('http') === 0 ? p.photo : '/assets/uploads/' + p.photo) : null;
      var photoStyle   = hasPhoto
        ? 'background-image:url("' + escHtml(photoUrl) + '");background-size:cover;background-position:center;'
        : 'background:linear-gradient(135deg,#005C2E,#007A3D);';
      var statutLabel  = (p.statut || '').replace(/_/g, ' ');
      var statutClass  = 's-' + (p.statut || '').replace(/ /g, '_');

      return [
        '<a href="/portail-citoyen/projet/' + p.id + '" class="vs-card" target="_blank" rel="noopener">',
        '  <div class="vs-card-img" style="' + photoStyle + '">',
        '    ' + (!hasPhoto ? '<div class="vs-card-placeholder">🏗️</div>' : ''),
        '    <span class="vs-statut-badge ' + statutClass + '">' + escHtml(statutLabel) + '</span>',
        '  </div>',
        '  <div class="vs-card-body">',
        '    <div class="vs-card-type">' + escHtml(p.type_nom || 'Projet municipal') + '</div>',
        '    <div class="vs-card-title">' + escHtml(p.titre) + '</div>',
        '    <div class="vs-card-commune">📍 ' + escHtml(p.commune_nom || '') + '</div>',
        '    <div class="vs-progress-row">',
        '      <span class="vs-progress-lbl">Avancement</span>',
        '      <span class="vs-progress-val" style="color:' + progressColor + '">' + progress + '%</span>',
        '    </div>',
        '    <div class="vs-prog-bar">',
        '      <div class="vs-prog-fill" style="width:' + progress + '%;background:' + progressColor + '"></div>',
        '    </div>',
        '    <div class="vs-card-arrow">Voir les détails →</div>',
        '  </div>',
        '</a>',
      ].join('');
    }).join('');
  }

  // ═══════════════════════════════════════════
  //  CONTRÔLE DU MODAL
  // ═══════════════════════════════════════════
  async function openVisualSearch() {
    modalEl  = $('vs-modal');
    videoEl  = $('vs-video');
    canvasEl = $('vs-canvas');

    if (!modalEl) {
      console.error('[VisualSearch] Modal introuvable (#vs-modal). Vérifiez que le partial est inclus.');
      return;
    }

    // Reset UI
    $('vs-preview-section').style.display   = 'none';
    $('vs-results-section').style.display   = 'none';
    $('vs-permission-error').style.display  = 'none';
    $('vs-camera-section').style.display    = 'none';
    hideStatus();
    resetCaptureBtn();

    // Afficher le modal
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() {
      modalEl.classList.add('vs-modal-open');
    });

    // Démarrer caméra + charger modèle en parallèle
    try {
      await Promise.all([startCamera(), loadModel()]);
    } catch (err) {
      console.error('[VisualSearch] Init:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        $('vs-permission-error').style.display = 'block';
        $('vs-camera-section').style.display   = 'none';
      } else {
        showStatus('Erreur : ' + err.message, 'error');
      }
    }
  }

  function closeVisualSearch() {
    if (!modalEl) return;
    modalEl.classList.remove('vs-modal-open');
    setTimeout(function() {
      modalEl.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
    stopCamera();
    isAnalyzing = false;
  }

  function resetCapture() {
    $('vs-preview-section').style.display = 'none';
    $('vs-results-section').style.display = 'none';
    hideStatus();
    resetCaptureBtn();
  }

  // ═══════════════════════════════════════════
  //  ÉVÉNEMENTS & VISIBILITÉ PAGE
  // ═══════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', function() {
    // Fermer le modal sur clic du backdrop
    var m = $('vs-modal');
    if (m) {
      m.addEventListener('click', function(e) {
        if (e.target === m) closeVisualSearch();
      });
    }

    // Touche Échap
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeVisualSearch();
    });

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function(err) {
        console.warn('[SW] Enregistrement échoué:', err);
      });
    }
  });

  // Suspendre la caméra si l'onglet est caché
  document.addEventListener('visibilitychange', function() {
    if (!currentStream) return;
    currentStream.getTracks().forEach(function(t) {
      t.enabled = !document.hidden;
    });
  });

  // ═══════════════════════════════════════════
  //  API PUBLIQUE
  // ═══════════════════════════════════════════
  window.VisualSearch = {
    open         : openVisualSearch,
    close        : closeVisualSearch,
    capture      : captureAndAnalyze,
    resetCapture : resetCapture,
  };

})();
