export type PatchNote = {
  id: string;
  date: string;
  title: string;
  category: "interface" | "games" | "cinema" | "security" | "infrastructure";
  changes: string[];
};

// Une entrée par merge présent dans l'historique first-parent de main.
// L'identifiant reprend le début du SHA afin de rester stable et vérifiable.
export const patchNotes: PatchNote[] = [
  {
    id: "4c86a4a",
    date: "27 janvier 2026",
    title: "Une expérience mobile complète",
    category: "interface",
    changes: [
      "Adaptation des pages, cartes et modales aux écrans mobiles.",
      "Ajout d'un menu de navigation compact sur téléphone.",
      "Amélioration du bouton retour et des libellés en français.",
    ],
  },
  {
    id: "71b60a4",
    date: "10 décembre 2025",
    title: "Suivi partagé des jeux",
    category: "games",
    changes: [
      "Classement des jeux entre liste à faire, en cours et terminés.",
      "Ajout des propriétaires d'un jeu avec leur profil utilisateur.",
      "Amélioration des logos, arrière-plans et détails des collections.",
    ],
  },
  {
    id: "363541f",
    date: "9 décembre 2025",
    title: "Arrivée des jeux vidéo",
    category: "games",
    changes: [
      "Recherche et ajout de jeux depuis IGDB.",
      "Création des cartes, listes et modales dédiées aux jeux.",
      "Ajout des genres, plateformes, collections et jeux similaires.",
    ],
  },
  {
    id: "ae0fc75",
    date: "7 décembre 2025",
    title: "Connexion fiabilisée",
    category: "security",
    changes: [
      "Correction du parcours d'authentification Google.",
      "Amélioration de la gestion de session et de la déconnexion.",
    ],
  },
  {
    id: "e0df591",
    date: "7 décembre 2025",
    title: "Navigation compatible GitHub Pages",
    category: "infrastructure",
    changes: [
      "Correction du routage et des redirections après connexion.",
      "Adaptation de la navigation au déploiement GitHub Pages.",
    ],
  },
  {
    id: "c99064c",
    date: "7 décembre 2025",
    title: "Les sagas cinéma",
    category: "cinema",
    changes: [
      "Regroupement automatique des films appartenant à une collection.",
      "Affichage de la progression globale d'une saga.",
      "Amélioration du tri entre contenus à voir, en cours et terminés.",
    ],
  },
  {
    id: "89f78bb",
    date: "7 décembre 2025",
    title: "Films et séries partagés",
    category: "cinema",
    changes: [
      "Création des listes communes de films et séries synchronisées avec Firebase.",
      "Recherche TMDB, progression de visionnage et suivi des épisodes.",
      "Ajout des modales détaillées avec vidéos, plateformes, crédits et recommandations.",
      "Mise en place de l'interface, de la recherche et du déploiement.",
    ],
  },
];

export const latestPatchNote = patchNotes[0];
