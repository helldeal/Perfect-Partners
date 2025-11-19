import { Navigate } from "react-router";
import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";

export const Header = () => {
  const { userLoggedIn, userLoading, currentUser } = useAuth();
  console.log("Header auth state:", {
    userLoggedIn,
    userLoading,
    currentUser,
  });
  {
    !userLoggedIn && !userLoading && (
      <Navigate to={"/Perfect-Partners/login"} replace={true} />
    );
  }

  const handleSignOut = async () => {
    await doSignOut();
  };

  return (
    <header className="flex justify-between items-center p-3 gap-3">
      <div className="flex items-center gap-4">
        <h1 className="m-0 text-lg">Perfect Partners</h1>
        <nav className="text-gray-800 text-sm">
          Vidéogramme <span className="opacity-60">/</span> Jeux Vidéo{" "}
          <span className="opacity-60">/</span> Lego
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <details className="relative">
          <summary className="list-none cursor-pointer p-0 m-0 flex items-center">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || "profile"}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300" />
            )}
          </summary>

          <div className="absolute right-0 top-full bg-black border border-gray-300 rounded-lg p-2 shadow-lg min-w-40 z-50">
            <div className="p-2 border-b border-gray-200 text-sm">
              {currentUser?.displayName}
            </div>
            <button
              onClick={handleSignOut}
              className="mt-2 w-full p-2 bg-red-600 text-white rounded-md cursor-pointer text-sm"
              type="button"
            >
              Sign out
            </button>
          </div>
        </details>
      </div>
    </header>
  );
};
