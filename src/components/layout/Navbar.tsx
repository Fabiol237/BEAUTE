'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const { openDrawer, itemCount } = useCart();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        <div className={styles.menuLeft}>
          <Link href="/shop" className={styles.link}>Boutique</Link>
          <Link href="/about" className={styles.link}>À propos</Link>
        </div>
        
        <Link href="/" className={styles.logo}>
          E L E G A N C E
        </Link>
        
        <div className={styles.menuRight}>
          <button className={styles.iconBtn} aria-label="Recherche">
            <Search size={20} />
          </button>
          <Link href="/admin" className={styles.iconBtn} aria-label="Compte">
            <User size={20} />
          </Link>
          <button className={styles.iconBtn} onClick={openDrawer} aria-label="Panier">
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className={styles.cartCount}>{itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
