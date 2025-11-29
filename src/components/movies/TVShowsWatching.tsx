import { useState } from "react";
import { TVShow, useDeleteTVShow } from "../../api/movies";
import { Modal } from "@mui/material";
import { Close } from "../Close";
import { ItemModalContent } from "../ItemModalContent";

export const TVShowWatchItem = ({ tvShow }: { tvShow: TVShow }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteTVShowMutation = useDeleteTVShow();
  const openModal = () => setIsModalOpen(true);
  const closeModal = (e?: any) => {
    e?.stopPropagation();
    setIsModalOpen(false);
  };

  const handleDeleteTVShow = () => {
    closeModal();
    deleteTVShowMutation.mutate(tvShow.firebaseId!);
  };

  return (
    <div onClick={openModal}>
      <img
        src={
          tvShow.poster_path
            ? `https://image.tmdb.org/t/p/w400${tvShow.poster_path}`
            : "/placeholder.png"
        }
        alt={tvShow.name}
        className="w-full h-auto rounded"
      />
      <Modal open={isModalOpen} onClose={closeModal}>
        <div className="absolute top-8 mb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none z-10">
          <Close closeAction={closeModal} />
          <ItemModalContent
            title={tvShow.name}
            overview={tvShow.overview}
            release_date={tvShow.first_air_date}
            background_path={tvShow.backdrop_path}
            list={tvShow.seasons ?? []}
            videos={tvShow.videos}
            logo={tvShow.logo}
            handleDelete={handleDeleteTVShow}
            handleAllWatch={() => {}}
          />
        </div>
      </Modal>
    </div>
  );
};
