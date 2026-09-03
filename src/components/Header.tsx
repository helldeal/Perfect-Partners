import { useNavigate } from "react-router-dom";
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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const searchTerm = useSearchStore((state) => state.query);
  const setSearchTerm = useSearchStore((state) => state.setQuery);

  const handleSignOut = async () => {
    await doSignOut();
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
      setIsMobileMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (path: string) => {
    setSearchTerm("");
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`flex justify-between items-center p-3 gap-2 sm:gap-3 h-16 sticky top-0 z-10 ${
        isScrolled ? "bg-[#181818]" : "bg-transparent"
      } transition-colors duration-300 px-4 sm:px-6 md:px-12 lg:px-18`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div
          className="flex items-center gap-1 sm:gap-2 cursor-pointer mr-2 sm:mr-4 md:mr-8 text-center scale-100 sm:scale-105 md:scale-110 shrink-0"
          onClick={() => {
            setSearchTerm("");
            navigate("/");
          }}
        >
          <img
            src={logoImg}
            alt="Perfect Partners Logo"
            className="w-6 h-6 sm:w-8 sm:h-8"
          />
          <h1 className="text-base sm:text-lg leading-none hidden sm:block">
            Perfect Partners
          </h1>
        </div>

        <nav className=" cursor-pointer space-x-2 sm:space-x-3 text-xs sm:text-sm hidden md:flex">
          {navMenu.map((item) => (
            <span
              key={item.key}
              className={`ml-2 sm:ml-4 ${navSelected === item.key ? "font-bold" : ""}`}
              onClick={() => {
                setSearchTerm("");
                navigate(item.path);
              }}
            >
              {item.name}
            </span>
          ))}{" "}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex flex-col gap-1 cursor-pointer shrink-0"
          aria-label="Basculer le menu mobile"
        >
          <span
            className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
          ></span>
          <span
            className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? "opacity-0" : ""}`}
          ></span>
          <span
            className={`w-5 h-0.5 bg-white transition-all ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#181818] border-b border-gray-700 md:hidden">
          <nav className="flex flex-col p-4 gap-3">
            {navMenu.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.path)}
                className={`text-left px-4 py-2 rounded transition-colors ${
                  navSelected === item.key
                    ? "font-bold bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="relative flex-1 sm:flex-auto max-w-md">
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
            className="p-2 pr-8 w-full box-border text-sm"
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
                alt={currentUser.displayName || "profil"}
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
              Se déconnecter
            </button>
          </div>
        </details>
      </div>
    </header>
  );
};
