# Portfolio professionnel - base de projet

Ce dépôt contient une structure claire et simple pour un portfolio avec **Node.js + HTML + CSS + Sass** et base de données.

## Objectif
Construire un portfolio professionnel administrable, propre et facile à expliquer à l'oral.

## Stack retenue
- Backend : Node.js + Express
- Frontend : HTML + CSS + Sass + JavaScript
- BDD : PostgreSQL
- Auth admin : JWT + mot de passe hashé (bcrypt)

## Arborescence
- [app](app) : dossier principal à utiliser
- [docs](docs) : diagrammes UML/Merise + planning
- [database](database) : exports SQL et sauvegardes
- [archive](archive) : ancienne structure conservée

## Lancer le projet
1. Créer la base PostgreSQL `portfolio_v2`.
2. Copier [app/server/.env.example](app/server/.env.example) vers `.env` dans [app/server](app/server) et remplacer `JWT_SECRET` par une chaîne aléatoire d'au moins 32 caractères (le serveur refuse de démarrer sans elle).
3. Installer les dépendances dans [app/server](app/server) : `npm install`.
4. Démarrer l'application : `npm run dev`.

Le serveur initialise automatiquement les tables au démarrage.

## Accès admin (développement)
- URL : `/admin.html`
- Email : variable `ADMIN_EMAIL`
- Mot de passe : variable `ADMIN_PASSWORD`

## Formulaire de contact
Le formulaire enregistre le message en base et ouvre un nouveau message Gmail prérempli vers l'adresse de contact, configurée dans [contact.js](app/public/js/contact.js).

## Important (consigne noms de fichiers)
Les livrables demandés utilisent le préfixe **wael_bakkay**.

## Échéance diagrammes
Date cible annoncée : **03/11/2026**.
Le planning détaillé est dans [docs/planning/wael_bakkay_roadmap_portfolio.md](docs/planning/wael_bakkay_roadmap_portfolio.md).
