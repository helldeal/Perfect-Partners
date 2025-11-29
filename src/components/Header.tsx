import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";
import logoImg from "../assets/logo.png";
import { useState, useEffect } from "react";

export const Header = ({ navSelected }: { navSelected: string }) => {
  const { userLoggedIn, userLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  // console.log("Header auth state:", {
  //   userLoggedIn,
  //   userLoading,
  //   currentUser,
  // });
  {
    !userLoggedIn && !userLoading && (
      <Navigate to={"/Perfect-Partners/login"} replace={true} />
    );
  }

  const handleSignOut = async () => {
    await doSignOut();
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`flex justify-between items-center p-3 gap-3 h-16 sticky top-0 z-10 border-b ${
        isScrolled ? "bg-gray-800" : "bg-transparent"
      } transition-colors duration-300`}
    >
      <div className="flex items-center gap-4">
        <img src={logoImg} alt="Perfect Partners Logo" className="w-8 h-8" />
        <h1 className="m-0 text-lg cursor-default">Perfect Partners</h1>
        <nav className="text-gray-600 text-sm cursor-pointer">
          <span
            className={navSelected === "movies" ? "font-bold" : ""}
            onClick={() => navigate("/Perfect-Partners/movies")}
          >
            Vidéogramme
          </span>{" "}
          <span className="opacity-60">/</span>{" "}
          <span
            className={navSelected === "games" ? "font-bold" : ""}
            onClick={() => navigate("/Perfect-Partners/games")}
          >
            Jeux Vidéo
          </span>{" "}
          <span className="opacity-60">/</span>{" "}
          <span
            className={navSelected === "legos" ? "font-bold" : ""}
            onClick={() => navigate("/Perfect-Partners/legos")}
          >
            Lego
          </span>
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
