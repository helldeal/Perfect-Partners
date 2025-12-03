import { MovieSaga } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteMovie, useUpdateMovie } from "../../api/firebase/movies";
import { useMovieRecommendationsQuery } from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const SagaWatchItem = ({ saga }: { saga: MovieSaga }) => {
  const deleteMovieMutation = useDeleteMovie();
  const updateMovieMutation = useUpdateMovie();
  const sagaItem = saga[0].collection!;

  const handleDeleteSaga = () => {
    saga.forEach((movie) => {
      deleteMovieMutation.mutate(movie.firebaseId!);
    });
  };

  const handleAllWatch = () => {
    saga.forEach((movie) => {
      updateMovieMutation.mutate({
        movieId: movie.firebaseId!,
        updatedData: { watched: true },
      });
    });
  };

  const handleWatchItem = (id: string) => {
    updateMovieMutation.mutate({
      movieId: id,
      updatedData: { watched: true },
    });
  };

  const progress =
    (saga.filter((movie) => movie.watched).length / saga.length) * 100;

  const modalContent: WatchItemModal = {
    id: saga[0].id,
    title: sagaItem.name,
    overview: saga[0].overview,
    date: formatYearRange(
      saga
        .map((movie) => movie.release_date)
        .filter((date) => date !== undefined) || []
    ),
    background_path: sagaItem.backdrop_path,
    list: saga,
    videos: saga[0].videos ?? [],
    logo: saga[0].logo,
    watch_providers: saga[0].watch_providers ?? [],
    recomandationsQuery: useMovieRecommendationsQuery,
    handleDelete: handleDeleteSaga,
    handleAllWatch: handleAllWatch,
    handleWatchItem: handleWatchItem,
    allWatched: saga.every((movie) => movie.watched ?? false),
  };

  return (
    <ItemLayout
      name={sagaItem.name}
      image={sagaItem.poster_path}
      progress={progress}
      payload={modalContent}
    />
  );
};
