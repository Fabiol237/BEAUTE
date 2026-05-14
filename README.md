# 🏛️ Système de Suivi des Projets Municipaux

Projet de fin d'année - Génie Informatique
Communes Urbaines du Littoral - Cameroun

## 📋 Description

Application web de gestion et suivi des projets municipaux permettant de :
- Gérer les projets (création, modification, suivi)
- Suivre l'avancement et les budgets
- Consulter les statistiques
- Portail citoyen pour la transparence

## 🚀 Installation

### Prérequis
- XAMPP (Apache + PHP 8.0+ + MySQL)
- Navigateur web moderne (Chrome, Firefox, Edge)

### Étapes d'installation

1. **Télécharger et installer XAMPP**
   - Télécharger sur : https://www.apachefriends.org/
   - Installer et lancer XAMPP Control Panel
   - Démarrer Apache et MySQL

2. **Copier les fichiers du projet**
   ```
   Copier le dossier "projet-municipal" dans :
   C:\xampp\htdocs\
   ```

3. **Créer la base de données**
   - Ouvrir http://localhost/phpmyadmin
   - Cliquer sur "Nouveau"
   - Cliquer sur l'onglet "SQL"
   - Copier TOUT le contenu du fichier `creation_bdd.sql`
   - Coller et cliquer "Exécuter"
   - ✅ La base de données est créée avec toutes les tables et données de test

4. **Accéder à l'application**
   - Ouvrir votre navigateur
   - Aller sur : http://localhost/projet-municipal/
   - Vous serez redirigé vers la page de connexion

## 🔐 Connexion

**Compte administrateur de test :**
- Email : `admin@commune-littoral.cm`
- Mot de passe : `admin123`

⚠️ **Important** : Changez ce mot de passe en production !

## 📁 Structure du projet

```
projet-municipal/
├── index.php                 # Page d'accueil (redirige vers login)
├── login.php                 # Page de connexion
├── logout.php                # Déconnexion
├── dashboard.php             # Tableau de bord
│
├── includes/                 # Fichiers communs
│   ├── config.php           # Configuration BDD
│   ├── functions.php        # Fonctions utiles
│   ├── header.php           # En-tête HTML
│   ├── navbar.php           # Menu navigation
│   └── footer.php           # Pied de page
│
├── assets/                   # Ressources statiques
│   ├── css/
│   │   └── style.css        # Styles personnalisés
│   ├── js/
│   │   └── main.js          # JavaScript principal
│   ├── images/              # Images
│   └── uploads/             # Fichiers uploadés
│
├── projets/                  # Module Projets
│   ├── liste.php            # Liste des projets
│   ├── creer.php            # Créer un projet
│   ├── details.php          # Détails d'un projet
│   └── modifier.php         # Modifier un projet
│
├── budget/                   # Module Budget
│   ├── liste.php            # Gestion budgets
│   └── depenses.php         # Enregistrer dépenses
│
├── portail-citoyen/         # Portail public
│   └── index.php            # Page publique
│
└── api/                      # API (AJAX)
    ├── get_projets.php      # Récupérer projets
    └── ...
```

## 🎨 Technologies utilisées

**Frontend :**
- HTML5
- CSS3
- JavaScript (vanilla)
- Bootstrap 5.3 (framework CSS)
- Bootstrap Icons

**Backend :**
- PHP 8.0+
- MySQL 8.0+

**Outils :**
- XAMPP (Apache + PHP + MySQL)
- VS Code (éditeur recommandé)

## 📊 Fonctionnalités actuelles

✅ **Authentification**
- Connexion sécurisée
- Gestion de session
- Déconnexion

✅ **Dashboard**
- Statistiques globales
- Derniers projets
- Alertes (projets en retard)

✅ **Gestion des projets**
- Liste avec filtres
- Création de projet
- Détails d'un projet
- Modification

✅ **Design responsive**
- Adapté mobile, tablette, desktop
- Interface moderne et professionnelle

## 🔧 Configuration

### Modifier les paramètres de connexion BDD

Éditer le fichier `includes/config.php` :

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Vide par défaut
define('DB_NAME', 'suivi_projets_municipaux');
```

### Modifier l'URL du site

Dans `includes/config.php` :

```php
define('SITE_URL', 'http://localhost/projet-municipal');
```

## 🐛 Résolution de problèmes

**Erreur de connexion à la base de données**
- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez les paramètres dans `includes/config.php`
- Assurez-vous que la base de données existe

**Page blanche**
- Activez l'affichage des erreurs PHP
- Vérifiez les logs Apache dans `C:\xampp\apache\logs\error.log`

**CSS ne se charge pas**
- Vérifiez que l'URL du site dans `config.php` est correcte
- Videz le cache du navigateur (Ctrl + F5)

## 📚 Prochaines étapes de développement

### Phase 1 (À faire) :
- ✅ Système de connexion
- ✅ Dashboard avec stats
- ✅ Liste et filtres projets
- ⏳ Formulaire création projet
- ⏳ Détails projet complet
- ⏳ Modification projet

### Phase 2 :
- Gestion budgétaire complète
- Upload de photos
- Mise à jour avancement
- Système d'alertes

### Phase 3 :
- Carte interactive (Leaflet.js)
- Portail citoyen
- Génération de rapports PDF
- Graphiques (Chart.js)

## 👥 Équipe

Groupe 10 - Génie Informatique
Projet de fin d'année 2024-2025

## 📞 Support

En cas de problème :
1. Consultez ce README
2. Vérifiez les logs d'erreur
3. Demandez de l'aide à votre équipe
4. Cherchez sur Stack Overflow

## 📄 Licence

Projet académique - Usage éducatif uniquement

---

**Bonne chance ! Vous allez réussir ! 💪🎓**
