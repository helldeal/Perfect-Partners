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
- Jouer à Songless, un blind test Spotify avec des extraits de 100 ms à 15 s, depuis ses playlists et ses goûts musicaux (Premium requis).

Une rubrique dédiée aux Lego est également prévue et actuellement en cours de développement.

## Technologies

Le projet utilise React, TypeScript, Vite, Tailwind CSS, TanStack React Query, Zustand et Firebase. Les données cinéma proviennent de TMDB et les données des jeux d'IGDB via un Cloudflare Worker. Songless utilise la Web API Spotify et le Web Playback SDK, avec une authentification OAuth PKCE sans secret client.

## Installation locale

Prérequis : Node.js 22 et npm.

```bash
npm install
```

Copier `exemple.env` vers `.env`, puis renseigner les variables nécessaires :

```dotenv
VITE_TMDB_API_KEY=
VITE_TMDB_URL=https://api.themoviedb.org/3
VITE_IGDB_WORKER_URL=https://perfect-partners.mrhelldeal.workers.dev
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_DB_URL=
VITE_SPOTIFY_CLIENT_ID=
```

La variable `VITE_SPOTIFY_CLIENT_ID` concerne uniquement Songless.
Les notifications push nécessitent aussi `VITE_FIREBASE_VAPID_KEY` et
`VITE_PUSH_WORKER_URL` : voir [leur configuration](./docs/push-notifications.md).
Les variables `VITE_` sont intégrées au bundle client. Ne jamais y placer de
secret confidentiel ni versionner le fichier `.env`.

Lancer le serveur et garder le terminal ouvert :

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Ouvrir <http://127.0.0.1:5173/Perfect-Partners/>. Cette commande impose le port
attendu par la configuration Spotify. Après une modification du `.env`,
redémarrer le serveur.

## Configuration de Songless

Créer une application dans le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard),
ajouter les deux comptes Premium aux utilisateurs autorisés et enregistrer les
URI de redirection exactes :

```text
http://127.0.0.1:5173/Perfect-Partners/songless
https://helldeal.github.io/Perfect-Partners/songless
```

Ajouter également `VITE_SPOTIFY_CLIENT_ID` aux secrets GitHub Actions.
Le Client ID doit correspondre à l'application dont ces URI ont été configurées.
L'URI est calculée automatiquement depuis l'adresse du navigateur ; aucune
variable `redirect_uri` n'est nécessaire dans `.env`.

La source automatique « Pour moi » utilise les tops d'écoute à court, moyen et
long terme, les écoutes récentes et jusqu'à 500 titres likés. Elle ne dépend pas
des playlists algorithmiques « Made for You ». L'accès aux playlists dépend
des permissions accordées par Spotify.

### Jouer

Ouvrir la rubrique Blindtest après la connexion Google, puis « Continuer avec
Spotify ». Choisir le mode **Blindtest** (lecture continue, sans paliers) ou
**Songless** (extraits progressifs). En Songless, cocher les durées souhaitées
parmi 0,1 s, 0,5 s, 2 s, 8 s et 15 s ; au moins une durée doit rester active.
Sélectionner une ou plusieurs sources et cliquer sur « Commencer ».
En Blindtest, lancer le morceau avec le bouton de lecture ; une erreur permet
de réessayer et « Révéler » affiche la réponse. La lecture peut être mise en
pause et reprise. En Songless, seuls les paliers activés sont utilisés.
Songless utilise uniquement le morceau Spotify, avec des extraits commençant à
10 secondes. Le chargement prépare le morceau à volume nul puis le met en pause
avant d'activer Play. Un échec propose de réessayer ; le navigateur doit permettre
de régler le volume du SDK pour cette préparation silencieuse.

En Songless, écouter l'extrait et saisir un titre ou choisir une suggestion. Une erreur ou
« Passer » augmente la durée parmi les paliers activés. Une bonne réponse ou la
révélation lance le morceau à partir de 10 s ; « Musique suivante » passe au titre suivant.

La navigation ouvre `/blindtest`. La route `/songless` reste disponible pour
les anciens liens et le retour OAuth Spotify : les URI enregistrées dans le
Spotify Developer Dashboard restent celles indiquées ci-dessus.

Les sources sélectionnées et la session Spotify sont mémorisées dans le
navigateur. La partie et les réponses ne sont pas enregistrées dans Firebase.

### Dépannage de la connexion

- **`redirect_uri: Not matching configuration`** : vérifier que l'URI enregistrée dans les paramètres Spotify correspond exactement à celle utilisée, avec le bon protocole, port, chemin et sans slash final. Spotify refuse `localhost` ; utiliser `127.0.0.1` en local. Voir les [règles Spotify sur les URI de redirection](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).
- **Firefox ne peut pas se connecter à `127.0.0.1:5173`** : démarrer le serveur avec la commande ci-dessus et le laisser tourner. Si le port est occupé, arrêter le serveur concerné ou choisir un autre port et enregistrer l'URI correspondante dans Spotify.
- **Session expirée ou goûts impossibles à charger** : déconnecter puis reconnecter Spotify depuis la rubrique Blindtest pour renouveler les autorisations.
- **Lecture indisponible** : vérifier que le compte Spotify est Premium et attendre que le lecteur soit prêt.

## Vérification

```bash
npm run lint
npm run build
```

L'application React ne dispose pas actuellement de suite de tests automatisés.

## Déploiement

Chaque push sur `main` déclenche la validation, la construction du projet et sa publication sur GitHub Pages.
Le workflow effectue aussi un audit des dépendances et génère `404.html` pour
les accès directs aux routes, notamment le retour OAuth vers Songless.
Les variables de configuration sont fournies au build via GitHub Secrets ;
le fichier `.env` local n'est pas utilisé par GitHub Actions.

Pour une description détaillée des fonctionnalités et de l'architecture, consulter [`context.md`](./context.md).
