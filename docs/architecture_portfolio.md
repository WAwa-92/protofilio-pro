# Hiérarchie des fichiers (V3 - ultra simple)

## Vue rapide
- `app/` : tout le code
- `docs/` : diagrammes + planning
- `database/` : exports SQL
- `archive/` : ancienne version (à ne pas toucher)

## Dossier principal à utiliser : `app/`

### `app/server/`
- `package.json`
- `.env.example`
- `src/server.js`

### `app/public/`
- `index.html` (accueil)
- `projects.html` (projets)
- `contact.html` (contact)
- `admin.html` (connexion admin)
- `css/main.css` (CSS final)
- `sass/main.scss` (source Sass)
- `js/`
- `images/`
- `cv/`

## Règle simple pour ne pas se perdre
1. Tu modifies d'abord les pages HTML dans `app/public`.
2. Tu styles dans `app/public/sass/main.scss`.
3. Tu compiles vers `app/public/css/main.css`.
4. Tu codes l'API dans `app/server/src/server.js`.
