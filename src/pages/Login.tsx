import { useEffect, useState } from "react";
import { doSignInWithGoogle } from "../firebase/auth";
import { Navigate } from "react-router";
import { useAuth } from "../contexts/authContext";

const LoginPage = () => {
  const { userLoggedIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      doSignInWithGoogle().catch((_) => {
        setIsSigningIn(false);
      });
    }
  }, [isSigningIn, setIsSigningIn]);

  return (
    <div>
      {userLoggedIn && <Navigate to={"/Perfect-Partners/"} replace={true} />}
    </div>
  );
};

export default LoginPage;
