# Suivi des Projets Municipaux — Version Node.js

Application de suivi des projets municipaux (Communes Urbaines du Littoral), migrée depuis PHP vers **Node.js**, **Express** et **EJS**.

## Prérequis

- Node.js 18 ou supérieur
- MySQL avec la base `suivi_projets_municipaux` (schéma du projet PHP parent)
- Les assets statiques dans le dossier parent `../assets/`

## Installation

```bash
cd js-app
npm install
```

Copiez la configuration :

```bash
copy .env.example .env
```

Adaptez `.env` (MySQL, `SITE_URL`, `SESSION_SECRET`).

## Lancement

```bash
npm start
```

Mode développement (rechargement automatique) :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

- **Back-office** : `/login` — ex. `admin@commune-littoral.cm` / `admin123`
- **Portail citoyen** : `/portail-citoyen`

## Structure

| Dossier | Rôle |
|---------|------|
| `server.js` | Point d'entrée Express |
| `routes/` | Routes (auth, dashboard, projets, budget, utilisateurs, portail) |
| `views/` | Templates EJS |
| `middleware/` | Session, auth, flash, locals |
| `lib/` | Helpers, génération PDF (PDFKit) |
| `../assets/` | CSS, JS, images, uploads (servis via `/assets`) |

## Fonctionnalités

- Authentification (bcrypt, compatible mots de passe PHP `$2y$`)
- Dashboard avec graphiques Chart.js
- CRUD projets (phases, risques, KPIs, photos, rapports PDF)
- Budget et dépenses
- Carte Leaflet
- Gestion utilisateurs (admin)
- Portail citoyen public (projets, suggestions, signalements)

## Notes

- Les uploads sont enregistrés dans `../assets/uploads/` (config `uploadsDir`).
- Les rapports PDF utilisent PDFKit (`/projets/generer-rapport/:id?type=complet|financier|avancement`).
