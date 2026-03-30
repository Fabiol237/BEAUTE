'use client';

import React, { useState, use, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { ShoppingBag, ShieldCheck, Truck, Bot, Send, Loader2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductContent id={id} />;
}

function ProductContent({ id }: { id: string }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChat, setAiChat] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          setProduct(data);
          setAiChat([
            { role: 'assistant', text: `Bienvenue dans notre conciergerie. Je suis votre conseiller personnel. Comment puis-je vous aider avec le ${data.name} aujourd'hui ?` }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || isAiLoading || !product) return;

    const userMsg = aiQuestion.trim();
    setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiQuestion('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          productContext: product
        })
      });

      const data = await response.json();
      setAiChat(prev => [...prev, { role: 'assistant', text: data.answer || "Nos concierges sont momentanément indisponibles." }]);
    } catch (error) {
      setAiChat(prev => [...prev, { role: 'assistant', text: "Erreur de connexion à la conciergerie." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`container ${styles.loadingContainer}`}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Préparation de votre expérience...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`container ${styles.errorContainer}`}>
        <h2>Produit introuvable</h2>
        <p>Ce trésor n&apos;est plus disponible dans notre collection.</p>
        <button className="btn-premium" onClick={() => window.location.href = '/shop'}>
          Retour à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className={styles.productPage}>
      <div className="container">
        <div className={styles.grid}>
          
          {/* Gallery */}
          <div className={`${styles.gallery} reveal`}>
            <div className={styles.mainImageContainer}>
              <Image 
                src={product.image_url || '/serum-luxury.png'} 
                alt={product.name} 
                fill 
                className={styles.mainImage}
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className={`${styles.info} reveal reveal-delay-1`}>
            <div className={styles.breadcrumbs}>Collection / {product.category}</div>
            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.priceRow}>
              <span className={styles.price}>{product.price.toLocaleString()} FCFA</span>
              <span className={styles.status}>Disponibilité Immédiate</span>
            </div>

            <div className={styles.actions}>
              <div className={styles.quantity}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>—</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className={`btn-premium ${styles.addBtn}`} onClick={handleAddToCart}>
                <ShoppingBag size={20} style={{marginRight: '12px'}} /> Ajouter au panier
              </button>
            </div>

            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <ShieldCheck size={20} className={styles.icon} /> 
                <span>Transaction de haute sécurité (Mobile Money)</span>
              </div>
              <div className={styles.benefit}>
                <Truck size={20} className={styles.icon} /> 
                <span>Livraison Premium sous 24/48h</span>
              </div>
            </div>

            {/* Product Details Tabs */}
            <div className={styles.tabs}>
              <div className={styles.tabHeaders}>
                <button 
                  className={activeTab === 'description' ? styles.activeTab : ''} 
                  onClick={() => setActiveTab('description')}
                >Révélation</button>
                <button 
                  className={activeTab === 'usage' ? styles.activeTab : ''} 
                  onClick={() => setActiveTab('usage')}
                >Rituel</button>
                <button 
                  className={activeTab === 'ingredients' ? styles.activeTab : ''} 
                  onClick={() => setActiveTab('ingredients')}
                >Essence</button>
              </div>
              <div className={styles.tabContent}>
                {activeTab === 'description' && <p>{product.description}</p>}
                {activeTab === 'usage' && <p>{product.usage_tips || "Appliquer selon votre rituel personnel."}</p>}
                {activeTab === 'ingredients' && <p>{product.ingredients || "Ingrédients précieux sélectionnés avec soin."}</p>}
              </div>
            </div>

            {/* AI Concierge Service */}
            <div className={`${styles.aiSection} reveal reveal-delay-2`}>
              <div className={styles.aiHeader}>
                <Bot size={28} className={styles.aiIcon} />
                <h3>Conciergerie Elegance</h3>
              </div>
              
              <div className={styles.chatBox}>
                {aiChat.map((msg, i) => (
                  <div key={i} className={`${styles.chatBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                    {msg.text}
                  </div>
                ))}
                {isAiLoading && <div className={`${styles.chatBubble} ${styles.bubbleAi}`}>...</div>}
              </div>

              <form onSubmit={handleAiSubmit} className={styles.aiForm}>
                <input 
                  type="text" 
                  placeholder="Posez votre question à notre expert..." 
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className={styles.aiInput}
                />
                <button type="submit" disabled={isAiLoading || !aiQuestion.trim()} className={styles.aiSubmitBtn}>
                  <Send size={20} />
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
