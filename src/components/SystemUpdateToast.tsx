import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export const SystemUpdateToast = () => {
  const [pendingUpdates, setPendingUpdates] = useState(0);

  useEffect(() => {
    const handleStart = () => setPendingUpdates((count) => count + 1);
    const handleFinish = () =>
      setPendingUpdates((count) => Math.max(0, count - 1));

    window.addEventListener("system-update-started", handleStart);
    window.addEventListener("system-update-finished", handleFinish);
    return () => {
      window.removeEventListener("system-update-started", handleStart);
      window.removeEventListener("system-update-finished", handleFinish);
    };
  }, []);

  return (
    <AnimatePresence>
      {pendingUpdates > 0 && (
        <motion.div
          role="status"
          aria-label="Actualisation des données en cours"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed right-3 top-3 z-[1400] flex h-11 w-11 items-center justify-center rounded-full border border-app-primary/30 bg-app-surface/95 text-app-primary shadow-xl backdrop-blur-md sm:right-5 sm:top-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
