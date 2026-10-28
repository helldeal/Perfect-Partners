export type PatchNoteCategory =
  | "interface"
  | "games"
  | "cinema"
  | "music"
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

// Une entrée par livraison ; l'identifiant reprend le SHA du changement associé.
export const patchNotes: PatchNote[] = [
  {
    id: "6244e1d",
    date: "28 octobre 2026",
    title: "Le Blindtest entre en scène",
    categories: ["music", "interface", "cinema", "infrastructure"],
    changes: [
      {
        type: "feature",
        text: "Un Blindtest Spotify rejoint Perfect Partners avec une lecture continue des morceaux.",
      },
      {
        type: "feature",
        text: "Le mode Songless permet de reconnaître un titre grâce à des extraits de plus en plus longs.",
      },
      {
        type: "improvement",
        text: "Les paliers du Songless sont personnalisables de 0,1 à 15 secondes.",
      },
      {
        type: "improvement",
        text: "Vos playlists et la sélection « Pour moi » alimentent désormais vos parties.",
      },
      {
        type: "fix",
        text: "Les différentes éditions d'un même morceau ne se répètent plus dans le mix.",
      },
      {
        type: "improvement",
        text: "La réponse met davantage en valeur la pochette, le titre et l'artiste.",
      },
      {
        type: "feature",
        text: "Les notifications push vous préviennent même lorsque l'application est fermée.",
      },
      {
        type: "improvement",
        text: "Les fiches de séries affichent plus clairement les saisons, les statuts et les crédits.",
      },
    ],
  },
  {
    id: "a58b249",
    date: "14 octobre 2026",
    title: "Une bibliothèque plus claire",
    categories: ["interface", "cinema", "games", "security"],
    changes: [
      {
        type: "improvement",
        text: "Des listes plus lisibles, avec un compteur par catégorie.",
      },
      {
        type: "feature",
        text: "Le logo vous accueille au démarrage de l'application.",
      },
      {
        type: "improvement",
        text: "Le contenu se dessine progressivement pendant le chargement.",
      },
      {
        type: "fix",
        text: "Les catégories restent visibles pendant le chargement.",
      },
      {
        type: "improvement",
        text: "Un bouton « Réessayer » en cas de problème de chargement.",
      },
      {
        type: "improvement",
        text: "Des émojis pour repérer les nouveautés, améliorations et corrections.",
      },
      {
        type: "fix",
        text: "Corrections de sécurité.",
      },
    ],
  },
  {
    id: "07d9eaa",
    date: "7 septembre 2026",
    title: "Une bibliothèque vivante et partagée",
    categories: ["cinema", "games", "interface", "infrastructure"],
    changes: [
      {
        type: "feature",
        text: "Des notifications pour suivre les changements de votre bibliothèque.",
      },
      {
        type: "improvement",
        text: "Les fiches de vos films, séries et jeux s'actualisent automatiquement.",
      },
      {
        type: "feature",
        text: "Une notification et un badge vous signalent les nouvelles saisons.",
      },
      {
        type: "fix",
        text: "Vos dernières actions déterminent l'ordre des listes.",
      },
      {
        type: "improvement",
        text: "Une interface harmonisée sur mobile et ordinateur.",
      },
      {
        type: "feature",
        text: "Retrouvez les nouveautés dans les notes de version.",
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
        text: "Des pages et des fiches adaptées au mobile.",
      },
      {
        type: "feature",
        text: "Un nouveau menu de navigation sur téléphone.",
      },
      {
        type: "improvement",
        text: "Un bouton retour plus pratique et des libellés en français.",
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
        text: "Classez vos jeux : à faire, en cours ou terminés.",
      },
      {
        type: "feature",
        text: "Indiquez qui possède chaque jeu.",
      },
      {
        type: "improvement",
        text: "Des fiches de jeux plus soignées.",
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
        text: "Recherchez et ajoutez vos jeux à la bibliothèque.",
      },
      {
        type: "feature",
        text: "Un espace dédié à vos jeux vidéo.",
      },
      {
        type: "feature",
        text: "Découvrez leurs plateformes et des jeux similaires.",
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
        text: "Connexion avec Google corrigée.",
      },
      {
        type: "improvement",
        text: "Connexion et déconnexion plus fiables.",
      },
    ],
  },
  {
    id: "e0df591",
    date: "7 décembre 2025",
    title: "Une navigation plus fiable",
    categories: ["infrastructure", "interface"],
    changes: [
      {
        type: "fix",
        text: "Vous retrouvez la bonne page après connexion.",
      },
      {
        type: "improvement",
        text: "Vos pages restent accessibles via un lien direct.",
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
        text: "Les films d'une même saga sont regroupés.",
      },
      {
        type: "feature",
        text: "Suivez votre progression dans chaque saga.",
      },
      {
        type: "improvement",
        text: "Un classement plus précis selon votre progression.",
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
        text: "Une bibliothèque de films et séries partagée en temps réel.",
      },
      {
        type: "feature",
        text: "Recherchez vos titres et suivez les épisodes vus.",
      },
      {
        type: "feature",
        text: "Retrouvez bandes-annonces, plateformes et recommandations dans chaque fiche.",
      },
    ],
  },
];

export const latestPatchNote = patchNotes[0];
