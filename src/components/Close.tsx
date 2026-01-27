import { CloseIcon } from "../assets/svgs";

export const Close = ({ closeAction }: { closeAction: () => void }) => (
  <button
    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white bg-[#181818] rounded-full p-1.5 sm:p-2 cursor-pointer z-50 hover:bg-gray-700 transition-colors"
    onClick={closeAction}
    aria-label="Fermer la modale"
  >
    <CloseIcon />
  </button>
);
