import { useState } from "react";
import Modal from "@mui/material/Modal";
import { Movie, useDeleteMovie } from "../../api/movies";
import { Close } from "../Close";
import { ItemModalContent } from "../ItemModalContent";

export const MovieWatchItem = ({ movie }: { movie: Movie }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteMovieMutation = useDeleteMovie();
  const openModal = () => setIsModalOpen(true);
  const closeModal = (e?: any) => {
    e?.stopPropagation();
    setIsModalOpen(false);
  };

  const handleDeleteMovie = () => {
    closeModal();
    deleteMovieMutation.mutate(movie.firebaseId!);
  };

  return (
    <div onClick={openModal}>
      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w400${movie.poster_path}`
            : "/placeholder.png"
        }
        alt={movie.title}
        className="w-full h-auto rounded"
      />
      <Modal open={isModalOpen} onClose={closeModal}>
        <div className="absolute top-8 mb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none z-10">
          <Close closeAction={closeModal} />
          <ItemModalContent
            title={movie.title}
            overview={movie.overview}
            release_date={movie.release_date}
            background_path={movie.backdrop_path}
            list={[]}
            videos={movie.videos}
            logo={movie.logo}
            handleDelete={handleDeleteMovie}
            handleAllWatch={() => {}}
          />
        </div>
      </Modal>
    </div>
  );
};
