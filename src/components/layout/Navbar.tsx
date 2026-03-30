'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>✨</div>
          <span className={styles.logoText}>BEAUTÉ LUXE</span>
        </Link>

        {/* Menu Desktop */}
        <div className={styles.desktopMenu}>
          <Link href="/" className={styles.navLink}>Accueil</Link>
          <Link href="/shop" className={styles.navLink}>Boutique</Link>
          <Link href="/services" className={styles.navLink}>Services</Link>
          <Link href="/about" className={styles.navLink}>À Propos</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.searchBtn} onClick={toggleSearch} aria-label="Recherche">
            <Search size={20} />
          </button>
          <Link href="/checkout" className={styles.cartBtn} aria-label="Panier">
            <ShoppingBag size={20} />
            <span className={styles.cartBadge}>0</span>
          </Link>
          <button className={styles.menuBtn} onClick={toggleMenu} aria-label="Menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Rechercher des produits..." 
            className={styles.searchInput}
            autoFocus
          />
        </div>
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" onClick={() => setIsOpen(false)}>Accueil</Link>
          <Link href="/shop" onClick={() => setIsOpen(false)}>Boutique</Link>
          <Link href="/services" onClick={() => setIsOpen(false)}>Services</Link>
          <Link href="/about" onClick={() => setIsOpen(false)}>À Propos</Link>
          <Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link>
          <Link href="/checkout" className={styles.mobileCartLink} onClick={() => setIsOpen(false)}>
            Mon Panier
          </Link>
        </div>
      )}
    </nav>
  );
}
