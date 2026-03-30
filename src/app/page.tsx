import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

// Mock data based on the structure (we will fetch from Supabase later)
const POPULAR_PRODUCTS = [
  {
    id: '1',
    name: 'Sérum Éclat Infini',
    price: 35000,
    category: 'Soins Visage',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80',
    is_popular: true,
  },
  {
    id: '2',
    name: 'Crème de Nuit Régénérante',
    price: 42000,
    category: 'Soins Visage',
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80',
    is_new: true,
  },
  {
    id: '3',
    name: 'Essence Botanique',
    price: 28000,
    category: 'Soins Corporels',
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477eb378b27?auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Huile Précieuse Cheveux',
    price: 30000,
    category: 'Soins Cheveux',
    image_url: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49ceb?auto=format&fit=crop&q=80',
    is_popular: true,
  }
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageContainer}>
          <Image 
            src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80"
            alt="Femme appliquant une crème de beauté"
            fill
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroTextContainer}>
            <span className={styles.heroSubtitle}>Nouvelle Collection</span>
            <h1 className={styles.heroTitle}>L&apos;éclat naturel, <br />redéfini.</h1>
            <p className={styles.heroDesc}>
              Découvrez nos soins luxueux formulés avec des ingrédients purs pour révéler votre beauté unique et authentique.
            </p>
            <Link href="/shop" className={`btn btn-primary ${styles.heroBtn}`}>
              Découvrir la boutique
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>L&apos;Essentiel Beauté</h2>
          <p className={styles.sectionSubtitle}>Une routine adaptée à vos besoins</p>
        </div>
        
        <div className={styles.categoriesGrid}>
          <Link href="/shop?category=visage" className={styles.categoryCard}>
            <Image src="https://images.unsplash.com/photo-1615397323067-27bfe6624c9c?auto=format&fit=crop&q=80" alt="Soins Visage" fill className={styles.categoryImage} />
            <div className={styles.categoryOverlay}>
              <h3>Soins Visage</h3>
            </div>
          </Link>
          <Link href="/shop?category=corps" className={styles.categoryCard}>
            <Image src="https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&q=80" alt="Soins Corps" fill className={styles.categoryImage} />
            <div className={styles.categoryOverlay}>
              <h3>Soins Corps</h3>
            </div>
          </Link>
          <Link href="/shop?category=cheveux" className={styles.categoryCard}>
            <Image src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80" alt="Cheveux" fill className={styles.categoryImage} />
            <div className={styles.categoryOverlay}>
              <h3>Cheveux</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Popular Products */}
      <section className={styles.popularSection}>
        <div className={`container ${styles.section}`}>
          <div className={styles.sectionHeaderFlex}>
            <h2 className={styles.sectionTitle}>Coups de Cœur</h2>
            <Link href="/shop" className={styles.viewAllLink}>Voir tout</Link>
          </div>
          
          <div className={styles.productsGrid}>
            {POPULAR_PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ce qu&apos;elles en disent</h2>
        </div>
        
        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.quote}>&quot;Le Sérum Éclat a complètement transformé ma routine. Ma peau n&apos;a jamais été aussi lumineuse.&quot;</p>
            <p className={styles.author}>— Sophie L.</p>
          </div>
          <div className={styles.testimonialCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.quote}>&quot;Des produits d&apos;une qualité exceptionnelle. On sent la différence dès la première utilisation.&quot;</p>
            <p className={styles.author}>— Marie K.</p>
          </div>
          <div className={styles.testimonialCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.quote}>&quot;L&apos;expérience client est incroyable et l&apos;odeur de l&apos;Essence Botanique est divine.&quot;</p>
            <p className={styles.author}>— Amina D.</p>
          </div>
        </div>
      </section>
    </>
  );
}
