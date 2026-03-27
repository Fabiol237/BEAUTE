import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductCard.module.css';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
  is_new?: boolean;
  is_popular?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link href={`/product/${product.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <Image 
          src={product.image_url} 
          alt={product.name} 
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.is_new && <span className={styles.badgeNew}>Nouveau</span>}
        {product.is_popular && <span className={styles.badgePopular}>Populaire</span>}
        <div className={styles.overlay}>
          <span className={styles.viewText}>Découvrir</span>
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.name}>{product.name}</h3>
        <span className={styles.price}>{product.price} FCFA</span>
      </div>
    </Link>
  );
};
