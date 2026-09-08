import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { useNotifications } from "../contexts/notificationsContext";
import useSearchStore from "../store/searchStore";
import { NotificationMenu } from "./NotificationMenu";
import { NotificationPing } from "./NotificationPing";
import { ProfileMenu } from "./ProfileMenu";

const navMenu = [
  { name: "Cinéma", path: "/movies", key: "movies" },
  { name: "Jeux", path: "/games", key: "games" },
  { name: "Lego", path: "/legos", key: "legos" },
];

const NavIcon = ({ section }: { section: string }) => {
  if (section === "movies") return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 5 9 9M13 5l2 4M19 5l2 4M3 9h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
  if (section === "games") return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 8h7a5.5 5.5 0 0 1 5.2 7.3l-.6 1.8a2 2 0 0 1-3.2.9l-2.1-1.7H9.2L7.1 18a2 2 0 0 1-3.2-.9l-.6-1.8A5.5 5.5 0 0 1 8.5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 11v4M6 13h4M16.5 11.8h.01M18.5 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4h6v6H5zM13 4h6v6h-6zM5 12h6v6H5zM13 12h6v6h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 4V2M9 4V2M15 4V2M17 4V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export const Header = ({ navSelected }: { navSelected: string }) => {
  const navigate = useNavigate();
  const { unreadNotifications } = useNotifications();
  const searchTerm = useSearchStore((state) => state.query);
  const setSearchTerm = useSearchStore((state) => state.setQuery);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (path: string) => {
    setSearchTerm("");
    navigate(path);
  };

  const placeholder = navSelected === "movies"
    ? "Films, séries..."
    : navSelected === "games"
      ? "Rechercher des jeux..."
      : navSelected === "legos"
        ? "Rechercher des Lego..."
        : "Rechercher...";

  return (
    <>
      <header className={`sticky top-0 z-40 h-16 border-b transition-all duration-300 ${isScrolled ? "border-app-border/80 bg-app-bg/85 shadow-lg shadow-black/20 backdrop-blur-xl" : "border-transparent bg-app-bg/45 backdrop-blur-sm"}`}>
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-10">
          <button type="button" onClick={() => handleNavClick("/")} className="group flex shrink-0 items-center gap-2 rounded-xl p-1 text-left cursor-pointer" aria-label="Accueil Perfect Partners">
            <img src={logoImg} alt="" className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9" />
            <span className="hidden text-sm font-semibold tracking-wide text-app-text xl:block">Perfect Partners</span>
          </button>

          <nav className="hidden items-center rounded-full border border-app-border/70 bg-app-surface/75 p-1 shadow-inner md:flex" aria-label="Navigation principale">
            {navMenu.map((item) => {
              const active = navSelected === item.key;
              const hasNotification = unreadNotifications.some((notification) => notification.category === item.key);
              return (
                <button key={item.key} type="button" onClick={() => handleNavClick(item.path)} aria-current={active ? "page" : undefined} className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all cursor-pointer lg:px-4 ${active ? "bg-app-primary-soft text-app-primary shadow-sm" : "text-app-muted hover:bg-app-surface-elevated hover:text-app-text"}`}>
                  <span className="relative h-4 w-4">
                    <NavIcon section={item.key} />
                  </span>
                  <span className={active ? "font-semibold" : "font-medium"}>{item.name}</span>
                  {hasNotification && (
                    <NotificationPing className="absolute right-1.5 top-1" />
                  )}
                  {active && <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-app-primary" />}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
            <div className="group relative min-w-0 w-[clamp(8rem,34vw,24rem)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted transition-colors group-focus-within:text-app-primary">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchTerm(""); }} placeholder={placeholder} aria-label={placeholder} className="h-10 w-full rounded-full border border-app-border/70 bg-app-surface/75 py-2 pl-9 pr-8 text-sm text-app-text outline-none transition-all placeholder:text-app-muted/75 hover:border-app-primary/35 focus:border-app-primary/60 focus:bg-app-surface focus:ring-2 focus:ring-app-primary/15" />
              {searchTerm.length > 0 && (
                <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-app-muted transition-colors hover:bg-app-surface-elevated hover:text-app-text cursor-pointer" aria-label="Effacer la recherche">✕</button>
              )}
            </div>
            <NotificationMenu />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-2xl border border-app-border/80 bg-app-surface/90 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden" aria-label="Navigation principale mobile">
        {navMenu.map((item) => {
          const active = navSelected === item.key;
          const hasNotification = unreadNotifications.some((notification) => notification.category === item.key);
          return (
            <button key={item.key} type="button" onClick={() => handleNavClick(item.path)} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] transition-colors cursor-pointer ${active ? "bg-app-primary-soft font-semibold text-app-primary" : "text-app-muted hover:bg-app-surface-elevated hover:text-app-text"}`}>
              <span className="relative h-5 w-5">
                <NavIcon section={item.key} />
              </span>
              <span className="truncate">{item.name}</span>
              {hasNotification && (
                <NotificationPing className="absolute right-2 top-1.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
