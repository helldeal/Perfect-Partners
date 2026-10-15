import { Link } from "react-router-dom";
import logoImg from "../assets/logo.png";
import useSearchStore from "../store/searchStore";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationMenu } from "./NotificationMenu";
import { useNotifications } from "../contexts/notificationsContext";
import { NotificationPing } from "./NotificationPing";

const navMenu = [
  { name: "Cinéma", path: "/movies", key: "movies" },
  { name: "Jeux", path: "/games", key: "games" },
  { name: "Lego", path: "/legos", key: "legos" },
  { name: "Songless", path: "/songless", key: "songless" },
];

export const Header = ({ navSelected }: { navSelected: string }) => {
  const { unreadNotifications } = useNotifications();
  const searchTerm = useSearchStore((state) => state.query);
  const setSearchTerm = useSearchStore((state) => state.setQuery);
  const supportsSearch = navSelected === "movies" || navSelected === "games";
  const placeholder = navSelected === "movies"
    ? "Rechercher un film ou une série…"
    : navSelected === "games" ? "Rechercher un jeu…" : "Rechercher…";

  const searchField = (
    <div className="relative">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path strokeLinecap="round" d="m16 16 4.5 4.5" />
      </svg>
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Escape") setSearchTerm(""); }}
        className="w-full rounded-full border border-app-border bg-app-surface/70 py-2.5 pl-10 pr-10 text-sm text-app-text outline-none transition-colors placeholder:text-app-muted focus:border-app-primary focus:ring-2 focus:ring-app-primary/15 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {searchTerm && <button type="button" aria-label="Effacer la recherche" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-app-muted hover:bg-app-surface-elevated hover:text-app-text focus-visible:outline-2 focus-visible:outline-app-primary">✕</button>}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-app-border/60 bg-app-bg/95 text-app-text backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-[1800px] flex-wrap items-center gap-x-5 px-4 sm:px-6 md:px-8 lg:gap-x-10 lg:px-12">
        <Link to="/" onClick={() => setSearchTerm("")} aria-label="Perfect Partners — Accueil" className="flex shrink-0 items-center gap-3 rounded-lg py-3 outline-none focus-visible:ring-2 focus-visible:ring-app-primary">
          <img src={logoImg} alt="" className="h-10 w-10 object-contain sm:h-11 sm:w-11" />
          <span className="text-sm font-extrabold uppercase leading-tight tracking-wide sm:text-base lg:text-lg">Perfect <span className="block text-app-primary sm:inline">Partners</span></span>
        </Link>
        <nav aria-label="Navigation principale" className="order-3 flex w-full items-stretch gap-7 md:order-none md:w-auto md:self-stretch lg:gap-9">
          {navMenu.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setSearchTerm("")}
              aria-current={navSelected === item.key ? "page" : undefined}
              className={`relative flex min-h-12 items-center gap-2 border-b-2 px-1 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-primary md:min-h-18 lg:text-base ${navSelected === item.key ? "border-app-primary text-app-text" : "border-transparent text-app-muted hover:border-app-primary/40 hover:text-app-text"}`}
            >
              {item.name}
              {unreadNotifications.some((notification) => notification.category === item.key) && <NotificationPing />}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {supportsSearch && <div className="hidden w-72 xl:block">{searchField}</div>}
          <div className="rounded-full border border-app-border bg-app-surface/60"><NotificationMenu /></div>
          <ProfileMenu />
        </div>
      </div>
      {supportsSearch && <div className="mx-auto max-w-[1800px] px-4 pb-3 sm:px-6 md:px-8 lg:px-12 xl:hidden">{searchField}</div>}
    </header>
  );
};
