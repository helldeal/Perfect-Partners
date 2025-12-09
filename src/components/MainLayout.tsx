import { Header } from "../components/Header";
import { Modal } from "@mui/material";
import { Close } from "../components/Close";
import { motion, AnimatePresence } from "framer-motion";
import useModalStore from "../store/modalStore";
import { WatchItemModalContent } from "../components/movies/WatchItemModalContent";
import { WatchItemModal } from "../api/models/watchItemModal";
import { GameItemModal } from "../api/models/gameItemModal";
import { GameItemModalContent } from "./games/GameItemModalContent";

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

  const exitModal = (e?: any) => {
    e?.stopPropagation();
    setShowContent(false);
  };

  return (
    <div className="min-h-screen bg-[#181818] text-slate-100 flex flex-col">
      <Header navSelected={navSelected} />
      {children}
      <Modal
        open={isModalOpen}
        onClose={exitModal}
        className="flex justify-center overflow-y-scroll"
      >
        <AnimatePresence
          onExitComplete={() => {
            closeModal();
          }}
        >
          {showContent && (
            <motion.div
              key="modal-animation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute top-8 pb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full outline-none z-10"
            >
              <div className="w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none relative">
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
      </Modal>
    </div>
  );
};
