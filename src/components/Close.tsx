import { CloseIcon } from "../assets/svgs";

export const Close = ({ closeAction }: { closeAction: () => void }) => (
  <button
    className="absolute top-4 right-4 text-white bg-[#181818] rounded-full p-1 cursor-pointer z-9999"
    onClick={closeAction}
  >
    <CloseIcon />
  </button>
);
