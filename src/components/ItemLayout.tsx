import useModalStore from "../store/modalStore";
import { WatchProgress } from "./movies/WatchProgress";

export const ItemLayout = ({
  name,
  image,
  progress,
  payload,
}: {
  name: string;
  image: string;
  progress?: number;
  payload: any;
}) => {
  const openModal = useModalStore((state) => state.openModal);
  const setShowContent = useModalStore((state) => state.setShowContent);

  const openModalHandler = () => {
    openModal(payload);
    setShowContent(true);
  };
  return (
    <div className="w-full h-full" onClick={openModalHandler}>
      <div className="w-full h-full relative">
        <img
          src={
            image
              ? `https://image.tmdb.org/t/p/w400${image}`
              : "/placeholder.png"
          }
          alt={name}
          className="w-full h-full rounded object-cover"
        />
        {!!progress && <WatchProgress progress={progress} />}
      </div>
    </div>
  );
};
