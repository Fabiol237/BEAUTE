'use client';

import Link from 'next/link';
import styles from './Footer.module.css';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Section 1: About */}
        <div className={styles.section}>
          <h3 className={styles.title}>BEAUTÉ LUXE</h3>
          <p className={styles.description}>
            Votre destination premium pour les soins et produits de beauté haut de gamme.
            Qualité exceptionnelle, service incomparable.
          </p>
          <div className={styles.socials}>
            <a href="#" aria-label="Facebook" className={styles.socialLink} title="Facebook">
              f
            </a>
            <a href="#" aria-label="Instagram" className={styles.socialLink} title="Instagram">
              📷
            </a>
            <a href="#" aria-label="Twitter" className={styles.socialLink} title="Twitter">
              𝕏
            </a>
          </div>
        </div>

        {/* Section 2: Navigation */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Navigation</h4>
          <ul className={styles.links}>
            <li><Link href="/">Accueil</Link></li>
            <li><Link href="/shop">Boutique</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/about">À Propos</Link></li>
            <li><Link href="/blog">Blog</Link></li>
          </ul>
        </div>

        {/* Section 3: Support */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Support</h4>
          <ul className={styles.links}>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/shipping">Livraison</Link></li>
            <li><Link href="/returns">Retours</Link></li>
            <li><Link href="/careers">Carrières</Link></li>
          </ul>
        </div>

        {/* Section 4: Contact */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Contact</h4>
          <div className={styles.contactItem}>
            <Phone size={18} />
            <span>+33 1 23 45 67 89</span>
          </div>
          <div className={styles.contactItem}>
            <Mail size={18} />
            <span>contact@beauteluxe.fr</span>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={18} />
            <span>Paris, France</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <p>&copy; {currentYear} Beauté Luxe. Tous droits réservés.</p>
        <div className={styles.legal}>
          <Link href="/privacy">Politique de Confidentialité</Link>
          <Link href="/terms">Conditions d'Utilisation</Link>
        </div>
      </div>
    </footer>
  );
}
