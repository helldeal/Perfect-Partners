import { Modal } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PatchNote } from "../data/patchNotes";
import { Close } from "./Close";

export const PatchNotesModal = ({
  open,
  notes,
  onClose,
}: {
  open: boolean;
  notes: PatchNote[];
  onClose: () => void;
}) => {
  const latestOnly = notes.length === 1;
  const [isModalMounted, setIsModalMounted] = useState(open);

  useEffect(() => {
    if (open) setIsModalMounted(true);
  }, [open]);

  return (
    <Modal
      open={isModalMounted}
      onClose={onClose}
      aria-labelledby="patch-notes-title"
      aria-describedby="patch-notes-description"
      className="flex items-center justify-center p-4"
    >
      <div tabIndex={-1} className="w-full max-w-2xl outline-none">
        <AnimatePresence onExitComplete={() => setIsModalMounted(false)}>
          {open && (
            <motion.section
              key="patch-notes-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] text-slate-100 shadow-2xl shadow-black/60 outline-none"
            >
              <Close closeAction={onClose} />

              <header className="border-b border-white/10 px-5 py-6 sm:px-8">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {latestOnly ? "Quoi de neuf ?" : "Historique"}
                </p>
                <h2
                  id="patch-notes-title"
                  className="pr-10 text-2xl font-semibold sm:text-3xl"
                >
                  Notes de version
                </h2>
                <p
                  id="patch-notes-description"
                  className="mt-2 text-sm text-slate-400"
                >
                  Les dernières évolutions de Perfect Partners.
                </p>
              </header>

              <div className="space-y-8 px-5 py-6 sm:px-8">
                {notes.map((note, index) => (
                  <article key={note.id} className="relative pl-5">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 h-2 w-2 rounded-full bg-white"
                    />
                    {index < notes.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[3px] top-5 h-[calc(100%+1.25rem)] w-px bg-white/10"
                      />
                    )}
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {note.title}
                      </h3>
                      <time className="text-xs text-slate-500">
                        {note.date}
                      </time>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {note.changes.map((change) => (
                        <li key={change} className="flex gap-2">
                          <span aria-hidden="true" className="text-slate-600">
                            —
                          </span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
