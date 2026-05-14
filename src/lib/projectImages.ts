/**
 * Retourne une image Unsplash haute qualité selon le type ou le titre du projet.
 * Utilise des URL statiques sans clé API.
 */

const TYPE_IMAGES: Record<string, string> = {
  // Voirie / Routes
  'route': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=350&fit=crop',
  'voirie': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=350&fit=crop',
  'pavage': 'https://images.unsplash.com/photo-1621955510-a7e5e9c62a82?w=600&h=350&fit=crop',
  'bitumage': 'https://images.unsplash.com/photo-1621955510-a7e5e9c62a82?w=600&h=350&fit=crop',
  
  // Santé
  'santé': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=350&fit=crop',
  'hôpital': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=350&fit=crop',
  'centre de santé': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=350&fit=crop',
  'dispensaire': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=350&fit=crop',

  // Éducation
  'éducation': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=350&fit=crop',
  'école': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=350&fit=crop',
  'lycée': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=350&fit=crop',
  'université': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=350&fit=crop',

  // Eau
  'eau': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=350&fit=crop',
  'forage': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&h=350&fit=crop',
  'assainissement': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&h=350&fit=crop',
  'eau et énergie': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=350&fit=crop',

  // Énergie / Électricité
  'énergie': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=350&fit=crop',
  'électricité': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=350&fit=crop',
  'solaire': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=350&fit=crop',

  // Infrastructure / Bâtiment
  'infrastructure': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop',
  'construction': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop',
  'bâtiment': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=350&fit=crop',

  // Marché / Commerce
  'marché': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=350&fit=crop',
  'commerce': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=350&fit=crop',

  // Environnement
  'environnement': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=350&fit=crop',
  'verdissement': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=350&fit=crop',

  // Sport
  'sport': 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&h=350&fit=crop',
  'stade': 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&h=350&fit=crop',
}

// Image de fallback générique — chantier africain
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop'

export function getProjectImage(typeNom?: string, titre?: string): string {
  const search = [typeNom, titre].filter(Boolean).join(' ').toLowerCase()
  
  for (const [keyword, url] of Object.entries(TYPE_IMAGES)) {
    if (search.includes(keyword)) {
      return url
    }
  }
  
  return DEFAULT_IMAGE
}
