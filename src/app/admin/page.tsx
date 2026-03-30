'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Package, Settings, ShoppingBag, Eye, Check, Trash2, Plus, UploadCloud, X } from 'lucide-react';
import styles from './page.module.css';
import Image from 'next/image';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // Settings State
  const [mtnNumber, setMtnNumber] = useState('');
  const [orangeNumber, setOrangeNumber] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Soins Visage',
    description: '',
    ingredients: '',
    usage_tips: '',
    skin_type: 'Tous types de peau'
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('mtn_number, orange_number').single();
      if (data) {
        setMtnNumber(data.mtn_number || '');
        setOrangeNumber(data.orange_number || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await supabase.from('settings').update({
        mtn_number: mtnNumber,
        orange_number: orangeNumber
      }).eq('id', 1);
      alert("Paramètres mis à jour !");
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      alert("Veuillez sélectionner une image pour le produit.");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      // 1. Upload image to Cloudinary
      let imageUrl = '';
      const uploadFormData = new FormData();
      uploadFormData.append('file', productImage);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      } else {
        throw new Error("Échec de l'upload de l'image.");
      }

      // 2. Insert product into Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          price: parseFloat(newProduct.price),
          image_url: imageUrl // Assuming we add this column or use a separate table
        }])
        .select()
        .single();

      if (error) {
        console.error("Détails de l'erreur Supabase:", error);
        throw new Error(`Base de données: ${error.message}`);
      }

      alert("Produit ajouté avec succès !");
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        price: '',
        category: 'Soins Visage',
        description: '',
        ingredients: '',
        usage_tips: '',
        skin_type: 'Tous types de peau'
      });
      setProductImage(null);
      fetchProducts();
    } catch (err: any) {
      console.error("Erreur complète lors de l'ajout:", err);
      alert(err.message || "Une erreur est survenue lors de l'ajout du produit");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Espace Vendeur</h1>
        <p className={styles.subtitle}>Gérez vos commandes, catalogue et paramètres de paiement.</p>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag size={20} /> Commandes
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={20} /> Catalogue Produits
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} /> Paramètres de Paiement
            </button>
          </nav>
        </aside>

        <main className={styles.content}>
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Suivi des Commandes</h2>
              <p className={styles.cardDesc}>Validez les paiements après vérification manuelle des reçus.</p>
              
              {ordersLoading ? (
                <p className={styles.lightText}>Chargement des commandes...</p>
              ) : orders.length === 0 ? (
                <p className={styles.lightText}>Aucune commande pour le moment.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Preuve</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td className={styles.lightText}>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <strong>{order.customer_name}</strong><br/>
                            <span className={styles.lightText}>{order.customer_phone}</span>
                          </td>
                          <td style={{fontWeight: '600'}}>{order.total_amount.toLocaleString()} FCFA</td>
                          <td><span className={styles.badge}>{order.payment_method}</span></td>
                          <td>
                            {order.payment_proof_url ? (
                              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                                <Eye size={16} /> Voir Reçu
                              </a>
                            ) : (
                              <span className={styles.lightText}>Aucune</span>
                            )}
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[order.status.replace(/\s/g, '').toLowerCase()] || ''}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.status === 'en attente' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'validé')}
                                className={styles.validateBtn}
                              >
                                <Check size={18} /> Valider
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className={styles.card}>
              <div className={styles.cardHeaderFlex}>
                <div>
                  <h2 className={styles.cardTitle}>Catalogue Produits</h2>
                  <p className={styles.cardDesc}>Ajoutez ou supprimez des produits de votre boutique.</p>
                </div>
                {!isAddingProduct && (
                  <button onClick={() => setIsAddingProduct(true)} className="btn-premium" style={{padding: '0.8rem 1.5rem'}}>
                    <Plus size={18} style={{marginRight: '8px'}} /> Nouveau Produit
                  </button>
                )}
              </div>

              {isAddingProduct ? (
                <form onSubmit={handleAddProduct} className={styles.productForm}>
                  <div className={styles.formHeader}>
                    <h3>Ajouter un nouveau produit</h3>
                    <button type="button" onClick={() => setIsAddingProduct(false)} className={styles.closeForm}>
                      <X size={24} />
                    </button>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Nom du produit</label>
                      <input 
                        type="text" 
                        required 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Ex: Sérum Revitalisant"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Prix (FCFA)</label>
                      <input 
                        type="number" 
                        required 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="Ex: 25000"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Catégorie</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        <option>Soins Visage</option>
                        <option>Soins Corps</option>
                        <option>Cheveux</option>
                        <option>Maquillage</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Type de Peau</label>
                      <input 
                        type="text" 
                        value={newProduct.skin_type}
                        onChange={e => setNewProduct({...newProduct, skin_type: e.target.value})}
                        placeholder="Ex: Grasse, Sèche, Mixte"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Description courte</label>
                    <textarea 
                      rows={3}
                      required
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Décrivez les bénéfices du produit..."
                    />
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Ingrédients Clés</label>
                      <input 
                        type="text" 
                        value={newProduct.ingredients}
                        onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})}
                        placeholder="Ex: Vitamine C, Acide Hyaluronique"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Conseils d'utilisation</label>
                      <input 
                        type="text" 
                        value={newProduct.usage_tips}
                        onChange={e => setNewProduct({...newProduct, usage_tips: e.target.value})}
                        placeholder="Ex: Appliquer matin et soir"
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Image du produit</label>
                    <div className={styles.uploadArea}>
                      <input 
                        type="file" 
                        id="productImage" 
                        accept="image/*" 
                        onChange={e => e.target.files && setProductImage(e.target.files[0])}
                        style={{display: 'none'}}
                      />
                      <label htmlFor="productImage" className={styles.uploadBox}>
                        <UploadCloud size={32} color="var(--color-gold)" />
                        <span>{productImage ? productImage.name : "Cliquez pour uploader une photo"}</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" onClick={() => setIsAddingProduct(false)} style={{background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer'}}>Annuler</button>
                    <button type="submit" className="btn-premium" style={{padding: '0.8rem 2rem'}} disabled={isSubmittingProduct}>
                      {isSubmittingProduct ? 'Envoi en cours...' : 'Ajouter au catalogue'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.tableWrapper}>
                  {productsLoading ? (
                    <p className={styles.lightText}>Chargement du catalogue...</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Nom</th>
                          <th>Prix</th>
                          <th>Catégorie</th>
                          <th>Statut</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td>
                              <div className={styles.miniImg}>
                                <Image src={product.image_url || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80'} alt={product.name} fill />
                              </div>
                            </td>
                            <td><strong>{product.name}</strong></td>
                            <td style={{fontWeight: '600'}}>{product.price.toLocaleString()} FCFA</td>
                            <td>{product.category}</td>
                            <td><span className={styles.badge}>{product.stock_status || 'En stock'}</span></td>
                            <td>
                              <button onClick={() => handleDeleteProduct(product.id)} className={styles.deleteBtn}>
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Configuration des Paiements</h2>
              <p className={styles.cardDesc}>Ces numéros sont affichés aux clients lors de l'étape de paiement mobile.</p>
              
              <form onSubmit={handleUpdateSettings} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Numéro MTN Mobile Money</label>
                    <input 
                      type="tel" 
                      value={mtnNumber} 
                      onChange={e => setMtnNumber(e.target.value)} 
                      placeholder="67XXXXXXX"
                      required
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>Numéro Orange Money</label>
                    <input 
                      type="tel" 
                      value={orangeNumber} 
                      onChange={e => setOrangeNumber(e.target.value)} 
                      placeholder="69XXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div style={{marginTop: '2rem'}}>
                  <button type="submit" className="btn-premium" style={{padding: '1rem 2rem'}} disabled={settingsLoading}>
                    {settingsLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
