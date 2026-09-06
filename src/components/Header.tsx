import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { useState, useEffect } from "react";
import useSearchStore from "../store/searchStore";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationMenu } from "./NotificationMenu";
import { useNotifications } from "../contexts/notificationsContext";

const navMenu = [
  { name: "Cinéma", path: "/movies", key: "movies" },
  { name: "Jeux", path: "/games", key: "games" },
  { name: "Lego", path: "/legos", key: "legos" },
];

export const Header = ({ navSelected }: { navSelected: string }) => {
  const navigate = useNavigate();
  const { unreadNotifications } = useNotifications();

  const searchTerm = useSearchStore((state) => state.query);
  const setSearchTerm = useSearchStore((state) => state.setQuery);

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
        isScrolled ? "bg-app-bg/95 backdrop-blur-md" : "bg-transparent"
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
              <span className="relative">
                {item.name}
                {unreadNotifications.some(
                  (notification) => notification.category === item.key
                  ) && (
                  <span className="absolute -right-2 -top-1 h-1.5 w-1.5 rounded-full bg-app-primary" />
                )}
              </span>
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
        <div className="absolute top-16 left-0 right-0 bg-app-surface border-b border-app-border md:hidden">
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
                <span className="flex items-center justify-between">
                  {item.name}
                  {unreadNotifications.some(
                    (notification) => notification.category === item.key
                  ) && <span className="h-2 w-2 rounded-full bg-app-primary" />}
                </span>
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
        <NotificationMenu />
        <ProfileMenu />
      </div>
    </header>
  );
};
