import { auth } from "../../firebase/firebase";

export const firebaseFetch = async (url: string, options?: RequestInit) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Connexion requise pour accéder à la bibliothèque.");
  const target = new URL(url);
  const base = new URL(import.meta.env.VITE_FIREBASE_DB_URL);
  if (target.origin !== base.origin) throw new Error("Adresse Firebase invalide.");
  target.searchParams.set("auth", await user.getIdToken());
  const response = await fetch(target, options);
  if (!response.ok) throw new Error(`Impossible d'accéder à la bibliothèque (${response.status}).`);
  return response;
};
