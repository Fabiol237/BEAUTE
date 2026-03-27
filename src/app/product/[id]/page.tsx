'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Star, ShieldCheck, Truck, Bot, Send } from 'lucide-react';
import styles from './page.module.css';

// Mock data
const MOCK_PRODUCTS: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Sérum Éclat Infini',
    price: 35000,
    category: 'Soins Visage',
    skin_type: 'Tous types de peau',
    description: "Ce sérum ultra-concentré illumine le teint, réduit visiblement les taches et unifie la texture de la peau. Formulé avec de la Vitamine C pure et des extraits botaniques rares.",
    usage_tips: "Appliquer 3 à 4 gouttes chaque matin sur le visage et le cou parfaitement nettoyés avant votre crème de jour.",
    ingredients: "Aqua, Vitamine C (L-ascorbic acid), Hyaluronic Acid, Extrait de Rose de Damas, Glycérine.",
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80',
    stock_status: 'En stock'
  }
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = MOCK_PRODUCTS[params.id] || MOCK_PRODUCTS['1']; // fallback
  const { addToCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChat, setAiChat] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: `Bonjour ! Je suis l'assistant beauté dédié à ce produit. Que souhaitez-vous savoir sur le ${product.name} ?` }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || isAiLoading) return;

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
      setAiChat(prev => [...prev, { role: 'assistant', text: data.answer || "Désolé, je ne peux pas répondre pour le moment." }]);
    } catch (error) {
      setAiChat(prev => [...prev, { role: 'assistant', text: "Erreur de connexion à l'assistant." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`container ${styles.productPage}`}>
      <div className={styles.grid}>
        
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImageContainer}>
            <Image 
              src={product.image_url} 
              alt={product.name} 
              fill 
              className={styles.mainImage}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          <div className={styles.breadcrumbs}>Boutique / {product.category}</div>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.priceRow}>
            <span className={styles.price}>{product.price} FCFA</span>
            <span className={styles.status}>{product.stock_status}</span>
          </div>

          <div className={styles.actions}>
            <div className={styles.quantity}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <Button className={styles.addBtn} onClick={handleAddToCart} fullWidth>
              <ShoppingBag size={18} style={{marginRight: '8px'}} /> Ajouter au panier
            </Button>
          </div>

          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <ShieldCheck size={20} /> Paiement 100% sécurisé (USSD/Orange)
            </div>
            <div className={styles.benefit}>
              <Truck size={20} /> Livraison rapide et suivie
            </div>
          </div>

          {/* Accordion / Tabs */}
          <div className={styles.tabs}>
            <div className={styles.tabHeaders}>
              <button 
                className={activeTab === 'description' ? styles.activeTab : ''} 
                onClick={() => setActiveTab('description')}
              >Description</button>
              <button 
                className={activeTab === 'usage' ? styles.activeTab : ''} 
                onClick={() => setActiveTab('usage')}
              >Conseils</button>
              <button 
                className={activeTab === 'ingredients' ? styles.activeTab : ''} 
                onClick={() => setActiveTab('ingredients')}
              >Ingrédients</button>
            </div>
            <div className={styles.tabContent}>
              {activeTab === 'description' && <p>{product.description}</p>}
              {activeTab === 'usage' && <p>{product.usage_tips}</p>}
              {activeTab === 'ingredients' && <p>{product.ingredients}</p>}
            </div>
          </div>

          {/* AI Assistant Section */}
          <div className={styles.aiSection}>
            <div className={styles.aiHeader}>
              <Bot size={24} className={styles.aiIcon} />
              <h3>Assistant Beauté IA</h3>
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
                placeholder="Pose une question sur ce produit..." 
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className={styles.aiInput}
              />
              <button type="submit" disabled={isAiLoading || !aiQuestion.trim()} className={styles.aiSubmitBtn}>
                <Send size={18} />
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
