import { useCallback, useEffect, useRef, useState } from "react";
import { doSignInWithGoogle } from "../firebase/auth";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const LoginPage = () => {
  const { userLoggedIn, userLoading } = useAuth();
  const location = useLocation();
  const popupStarted = useRef(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(false);

  const redirectTo =
    (location.state as { redirectTo?: string } | null)?.redirectTo ?? "/";

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    setSignInError(false);

    try {
      await doSignInWithGoogle();
    } catch {
      setSignInError(true);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading || userLoggedIn || popupStarted.current) return;

    popupStarted.current = true;
    void signIn();
  }, [signIn, userLoading, userLoggedIn]);

  if (userLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="min-h-screen bg-[#181818] text-slate-100 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl mb-3">Perfect Partners</h1>
        <p className="text-gray-400 mb-6">
          {userLoading || isSigningIn
            ? "Connexion avec Google en cours…"
            : "Connectez-vous pour accéder à vos listes."}
        </p>
        {signInError && (
          <button
            type="button"
            onClick={() => void signIn()}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 cursor-pointer"
          >
            Réessayer avec Google
          </button>
        )}
      </div>
    </main>
  );
};

export default LoginPage;
