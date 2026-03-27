import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.column}>
          <h4 className={styles.logo}>E L E G A N C E</h4>
          <p className={styles.desc}>
            L&apos;éclat naturel, redéfini. Nous créons des expériences cosmétiques pures et luxueuses.
          </p>
        </div>
        
        <div className={styles.column}>
          <h5 className={styles.title}>Boutique</h5>
          <Link href="/shop?category=visage" className={styles.link}>Soins Visage</Link>
          <Link href="/shop?category=maquillage" className={styles.link}>Maquillage</Link>
          <Link href="/shop?category=cheveux" className={styles.link}>Cheveux</Link>
        </div>

        <div className={styles.column}>
          <h5 className={styles.title}>Légal</h5>
          <Link href="/terms" className={styles.link}>Conditions Générales</Link>
          <Link href="/privacy" className={styles.link}>Confidentialité</Link>
          <Link href="/shipping" className={styles.link}>Livraisons & Retours</Link>
        </div>

        <div className={styles.column}>
          <h5 className={styles.title}>Newsletter</h5>
          <p className={styles.desc}>Inscrivez-vous pour des offres exclusives.</p>
          <form className={styles.formContainer} aria-label="Abonnement">
            <input 
              type="email" 
              placeholder="Votre adresse email" 
              className={styles.input}
              required 
            />
            <button type="submit" className={styles.btn}>S&apos;inscrire</button>
          </form>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Elegance. Tous droits réservés.</p>
      </div>
    </footer>
  );
};
