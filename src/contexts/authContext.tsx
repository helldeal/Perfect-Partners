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

// Le hook reste avec le Provider afin de partager ce contexte privé au module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (
        !user ||
        (user.email !== "mrhelldeal@gmail.com" &&
          user.email !== "grandbardematthieu@gmail.com")
      ) {
        setCurrentUser(null);
        setUserLoggedIn(false);
        setUserLoading(false);
        return;
      }

      const userRef = ref(db, "users/" + user.uid);
      await update(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.providerData[0]?.providerId,
        lastLogin: Date.now(),
      });

      setCurrentUser(user);
      setUserLoggedIn(true);
      setUserLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userLoggedIn,
    userLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
