export type PatchNoteCategory =
  | "interface"
  | "games"
  | "cinema"
  | "security"
  | "infrastructure";

export type PatchNoteChangeType = "fix" | "improvement" | "feature";

export type PatchNoteChange = {
  type: PatchNoteChangeType;
  text: string;
};

export type PatchNote = {
  id: string;
  date: string;
  title: string;
  categories: PatchNoteCategory[];
  changes: PatchNoteChange[];
};

// Une entrée par merge présent dans l'historique first-parent de main.
// L'identifiant reprend le début du SHA afin de rester stable et vérifiable.
export const patchNotes: PatchNote[] = [
  {
    id: "07d9eaa",
    date: "7 septembre 2026",
    title: "Une bibliothèque vivante et partagée",
    categories: ["cinema", "games", "interface", "infrastructure"],
    changes: [
      {
        type: "feature",
        text: "Ajout d'un centre de notifications partagé pour suivre les ajouts, suppressions et possessions des utilisateurs.",
      },
      {
        type: "improvement",
        text: "Mise en place d'actualisations système intelligentes pour synchroniser les textes, images, bandes-annonces, plateformes et épisodes depuis TMDB et IGDB.",
      },
      {
        type: "feature",
        text: "Détection automatique des nouvelles saisons avec notification et indicateur « Nouveaux épisodes » pendant deux semaines.",
      },
      {
        type: "fix",
        text: "Séparation des mises à jour utilisateur et système afin que le tri reflète uniquement l'activité des utilisateurs.",
      },
      {
        type: "improvement",
        text: "Refonte du thème, des modales et des composants cinéma pour une interface plus cohérente sur mobile et ordinateur.",
      },
      {
        type: "feature",
        text: "Ajout des notes de version, amélioration du profil et fiabilisation du déploiement GitHub Pages.",
      },
    ],
  },
  {
    id: "4c86a4a",
    date: "27 janvier 2026",
    title: "Une expérience mobile complète",
    categories: ["interface"],
    changes: [
      {
        type: "improvement",
        text: "Adaptation des pages, cartes et modales aux écrans mobiles.",
      },
      {
        type: "feature",
        text: "Ajout d'un menu de navigation compact sur téléphone.",
      },
      {
        type: "improvement",
        text: "Amélioration du bouton retour et des libellés en français.",
      },
    ],
  },
  {
    id: "71b60a4",
    date: "10 décembre 2025",
    title: "Suivi partagé des jeux",
    categories: ["games", "interface"],
    changes: [
      {
        type: "feature",
        text: "Classement des jeux entre liste à faire, en cours et terminés.",
      },
      {
        type: "feature",
        text: "Ajout des propriétaires d'un jeu avec leur profil utilisateur.",
      },
      {
        type: "improvement",
        text: "Amélioration des logos, arrière-plans et détails des collections.",
      },
    ],
  },
  {
    id: "363541f",
    date: "9 décembre 2025",
    title: "Arrivée des jeux vidéo",
    categories: ["games", "interface", "infrastructure"],
    changes: [
      {
        type: "feature",
        text: "Recherche et ajout de jeux depuis IGDB.",
      },
      {
        type: "feature",
        text: "Création des cartes, listes et modales dédiées aux jeux.",
      },
      {
        type: "feature",
        text: "Ajout des genres, plateformes, collections et jeux similaires.",
      },
    ],
  },
  {
    id: "ae0fc75",
    date: "7 décembre 2025",
    title: "Connexion fiabilisée",
    categories: ["security"],
    changes: [
      {
        type: "fix",
        text: "Correction du parcours d'authentification Google.",
      },
      {
        type: "improvement",
        text: "Amélioration de la gestion de session et de la déconnexion.",
      },
    ],
  },
  {
    id: "e0df591",
    date: "7 décembre 2025",
    title: "Navigation compatible GitHub Pages",
    categories: ["infrastructure", "interface"],
    changes: [
      {
        type: "fix",
        text: "Correction du routage et des redirections après connexion.",
      },
      {
        type: "improvement",
        text: "Adaptation de la navigation au déploiement GitHub Pages.",
      },
    ],
  },
  {
    id: "c99064c",
    date: "7 décembre 2025",
    title: "Les sagas cinéma",
    categories: ["cinema", "interface"],
    changes: [
      {
        type: "feature",
        text: "Regroupement automatique des films appartenant à une collection.",
      },
      {
        type: "feature",
        text: "Affichage de la progression globale d'une saga.",
      },
      {
        type: "improvement",
        text: "Amélioration du tri entre contenus à voir, en cours et terminés.",
      },
    ],
  },
  {
    id: "89f78bb",
    date: "7 décembre 2025",
    title: "Films et séries partagés",
    categories: ["cinema", "interface", "infrastructure"],
    changes: [
      {
        type: "feature",
        text: "Création des listes communes de films et séries synchronisées avec Firebase.",
      },
      {
        type: "feature",
        text: "Recherche TMDB, progression de visionnage et suivi des épisodes.",
      },
      {
        type: "feature",
        text: "Ajout des modales détaillées avec vidéos, plateformes, crédits et recommandations.",
      },
      {
        type: "feature",
        text: "Mise en place de l'interface, de la recherche et du déploiement.",
      },
    ],
  },
];

export const latestPatchNote = patchNotes[0];
