'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { Search } from 'lucide-react';
import styles from './page.module.css';

// Mock data (replace with Supabase data later)
const MOCK_PRODUCTS = [
  { id: '1', name: 'Sérum Éclat Infini', price: 35000, category: 'visage', image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80', is_popular: true },
  { id: '2', name: 'Crème de Nuit Régénérante', price: 42000, category: 'visage', image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80', is_new: true },
  { id: '3', name: 'Essence Botanique', price: 28000, category: 'corps', image_url: 'https://images.unsplash.com/photo-1571781926291-c477eb378b27?auto=format&fit=crop&q=80' },
  { id: '4', name: 'Huile Précieuse Cheveux', price: 30000, category: 'cheveux', image_url: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49ceb?auto=format&fit=crop&q=80', is_popular: true },
  { id: '5', name: 'Masque Argile Purifiant', price: 15000, category: 'visage', image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80' },
  { id: '6', name: 'Gommage Doux Exfoliant', price: 22000, category: 'corps', image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80' }
];

const CATEGORIES = [
  { id: 'all', label: 'Tout voir' },
  { id: 'visage', label: 'Soins Visage' },
  { id: 'corps', label: 'Soins Corps' },
  { id: 'cheveux', label: 'Cheveux' }
];

export default function Shop() {
  return (
    <React.Suspense fallback={
      <div className={`container ${styles.shopPage}`} style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Chargement de la boutique...</h2>
      </div>
    }>
      <ShopContent />
    </React.Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const defaultCategory = searchParams?.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');

  // Intelligent filtering
  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS;

    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    if (priceSort === 'asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [activeCategory, searchQuery, priceSort]);

  return (
    <div className={`container ${styles.shopPage}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notre Collection</h1>
        <p className={styles.subtitle}>Découvrez l&apos;excellence de nos soins cosmétiques.</p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Rechercher"
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Catégories</h3>
            <ul className={styles.filterList}>
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <button 
                    className={`${styles.filterBtn} ${activeCategory === cat.id ? styles.activeFilter : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Trier par</h3>
            <select 
              value={priceSort} 
              onChange={(e) => setPriceSort(e.target.value as any)}
              className={styles.select}
              aria-label="Trier par"
            >
              <option value="default">Pertinence</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <main className={styles.mainContent}>
          <div className={styles.resultsHeader}>
            <span>{filteredProducts.length} résultat{filteredProducts.length !== 1 ? 's' : ''}</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className={styles.noResults}>
              <p>Aucun produit ne correspond à votre recherche.</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
