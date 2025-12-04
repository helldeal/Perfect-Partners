import { Movie } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteMovie, useUpdateMovie } from "../../api/firebase/movies";
import {
  useMovieDetailsQuery,
  useMovieImagesQuery,
  useMovieRecommendationsQuery,
  useMovieVideosQuery,
  useMovieWatchProvidersQuery,
} from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const MovieWatchItem = ({
  movie,
  inWishlist = true,
}: {
  movie: Movie;
  inWishlist?: boolean;
}) => {
  const deleteMovieMutation = useDeleteMovie();
  const updateMovieMutation = useUpdateMovie();

  const handleDeleteMovie = () => {
    deleteMovieMutation.mutate(movie.id.toString());
  };
  const handleWatchItem = () => {
    updateMovieMutation.mutate({
      movieId: movie.id.toString(),
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
    watchProvidersQuery: useMovieWatchProvidersQuery,
    videosQuery: useMovieVideosQuery,
    imagesQuery: useMovieImagesQuery,
    detailsQuery: useMovieDetailsQuery,
    watch_providers: movie.watch_providers ?? [],
    handleDelete: handleDeleteMovie,
    handleAllWatch: handleWatchItem,
    allWatched: movie.watched,
    wishListed: inWishlist,
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
