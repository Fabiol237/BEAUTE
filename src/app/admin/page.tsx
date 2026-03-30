'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Package, Settings, ShoppingBag, Eye, Check } from 'lucide-react';
import styles from './page.module.css';
import Image from 'next/image';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  
  // Settings State
  const [mtnNumber, setMtnNumber] = useState('');
  const [orangeNumber, setOrangeNumber] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchSettings();
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
      // In a real app we need an existing ID or match a default row
      await supabase.from('settings').update({
        mtn_number: mtnNumber,
        orange_number: orangeNumber
      }).eq('id', 1); // assuming single settings row with id 1
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

  return (
    <div className={`container ${styles.adminPage}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Espace Vendeur</h1>
        <p className={styles.subtitle}>Gérez vos commandes, reçus USSD et paramètres.</p>
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
              <Package size={20} /> Produits (Catalogue)
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} /> Configuration Paiement
            </button>
          </nav>
        </aside>

        <main className={styles.content}>
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Vérification des Commandes</h2>
              <p className={styles.cardDesc}>Consultez les captures d'écran des paiements pour valider les envois.</p>
              
              {ordersLoading ? (
                <p>Chargement des commandes...</p>
              ) : orders.length === 0 ? (
                <p>Aucune commande pour le moment.</p>
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
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <strong>{order.customer_name}</strong><br/>
                            <span className={styles.lightText}>{order.customer_phone}</span>
                          </td>
                          <td>{order.total_amount} FCFA</td>
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
                            <span className={`${styles.statusBadge} ${styles[order.status.replace(' ', '')] || ''}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.status === 'en attente' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'validé')}
                                className={styles.validateBtn}
                                title="Valider le paiement"
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

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Configuration des Numéros de Paiement</h2>
              <p className={styles.cardDesc}>Ces numéros seront utilisés pour générer les codes USSD sur la page de paiement.</p>
              
              <form onSubmit={handleUpdateSettings} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>Numéro MTN Mobile Money</label>
                  <input 
                    type="tel" 
                    value={mtnNumber} 
                    onChange={e => setMtnNumber(e.target.value)} 
                    placeholder="Ex: 670000000"
                    required
                  />
                  <small>Ce numéro recevra les paiements par MTN.</small>
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Numéro Orange Money</label>
                  <input 
                    type="tel" 
                    value={orangeNumber} 
                    onChange={e => setOrangeNumber(e.target.value)} 
                    placeholder="Ex: 690000000"
                    required
                  />
                  <small>Ce numéro recevra les paiements par Orange.</small>
                </div>

                <Button type="submit" disabled={settingsLoading}>
                  {settingsLoading ? 'Enregistrement...' : 'Enregistrer Les Numéros'}
                </Button>
              </form>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Catalogue des Produits</h2>
              <p className={styles.cardDesc}>Interface de gestion des produits (Ajout/Modification). Pour la démo, le catalogue est géré via Supabase direct.</p>
              
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyIcon} />
                <p>Gestion CRUD complète à relier avec l'API Supabase.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
