/**
 * sw.js — Service Worker MuniPro
 * Cache offline pour TF.js + MobileNet (modèle IA recherche visuelle)
 */

var CACHE_NAME  = 'munipro-vs-v1';
var MODEL_CACHE = 'munipro-model-v1';

// Assets JS du projet à pré-cacher
var STATIC_ASSETS = [
  '/assets/js/visual-search.js',
];

// Domaines dont les réponses doivent être mises en cache (modèle TF.js)
var CACHE_DOMAINS = [
  'cdn.jsdelivr.net',
  'storage.googleapis.com',
  'www.kaggle.com',
  'tfhub.dev',
];

// ── Installation ──────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activation ────────────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME && k !== MODEL_CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Interception des requêtes ─────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Stratégie CacheFirst pour les fichiers du modèle TF.js (CDN + Google Storage)
  var isCacheableModel = CACHE_DOMAINS.some(function(domain) {
    return url.hostname === domain || url.hostname.endsWith('.' + domain);
  });

  if (isCacheableModel) {
    event.respondWith(cacheFirst(event.request, MODEL_CACHE));
    return;
  }

  // Stratégie CacheFirst pour nos assets statiques
  if (
    url.pathname.startsWith('/assets/js/') ||
    url.pathname.startsWith('/assets/css/')
  ) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Tout le reste : NetworkFirst (pages dynamiques, API)
  // On laisse passer sans interception
});

// ── Helpers de stratégie ──────────────────────────────────────────
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;

      return fetch(request).then(function(response) {
        // Ne mettre en cache que les réponses valides (status 200, type basic/cors)
        if (
          response &&
          response.status === 200 &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        // Offline + pas de cache : retourner une réponse vide
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    });
  });
}
