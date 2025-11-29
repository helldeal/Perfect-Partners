import { useState } from "react";
import { MovieSaga, useDeleteMovie } from "../../api/movies";
import { Modal } from "@mui/material";
import { Close } from "../Close";
import { ItemModalContent } from "../ItemModalContent";

export const SagaWatchItem = ({ saga }: { saga: MovieSaga }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = (e?: any) => {
    e?.stopPropagation();
    setIsModalOpen(false);
  };
  const deleteMovieMutation = useDeleteMovie();
  const sagaItem = saga[0].collection;

  const handleDeleteSaga = () => {
    closeModal();
    saga.forEach((movie) => {
      deleteMovieMutation.mutate(movie.firebaseId!);
    });
  };

  return (
    <div onClick={openModal}>
      <img
        src={
          sagaItem?.poster_path
            ? `https://image.tmdb.org/t/p/w400${sagaItem.poster_path}`
            : "/placeholder.png"
        }
        alt={sagaItem?.name || "Saga Image"}
        className="w-full h-auto rounded"
      />
      <Modal open={isModalOpen} onClose={closeModal}>
        <div className="absolute top-8 mb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none z-10">
          <Close closeAction={closeModal} />
          <ItemModalContent
            title={sagaItem.name}
            overview={saga[0].overview}
            release_date={saga[0].release_date}
            background_path={sagaItem.backdrop_path}
            list={[]}
            videos={saga[0].videos}
            logo={saga[0].logo}
            handleDelete={handleDeleteSaga}
            handleAllWatch={() => {}}
          />
        </div>
      </Modal>
    </div>
  );
};
