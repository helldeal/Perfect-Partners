import { useEffect, useState, createContext, useContext } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

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
  const [userLoading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return () => unsubscribe();
  }, []);

  function initializeUser(user: User | null) {
    if (
      !user ||
      (user.email !== "mrhelldeal@gmail.com" &&
        user.email !== "grandbardematthieu@gmail.com")
    )
      return;
    console.log("valid user");
    setCurrentUser(user);
    setUserLoggedIn(!!user);
    setLoading(false);
  }

  const value = {
    currentUser,
    userLoggedIn,
    userLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
