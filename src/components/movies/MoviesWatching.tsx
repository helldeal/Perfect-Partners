import { Movie } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteMovie, useUpdateMovie } from "../../api/firebase/movies";
import { useMovieRecommendationsQuery } from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const MovieWatchItem = ({ movie }: { movie: Movie }) => {
  const deleteMovieMutation = useDeleteMovie();
  const updateMovieMutation = useUpdateMovie();

  const handleDeleteMovie = () => {
    deleteMovieMutation.mutate(movie.firebaseId!);
  };
  const handleWatchItem = () => {
    updateMovieMutation.mutate({
      movieId: movie.firebaseId!,
      updatedData: { watched: true },
    });
  };

  const modalContent: WatchItemModal = {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    date: formatYearRange([movie.release_date]),
    background_path: movie.backdrop_path,
    videos: movie.videos ?? [],
    runtime: movie.runtime,
    logo: movie.logo,
    recomandationsQuery: useMovieRecommendationsQuery,
    watch_providers: movie.watch_providers ?? [],
    handleDelete: handleDeleteMovie,
    handleAllWatch: handleWatchItem,
    allWatched: movie.watched,
  };

  return (
    <ItemLayout
      name={movie.title}
      image={movie.poster_path}
      progress={movie.watched ? 100 : 0}
      payload={modalContent}
    />
  );
};
