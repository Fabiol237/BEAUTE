'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, UploadCloud, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN' | 'ORANGE'>('MTN');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  
  // App State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Settings from Supabase
  const [merchantMtn, setMerchantMtn] = useState('670000000'); // defaults
  const [merchantOrange, setMerchantOrange] = useState('690000000');

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0 && !isSuccess) {
      router.push('/shop');
    }

    // Fetch vendor settings (numbers)
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('mtn_number, orange_number').single();
        if (data) {
          if (data.mtn_number) setMerchantMtn(data.mtn_number);
          if (data.orange_number) setMerchantOrange(data.orange_number);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des paramètres', err);
      }
    };
    fetchSettings();
  }, [items, router, isSuccess]);

  const merchantNumber = paymentMethod === 'MTN' ? merchantMtn : merchantOrange;
  const ussdCode = paymentMethod === 'MTN' 
    ? `*126*14*${merchantNumber}*${totalAmount}*12345#` // Standard MTN Money Transfer code structure example
    : `*150*${merchantNumber}*${totalAmount}*0000#`;    // Standard Orange Money Transfer code structure example

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !paymentProof) {
      alert("Veuillez remplir tous les champs et fournir la capture d'écran du paiement.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload proof to Cloudinary via API route
      let proofUrl = '';
      const uploadFormData = new FormData();
      uploadFormData.append('file', paymentProof);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        proofUrl = uploadData.url;
      } else {
        throw new Error("Échec de l'upload de la capture d'écran.");
      }

      // 2. Create the Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_proof_url: proofUrl,
          status: 'en attente'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items
      if (orderData) {
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Success
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      alert("Une erreur est survenue lors de la validation. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`container ${styles.successContainer}`}>
        <CheckCircle size={80} className={styles.successIcon} />
        <h1 className={styles.title}>Commande Reçue !</h1>
        <p className={styles.successText}>
          Merci {customerName}. Votre commande d'un montant de {totalAmount} FCFA a bien été enregistrée.
          <br/>
          Elle est actuellement en attente de vérification de votre paiement ({paymentMethod}).
          Vous serez contacté(e) très prochainement pour la livraison.
        </p>
        <button onClick={() => router.push('/shop')} className="btn-premium backBtn">Retourner à la boutique</button>
      </div>
    );
  }

  // If items length is 0 but it's rendering before redirect
  if (items.length === 0) return null;

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.title}>Finaliser votre Sélection</h1>

      <div className={styles.layout}>
        {/* Left: Form & Payment Info */}
        <div className={styles.mainContent}>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Step 1: Customer Details */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Vos Informations</h2>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Nom complet <span className={styles.required}>*</span></label>
                  <input 
                    id="name"
                    type="text" 
                    required 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="Ex: Amina K."
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Numéro de téléphone <span className={styles.required}>*</span></label>
                  <input 
                    id="phone"
                    type="tel" 
                    required 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    placeholder="Ex: 6XXXXXXXX"
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Payment Method & USSD */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Paiement Mobile</h2>
              <p className={styles.helperText}>Choisissez votre opérateur pour effectuer le transfert vers notre compte marchand.</p>
              
              <div className={styles.methods}>
                <label className={`${styles.methodRadio} ${paymentMethod === 'MTN' ? styles.methodActive : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="MTN" 
                    checked={paymentMethod === 'MTN'}
                    onChange={() => setPaymentMethod('MTN')}
                  />
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>MTN Mobile Money</span>
                    <span className={styles.methodDesc}>Options Premium MoMo</span>
                  </div>
                </label>
                
                <label className={`${styles.methodRadio} ${paymentMethod === 'ORANGE' ? styles.methodActive : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="ORANGE" 
                    checked={paymentMethod === 'ORANGE'}
                    onChange={() => setPaymentMethod('ORANGE')}
                  />
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>Orange Money</span>
                    <span className={styles.methodDesc}>Options Premium OM</span>
                  </div>
                </label>
              </div>

              <div className={styles.ussdBox}>
                <h3 className={styles.ussdTitle}>Procédure de Règlement</h3>
                <p>1. Initiez la transaction en appelant le code ci-dessous depuis votre mobile :</p>
                <div className={styles.codeContainer}>
                  <code className={styles.ussdCode}>{ussdCode}</code>
                  <a href={`tel:${ussdCode.replace(/#/g, '%23')}`} className={`btn-premium ${styles.telBtn}`}>
                    Lancer l'appel
                  </a>
                </div>
                <p className={styles.ussdNotice}>Montant à régler : <strong>{totalAmount.toLocaleString()} FCFA</strong> vers <strong>{merchantNumber}</strong>.</p>
              </div>
            </section>

            {/* Step 3: Proof of Payment */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Preuve de Paiement</h2>
              <p className={styles.helperText}>Veuillez joindre la capture d'écran de confirmation pour accélérer le traitement.</p>
              
              <div className={styles.uploadBox}>
                <input 
                  type="file" 
                  id="proof"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  required
                />
                <label htmlFor="proof" className={styles.uploadLabel}>
                  <UploadCloud size={32} className={styles.uploadIcon} />
                  <span>
                    {paymentProof ? paymentProof.name : "Cliquez pour uploader le reçu"}
                  </span>
                </label>
              </div>
            </section>

            <button type="submit" className="btn-premium" style={{width: '100%', padding: '1.5rem'}} disabled={isSubmitting}>
              {isSubmitting ? 'Traitement de votre demande...' : 'Confirmer la Commande'}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className={styles.sidebar}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryHeader}>
              <ShoppingBag size={20} />
              <h3>Résumé ({items.length} produit{items.length > 1 ? 's' : ''})</h3>
            </div>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.product.id} className={styles.summaryItem}>
                  <span className={styles.sItemName}>{item.product.name} x{item.quantity}</span>
                  <span className={styles.sItemPrice}>{item.product.price * item.quantity} FCFA</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotal}>
              <span>Total à Payer</span>
              <span className={styles.totalValue}>{totalAmount} FCFA</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
