import { useState } from "react";
import { Modal } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Close } from "./Close";

export const ItemLayout = ({
  name,
  image,
  children,
}: {
  name: string;
  image: string;
  children: React.ReactNode;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
    setShowContent(true);
  };
  const closeModal = (e?: any) => {
    e?.stopPropagation();
    setShowContent(false);
  };

  return (
    <div className="w-full h-full" onClick={openModal}>
      <img
        src={
          image ? `https://image.tmdb.org/t/p/w400${image}` : "/placeholder.png"
        }
        alt={name}
        className="w-full h-full rounded object-cover"
      />
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        className="flex justify-center overflow-y-scroll"
      >
        <AnimatePresence
          onExitComplete={() => {
            setIsModalOpen(false);
          }}
        >
          {showContent && (
            <motion.div
              key="modal-animation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute top-8 pb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full outline-none z-10"
            >
              <div className="w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none relative">
                <Close closeAction={closeModal} />
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
};
