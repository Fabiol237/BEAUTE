-- ============================================================
-- SCRIPT DE CONFIGURATION COMPLET - BEAUTÉ & COSMÉTIQUE
-- ============================================================
-- Ce script est cumulatif : il crée les tables si elles n'existent pas
-- et ajoute les colonnes manquantes si les tables existent déjà.
-- Exécutez ce script dans votre SQL Editor Supabase.

-- 1. TABLE DES PRODUITS
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mise à jour : Ajouter les colonnes manquantes si la table existe déjà
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_type TEXT DEFAULT 'Tous types de peau';
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_tips TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'En stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- 2. TABLE DES COMMANDES
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'MTN' ou 'ORANGE'
  payment_proof_url TEXT, -- URL de l'image Cloudinary
  status TEXT DEFAULT 'en attente', -- 'en attente', 'validé', 'annulé'
  items JSONB NOT NULL, -- Liste des produits commandés
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES PARAMÈTRES (Numéros de paiement)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  mtn_number TEXT NOT NULL DEFAULT '670000000',
  orange_number TEXT NOT NULL DEFAULT '690000000',
  brand_name TEXT DEFAULT 'Elegance',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insérer les paramètres par défaut si la table est vide
INSERT INTO settings (id, mtn_number, orange_number)
VALUES (1, '670000000', '690000000')
ON CONFLICT (id) DO NOTHING;

-- 4. CONFIGURATION DE LA SÉCURITÉ (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour les PRODUITS (Lecture publique, Modif Admin)
DROP POLICY IF EXISTS "Lecture publique produits" ON products;
CREATE POLICY "Lecture publique produits" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin tout sur produits" ON products;
CREATE POLICY "Admin tout sur produits" ON products FOR ALL USING (true);

-- Politiques pour les COMMANDES (Insertion publique pour les clients, Lecture/Modif pour Admin)
DROP POLICY IF EXISTS "Insertion publique commandes" ON orders;
CREATE POLICY "Insertion publique commandes" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Gestion admin commandes" ON orders;
CREATE POLICY "Gestion admin commandes" ON orders FOR ALL USING (true);

-- Politiques pour les PARAMÈTRES (Lecture publique, Modif Admin)
DROP POLICY IF EXISTS "Lecture publique settings" ON settings;
CREATE POLICY "Lecture publique settings" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modif admin settings" ON settings;
CREATE POLICY "Modif admin settings" ON settings FOR ALL USING (true);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
