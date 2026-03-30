'use client';

import React, { useState } from 'react';
import { Search, Grid, List, Filter } from 'lucide-react';
import styles from './page.module.css';

const SERVICES = [
  {
    id: 1,
    name: 'Soin Visage Premium',
    category: 'Soins Visage',
    price: 79,
    duration: '60 min',
    description: 'Nettoyage & hydratation en profondeur',
    image: '💆‍♀️'
  },
  {
    id: 2,
    name: 'Manucure Luxe',
    category: 'Ongles',
    price: 49,
    duration: '45 min',
    description: 'Vernis semi-permanent de qualité',
    image: '💅'
  },
  {
    id: 3,
    name: 'Pédicure Complète',
    category: 'Ongles',
    price: 59,
    duration: '50 min',
    description: 'Soin complet des pieds',
    image: '🦶'
  },
  {
    id: 4,
    name: 'Massage Relaxant',
    category: 'Massage',
    price: 89,
    duration: '60 min',
    description: 'Massage thérapeutique relaxant',
    image: '🧖‍♀️'
  },
  {
    id: 5,
    name: 'Coloration Hair',
    category: 'Cheveux',
    price: 69,
    duration: '90 min',
    description: 'Coloration professionnelle',
    image: '💇‍♀️'
  },
  {
    id: 6,
    name: 'Coupe & Styling',
    category: 'Cheveux',
    price: 55,
    duration: '45 min',
    description: 'Coupe tendance & mise en forme',
    image: '✂️'
  },
  {
    id: 7,
    name: 'Maquillage Bridal',
    category: 'Maquillage',
    price: 99,
    duration: '90 min',
    description: 'Maquillage professionnel événement',
    image: '✨'
  },
  {
    id: 8,
    name: 'Épilation Douce',
    category: 'Épilation',
    price: 45,
    duration: '30 min',
    description: 'Épilation sans douleur',
    image: '🌸'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Tous les Services' },
  { id: 'Soins Visage', label: 'Soins Visage' },
  { id: 'Ongles', label: 'Ongles' },
  { id: 'Massage', label: 'Massages' },
  { id: 'Cheveux', label: 'Cheveux' },
  { id: 'Maquillage', label: 'Maquillage' },
  { id: 'Épilation', label: 'Épilation' }
];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [gridView, setGridView] = useState(true);

  const filteredServices = SERVICES
    .filter(service => 
      (activeCategory === 'all' || service.category === activeCategory) &&
      (searchQuery === '' || service.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (priceSort === 'asc') return a.price - b.price;
      if (priceSort === 'desc') return b.price - a.price;
      return 0;
    });

  return (
    <main className={styles.shop}>
      {/* Header */}
      <section className={styles.shopHeader}>
        <div className="container">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 className={styles.title}>Nos Services</h1>
            <p className={styles.subtitle}>Découvrez notre gamme complète de services beauté luxueux</p>
          </div>
        </div>
      </section>

      <section className={styles.shopContent}>
        <div className="container">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Filters & Search */}
            <div className={styles.controls}>
              <div className={styles.searchBox}>
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher un service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.sortBox}>
                <select 
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value as any)}
                  className={styles.sortSelect}
                >
                  <option value="default">Trier par</option>
                  <option value="asc">Prix croissant</option>
                  <option value="desc">Prix décroissant</option>
                </select>
              </div>

              <div className={styles.viewToggle}>
                <button 
                  onClick={() => setGridView(true)}
                  className={gridView ? styles.viewActive : ''}
                  title="Grille"
                >
                  <Grid size={20} />
                </button>
                <button 
                  onClick={() => setGridView(false)}
                  className={!gridView ? styles.viewActive : ''}
                  title="Liste"
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className={styles.categories}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryActive : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className={gridView ? styles.servicesGrid : styles.servicesList}>
              {filteredServices.map(service => (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceImage}>{service.image}</div>
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceDesc}>{service.description}</p>
                    <div className={styles.serviceMeta}>
                      <span className={styles.duration}>⏱️ {service.duration}</span>
                      <span className={styles.price}>{service.price}€</span>
                    </div>
                    <button className={styles.serviceBtn}>
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className={styles.noResults}>
                <p>Aucun service ne correspond à vos critères de recherche.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
