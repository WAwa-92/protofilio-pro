# App (Node.js + HTML + CSS + Sass)

Ce dossier contient toute l'application.

## Structure minimale
- `server/` : backend Node.js
- `public/` : pages HTML + CSS + JS + Sass

## Où travailler
- Modifier les pages : `public/*.html`
- Modifier le style : `public/sass/main.scss` puis compiler vers `public/css/main.css`
- Modifier l'API : `server/src/server.js`

## Pages livrées
- `index.html` : profil + compétences + projets en avant
- `projects.html` : liste des projets/expériences
- `contact.html` : formulaire de contact connecté à la BDD
- `admin.html` : authentification + CRUD profil/projets/compétences + messages

## API principale
- `GET /api/public/home`
- `GET /api/projects`
- `GET /api/skills`
- `POST /api/contact`
- `POST /api/admin/login`
- `GET/PUT /api/admin/profile`
- `GET/POST/PUT/DELETE /api/admin/projects`
- `GET/POST/PUT/DELETE /api/admin/skills`
- `GET/PATCH/DELETE /api/admin/messages`
