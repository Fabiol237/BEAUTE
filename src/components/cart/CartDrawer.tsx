'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import styles from './CartDrawer.module.css';

export const CartDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, items, removeFromCart, updateQuantity, totalAmount } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={closeDrawer} aria-hidden="true" />
      <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Votre panier">
        <div className={styles.header}>
          <h2 className={styles.title}>Votre Panier</h2>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Fermer le panier">
            <X size={24} />
          </button>
        </div>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={48} className={styles.emptyIcon} />
              <p>Votre panier est vide.</p>
              <button className={`btn btn-primary ${styles.continueBtn}`} onClick={closeDrawer}>
                Continuer les achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className={styles.item}>
                <div className={styles.imageContainer}>
                  <Image 
                    src={item.product.image_url} 
                    alt={item.product.name} 
                    fill 
                    className={styles.image}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemHeader}>
                    <h4 className={styles.itemName}>{item.product.name}</h4>
                    <button 
                      className={styles.removeBtn} 
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Supprimer l'article"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.itemFooter}>
                    <div className={styles.quantityControls}>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className={styles.itemPrice}>
                      {item.product.price * item.quantity} FCFA
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span>Sous-total</span>
              <span className={styles.totalAmount}>{totalAmount} FCFA</span>
            </div>
            <p className={styles.shippingInfo}>Taxes et frais de port calculés à la caisse.</p>
            <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`} onClick={closeDrawer}>
              Procéder au Paiement
            </Link>
          </div>
        )}
      </div>
    </>
  );
};
