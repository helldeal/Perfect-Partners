import { auth } from "./firebase";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
  }
};

export const doSignOut = async () => {
  try {
    await auth.signOut();
    window.location.reload();
  } catch (error) {
    console.error(error);
  }
};
