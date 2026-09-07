import { useEffect, useState } from "react";
import { latestPatchNote, patchNotes } from "../data/patchNotes";
import { PatchNotesModal } from "./PatchNotesModal";

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
    latestPatchNote.id
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
      <footer className="mt-auto border-t border-app-border px-4 py-5 text-center text-sm text-app-muted sm:px-8">
        <button
          type="button"
          onClick={openHistory}
          className="rounded-full border border-app-border bg-app-surface px-4 py-2 transition-colors hover:border-app-primary/50 hover:bg-app-primary-soft hover:text-app-primary cursor-pointer"
        >
          Notes de version
        </button>
      </footer>

      <PatchNotesModal
        open={isOpen}
        notes={showLatestOnly ? [latestPatchNote] : patchNotes}
        onClose={closePatchNotes}
      />
    </>
  );
};
