import { useAuth } from "../contexts/authContext";
import { doSignOut } from "../firebase/auth";

export const ProfileMenu = () => {
  const { currentUser } = useAuth();
  const profileInitial =
    currentUser?.displayName?.trim().charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "?";

  return (
    <details className="relative group">
      <summary
        className="list-none cursor-pointer rounded-full p-0.5 ring-2 ring-transparent transition-all duration-200 hover:ring-white/30 group-open:ring-white/50 group-open:bg-white/10"
        aria-label="Ouvrir le menu du profil"
      >
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || "Profil"}
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-slate-500 to-slate-700 flex items-center justify-center font-semibold text-white">
            {profileInitial}
          </div>
        )}
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-[#242424]/95 shadow-2xl shadow-black/50 backdrop-blur-md z-50 origin-top-right">
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover ring-1 ring-white/20"
            />
          ) : (
            <div className="w-12 h-12 shrink-0 rounded-full bg-linear-to-br from-slate-500 to-slate-700 flex items-center justify-center text-lg font-semibold">
              {profileInitial}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-white truncate">
              {currentUser?.displayName || "Utilisateur"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>

        <div className="p-2">
          <button
            onClick={() => void doSignOut()}
            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-red-500/15 transition-colors cursor-pointer"
            type="button"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-5 h-5 text-red-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-6 3 3m0 0-3 3m3-3H9"
              />
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </details>
  );
};
