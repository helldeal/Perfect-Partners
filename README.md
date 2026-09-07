# Perfect Partners

Perfect Partners est une application web privée permettant de gérer à plusieurs ses listes de films, séries et jeux vidéo.

## Fonctionnalités

- Rechercher des films et séries avec TMDB.
- Suivre les films regardés et la progression épisode par épisode des séries.
- Regrouper automatiquement les films appartenant à une même saga.
- Rechercher et organiser des jeux vidéo grâce à IGDB.
- Classer les jeux dans une liste à faire, en cours ou terminée.
- Indiquer qui possède chaque jeu.
- Synchroniser les listes en temps réel avec Firebase.
- Se connecter avec un compte Google autorisé.

Une rubrique dédiée aux Lego est également prévue et actuellement en cours de développement.

## Technologies

Le projet utilise React, TypeScript, Vite, Tailwind CSS, TanStack React Query, Zustand et Firebase. Les données cinéma proviennent de TMDB et les données des jeux d'IGDB via un Cloudflare Worker.

## Installation locale

Prérequis : Node.js 22 et npm.

```bash
npm install
```

Copier `exemple.env` vers `.env`, puis renseigner les variables nécessaires :

```dotenv
VITE_TMDB_API_KEY=
VITE_TMDB_URL=https://api.themoviedb.org/3
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_DB_URL=
```

Lancer ensuite le serveur de développement :

```bash
npm run dev
```

## Vérification

```bash
npm run lint
npm run build
```

## Déploiement

Chaque push sur `main` déclenche la validation, la construction du projet et sa publication sur GitHub Pages.

Pour une description détaillée des fonctionnalités et de l'architecture, consulter [`context.md`](./context.md).
