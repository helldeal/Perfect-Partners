import { Header } from "../components/Header";
import { Modal } from "@mui/material";
import { Close } from "../components/Close";
import { motion, AnimatePresence } from "framer-motion";
import useModalStore from "../store/modalStore";
import { WatchItemModalContent } from "../components/movies/WatchItemModalContent";
import { WatchItemModal } from "../api/models/watchItemModal";
import { GameItemModal } from "../api/models/gameItemModal";
import { GameItemModalContent } from "./games/GameItemModalContent";
import { useEffect, useCallback, useRef } from "react";
import { Footer } from "./Footer";

export const MainLayout = ({
  children,
  navSelected,
}: {
  children: React.ReactNode;
  navSelected: string;
}) => {
  const isModalOpen = useModalStore((state) => state.isModalOpen);
  const closeModal = useModalStore((state) => state.closeModal);
  const payload: WatchItemModal | GameItemModal = useModalStore(
    (state) => state.payload
  );

  const showContent = useModalStore((state) => state.showContent);
  const setShowContent = useModalStore((state) => state.setShowContent);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const exitModal = useCallback(
    (e?: any) => {
      e?.stopPropagation();
      setShowContent(false);
    },
    [setShowContent]
  );

  // Gérer le bouton retour du navigateur pour fermer la modal
  useEffect(() => {
    if (isModalOpen) {
      // Ajouter un état à l'historique quand la modal s'ouvre
      window.history.pushState({ modal: true }, "");

      const handlePopState = (e: PopStateEvent) => {
        if (isModalOpen) {
          e.preventDefault();
          exitModal();
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isModalOpen, exitModal]);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col">
      <Header navSelected={navSelected} />
      {children}
      <Footer />
      <Modal
        open={isModalOpen}
        onClose={exitModal}
        onMouseDown={(event) => {
          if (!modalContentRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
        className="flex justify-center items-start sm:items-center overflow-y-auto sm:overflow-y-scroll p-0 sm:p-4 max-h-screen!"
      >
        <div
          tabIndex={-1}
          className="fixed inset-x-0 top-0 max-h-screen w-full overflow-y-auto outline-none sm:absolute sm:inset-x-auto sm:top-8 sm:left-1/2 sm:max-h-none sm:max-w-5xl sm:-translate-x-1/2 sm:overflow-y-visible sm:pb-8"
        >
          <AnimatePresence
            onExitComplete={() => {
              closeModal();
            }}
          >
            {showContent && (
              <motion.div
                ref={modalContentRef}
                key="modal-animation"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full origin-center outline-none"
              >
                <div className="w-full h-auto bg-app-bg sm:rounded-xl overflow-hidden shadow-lg outline-none relative flex flex-col">
                  <Close closeAction={exitModal} />
                  {payload && "videos" in payload && (
                    <WatchItemModalContent item={payload} />
                  )}
                  {payload && "game" in payload && (
                    <GameItemModalContent item={payload} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
};
