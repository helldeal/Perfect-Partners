import { useMemo, useState } from "react";
import { useSearchMultiQuery } from "../api/tmdb";
import { Header } from "../components/Header";
import { useDebounce } from "../utils/useDebounce";
import { MediaItem, Movie, MovieSaga, TVShow } from "../api/models/movies";
import { getMediaListFromMediaItems, isMovie, isTVShow } from "../utils/movies";
import SearchItem from "../components/search/SearchItem";
import { MovieWatchItem } from "../components/movies/MoviesWatching";
import { SagaWatchItem } from "../components/movies/SagasWatching";
import { TVShowWatchItem } from "../components/movies/TVShowsWatching";
import { useAddMovie, useFirebaseMovies } from "../api/firebase/movies";
import { useAddTVShow, useFirebaseTVShows } from "../api/firebase/tvshows";
import { Modal } from "@mui/material";
import { Close } from "../components/Close";
import { motion, AnimatePresence } from "framer-motion";
import useModalStore from "../store/modalStore";
import { WatchItemModalContent } from "../components/movies/WatchItemModalContent";

export const MoviesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchMultiQuery = useSearchMultiQuery(debouncedQuery);
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const isModalOpen = useModalStore((state) => state.isModalOpen);
  const closeModal = useModalStore((state) => state.closeModal);
  const payload = useModalStore((state) => state.payload);

  const showContent = useModalStore((state) => state.showContent);
  const setShowContent = useModalStore((state) => state.setShowContent);

  const exitModal = (e?: any) => {
    e?.stopPropagation();
    setShowContent(false);
  };

  const searchList = debouncedQuery.length > 0 ? searchMultiQuery.data : null;

  const handleAddToList = (item: MediaItem) => {
    if (isMovie(item)) {
      addMovieMutation.mutate(item);
    } else if (isTVShow(item)) {
      addTVShowMutation.mutate(item);
    }
  };

  const mediaList = useMemo(
    () => [
      ...(firebaseMoviesQuery.data || []),
      ...(firebaseTVShowsQuery.data || []),
    ],
    [firebaseMoviesQuery.data, firebaseTVShowsQuery.data]
  );

  const { planToWatch, watching, completed } = useMemo(
    () => getMediaListFromMediaItems(mediaList),
    [mediaList]
  );

  return (
    <div className="min-h-screen bg-[#181818] text-slate-100">
      <Header
        navSelected="movies"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <div className=" flex flex-col gap-6 p-12">
        {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
          searchMultiQuery.isLoading ? (
            <p>Loading...</p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-6 gap-12 items-stretch">
              {searchList.map((item: any) => (
                <SearchItem
                  key={item.id}
                  id={item.id}
                  image={item.poster_path}
                  title={item.title || item.name}
                  release_date={item.release_date || item.first_air_date}
                  overview={item.overview}
                  itemList={mediaList}
                  handleAddToList={handleAddToList}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <p>No results found.</p>
          )
        ) : (
          <>
            {watching.length > 0 && (
              <>
                <h2 className="text-2xl">Continue</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
                  {watching.map((itemList, index) => (
                    <WatchItemMapping key={index} itemList={itemList} />
                  ))}
                </div>
              </>
            )}
            {planToWatch.length > 0 && (
              <>
                <h2 className="text-2xl">Plan to Watch</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
                  {planToWatch.map((itemList, index) => (
                    <WatchItemMapping key={index} itemList={itemList} />
                  ))}
                </div>
              </>
            )}
            {completed.length > 0 && (
              <>
                <h2 className="text-2xl">Completed</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
                  {completed.map((itemList, index) => (
                    <WatchItemMapping key={index} itemList={itemList} />
                  ))}
                </div>
              </>
            )}
            <Modal
              open={isModalOpen}
              onClose={closeModal}
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
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute top-8 pb-8 left-1/2 transform -translate-x-1/2 max-w-5xl w-full outline-none z-10"
                  >
                    <div className="w-full bg-[#181818] rounded-xl overflow-hidden shadow-lg outline-none relative">
                      <Close closeAction={exitModal} />
                      {payload && <WatchItemModalContent item={payload} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

const WatchItemMapping = ({
  itemList,
}: {
  itemList: Movie | TVShow | MovieSaga;
}) => {
  return (
    <div className="transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      {Array.isArray(itemList) && itemList[0].collection ? (
        <SagaWatchItem
          key={(itemList as MovieSaga)[0].collection?.id}
          saga={itemList as MovieSaga}
        />
      ) : isMovie(itemList as MediaItem) ? (
        <MovieWatchItem
          key={(itemList as Movie).id}
          movie={itemList as Movie}
        />
      ) : (
        <TVShowWatchItem
          key={(itemList as TVShow).id}
          tvShow={itemList as TVShow}
        />
      )}
    </div>
  );
};
