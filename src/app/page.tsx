'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  const services = [
    {
      icon: '💆',
      title: 'Soins Visage Premium',
      description: 'Nettoyage profond, hydratation intensive et rajeunissement avec produits haut de gamme',
    },
    {
      icon: '💅',
      title: 'Manucure & Pédicure',
      description: 'Soins luxueux des ongles avec vernis semi-permanents et design personnalisé',
    },
    {
      icon: '✨',
      title: 'Massage Thérapeutique',
      description: 'Massages relaxants et régénérants pour détente complète et bien-être',
    },
    {
      icon: '💇',
      title: 'Coupe & Coloration',
      description: 'Transformation capillaire par nos stylistes experts avec techniques modernes',
    },
    {
      icon: '🌸',
      title: 'Épilation Professionnelle',
      description: 'Épilation douce et indolore avec les techniques les plus efficaces',
    },
    {
      icon: '👑',
      title: 'Maquillage Professionnel',
      description: 'Maquillage expert pour vos événements spéciaux et occasions importantes',
    },
  ];

  const features = [
    {
      icon: '⏱️',
      title: 'Rapide & Efficace',
      description: 'Services adaptés à votre emploi du temps sans compromis sur la qualité',
    },
    {
      icon: '🎯',
      title: 'Résultats Garantis',
      description: 'Transformations visibles avec suivi personnalisé et conseils experts',
    },
    {
      icon: '🏥',
      title: 'Hygiène Premium',
      description: 'Protocoles sanitaires stricts et produits certifiés de haute qualité',
    },
    {
      icon: '👥',
      title: 'Équipe Experte',
      description: 'Professionnels qualifiés, attentifs et passionnés par votre beauté',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Michel',
      title: 'Directrice Marketing',
      text: 'Un véritable havre de paix ! Les soins visage ont complètement transformé ma peau.',
      stars: 5,
    },
    {
      name: 'Julie Dupont',
      title: 'Influenceuse Beauté',
      text: 'Le maquillage pour mon mariage était parfait. Je recommande vivement ce salon !',
      stars: 5,
    },
    {
      name: 'Anne Leclerc',
      title: 'Avocate',
      text: 'L\'équipe est accueillante et professionnelle. J\'y reviens chaque mois !',
      stars: 5,
    },
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroSubtitle}>Bienvenue chez Beauté Luxe</span>
            <h1 className={styles.heroTitle}>Révélez Votre Beauté Naturelle</h1>
            <p className={styles.heroDescription}>
              Découvrez nos services de beauté luxe dans un environnement calme et raffiné. 
              Nos expertes vous accordent une attention personnalisée pour révéler votre meilleur vous-même.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/shop" className="btn btnPrimary btnLarge">
                Découvrir nos Services
              </Link>
              <button className="btn btnSecondary btnLarge" onClick={() => alert('Réservation bientôt disponible')}>
                Réserver une Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Nos Services Premium</h2>
            <p className={styles.sectionDescription}>
              Une gamme complète de soins beauté professionnels pour transformer votre apparence
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div
                key={index}
                className={styles.serviceCard}
                onMouseEnter={() => setHoveredService(index)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <span className={styles.serviceIcon}>{service.icon}</span>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceText}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pourquoi Nous Choisir ?</h2>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.feature}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <div className={styles.featureContent}>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Avis de nos Clients</h2>
            <p className={styles.sectionDescription}>
              Ce que nos clients satisfaits pensent de nos services
            </p>
          </div>

          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.stars}>
                  {'⭐'.repeat(testimonial.stars)}
                </div>
                <p className={styles.testimonialText}>"{testimonial.text}"</p>
                <p className={styles.testimonialAuthor}>{testimonial.name}</p>
                <p className={styles.testimonialTitle}>{testimonial.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Prête pour une Transformation ?</h2>
          <p className={styles.ctaDescription}>
            Rejoignez des milliers de clients satisfaits et découvrez le pouvoir de nos soins beauté d'exception
          </p>
          <Link href="/shop" className="btn btnPrimary btnLarge">
            Réserver Votre Consultation Gratuite
          </Link>
        </div>
      </section>
    </main>
  );
}
