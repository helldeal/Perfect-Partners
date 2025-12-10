import { useEffect, useState, createContext, useContext } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, update } from "firebase/database";

const AuthContext = createContext<{
  currentUser: User | null;
  userLoggedIn: boolean;
  userLoading: boolean;
}>({
  currentUser: null,
  userLoggedIn: false,
  userLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return () => unsubscribe();
  }, []);

  async function initializeUser(user: User | null) {
    if (
      !user ||
      (user.email !== "mrhelldeal@gmail.com" &&
        user.email !== "grandbardematthieu@gmail.com")
    ) {
      setUserLoading(false);
      return;
    }

    // Save to Realtime Database
    await saveUserToRealtimeDB(user);

    // Update context
    setCurrentUser(user);
    setUserLoggedIn(!!user);
    setUserLoading(false);
  }

  async function saveUserToRealtimeDB(user: User) {
    const userRef = ref(db, "users/" + user.uid);

    await update(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.providerData[0]?.providerId,
      lastLogin: Date.now(),
    });
  }

  const value = {
    currentUser,
    userLoggedIn,
    userLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
