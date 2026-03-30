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
          <h2 className={styles.title}>Votre Sélection</h2>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Fermer le panier">
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={64} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyText}>Votre sélection est actuellement vide.</p>
              <button className="btn-premium" onClick={closeDrawer}>
                Découvrir la Collection
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className={styles.item}>
                <div className={styles.imageContainer}>
                  <Image 
                    src={item.product.image_url || '/serum-luxury.png'} 
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
                    >
                      Enlever
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
                      {item.product.price.toLocaleString()} FCFA
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
              <span>Total estimations</span>
              <span className={styles.totalAmount}>{totalAmount.toLocaleString()} FCFA</span>
            </div>
            <p className={styles.shippingInfo}>Livraison Premium calculée lors de la finalisation.</p>
            <Link href="/checkout" className="btn-premium checkoutBtn" onClick={closeDrawer}>
              Finaliser la Commande
            </Link>
          </div>
        )}
      </div>
    </>
  );
};
