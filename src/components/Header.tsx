import { useNavigate } from "react-router";
import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";
import logoImg from "../assets/logo.png";
import { useState, useEffect } from "react";
import useSearchStore from "../store/searchStore";

const navMenu = [
  { name: "Cinéma", path: "/movies", key: "movies" },
  { name: "Jeux", path: "/games", key: "games" },
  { name: "Lego", path: "/legos", key: "legos" },
];

export const Header = ({ navSelected }: { navSelected: string }) => {
  const { userLoggedIn, userLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  {
    !userLoggedIn && !userLoading && navigate("/login", { replace: true });
  }

  const searchTerm = useSearchStore((state) => state.query);
  const setSearchTerm = useSearchStore((state) => state.setQuery);

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
      className={`flex justify-between items-center p-3 gap-3 h-16 sticky top-0 z-10 ${
        isScrolled ? "bg-[#181818]" : "bg-transparent"
      } transition-colors duration-300 px-18`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 cursor-pointer mr-8 text-center scale-110"
          onClick={() => navigate("/")}
        >
          <img src={logoImg} alt="Perfect Partners Logo" className="w-8 h-8" />
          <h1 className="text-lg leading-none">Perfect Partners</h1>
        </div>

        <nav className=" cursor-pointer space-x-2 text-sm hidden md:flex">
          {navMenu.map((item) => (
            <span
              key={item.key}
              className={`ml-4 ${navSelected === item.key ? "font-bold" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.name}
            </span>
          ))}{" "}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder={(() => {
              switch (navSelected) {
                case "movies":
                  return "Rechercher des films, séries...";
                case "games":
                  return "Rechercher des jeux...";
                case "legos":
                  return "Rechercher des legos...";
                default:
                  return "Rechercher...";
              }
            })()}
            className="p-2 pr-8 w-full box-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchTerm("");
            }}
          />

          {searchTerm.length > 0 && (
            <span
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-2 cursor-pointer text-gray-600 select-none"
            >
              ✕
            </span>
          )}
        </div>
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
