import { useEffect, useState } from "react";
import { latestPatchNote, patchNotes } from "../data/patchNotes";
import { PatchNotesModal } from "./PatchNotesModal";
import logo from "../assets/logo.png";

const PATCH_NOTES_COOKIE = "perfect_partners_patch_notes";

const getSeenPatchVersion = () => {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${PATCH_NOTES_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const rememberLatestPatchForSession = () => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PATCH_NOTES_COOKIE}=${encodeURIComponent(
    latestPatchNote.id,
  )}; Path=${import.meta.env.BASE_URL}; SameSite=Lax${secure}`;
};

export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLatestOnly, setShowLatestOnly] = useState(false);

  useEffect(() => {
    if (getSeenPatchVersion() !== latestPatchNote.id) {
      setShowLatestOnly(true);
      setIsOpen(true);
    }
  }, []);

  const openHistory = () => {
    setShowLatestOnly(false);
    setIsOpen(true);
  };

  const closePatchNotes = () => {
    rememberLatestPatchForSession();
    setIsOpen(false);
  };

  return (
    <>
      <footer className="mt-auto border-t border-app-border/60 bg-app-surface/20 text-sm text-app-muted">
        <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-5 px-4 py-7 sm:flex-row sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt=""
              className="h-9 w-9 object-contain opacity-80"
            />
            <div>
              <p className="text-sm font-semibold tracking-wide text-app-text/85">
                Perfect Partners
              </p>
              <p className="mt-0.5 text-xs text-app-muted">
                Si tu lis ca, t'es juste le GOAT
              </p>
            </div>
          </div>
          <nav
            aria-label="Liens du pied de page"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            <button
              type="button"
              onClick={openHistory}
              className="cursor-pointer rounded-md py-2 text-xs font-medium transition-colors hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-primary sm:text-sm"
            >
              Notes de version
            </button>
            <a
              href="https://helldeal.betteruptime.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md py-2 text-xs font-medium transition-colors hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-primary sm:text-sm"
            >
              Statut des services
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5h5v5m0-5L9 15m10-2v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
                />
              </svg>
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </nav>
        </div>
      </footer>

      <PatchNotesModal
        open={isOpen}
        notes={showLatestOnly ? [latestPatchNote] : patchNotes}
        onClose={closePatchNotes}
      />
    </>
  );
};
