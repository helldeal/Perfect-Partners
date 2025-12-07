import { MovieSaga } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteMovie, useUpdateMovie } from "../../api/firebase/movies";
import {
  useCollectionDetailsQuery,
  useMovieCreditsQuery,
  useMovieDetailsQuery,
  useMovieImagesQuery,
  useMovieRecommendationsQuery,
  useMovieVideosQuery,
  useMovieWatchProvidersQuery,
} from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const MovieSagaWatchItem = ({
  movieSaga,
  inWishlist = true,
  onAdd,
}: {
  movieSaga: MovieSaga;
  inWishlist?: boolean;
  onAdd?: () => void;
}) => {
  const deleteMovieMutation = useDeleteMovie();
  const updateMovieMutation = useUpdateMovie();

  const currentMovie = movieSaga.movies.find((movie) => !movie.watched);
  const movie = currentMovie || movieSaga.movies[0];

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
    recommendationsQuery: useMovieRecommendationsQuery,
    collectionQuery: useCollectionDetailsQuery,
    collectionId: movie.collection?.id.toString(),
    watchProvidersQuery: useMovieWatchProvidersQuery,
    videosQuery: useMovieVideosQuery,
    imagesQuery: useMovieImagesQuery,
    detailsQuery: useMovieDetailsQuery,
    creditsQuery: useMovieCreditsQuery,
    watch_providers: movie.watch_providers ?? [],
    handleDelete: handleDeleteMovie,
    handleAllWatch: handleWatchItem,
    allWatched: movie.watched,
    wishListed: inWishlist,
  };

  const progress =
    (movieSaga.movies.filter((m) => m.watched).length /
      movieSaga.movies.length) *
    100;

  return (
    <ItemLayout
      name={movieSaga.name}
      image={`https://image.tmdb.org/t/p/w400${movieSaga.poster_path}`}
      progress={progress}
      payload={modalContent}
      onAdd={onAdd}
      inList={inWishlist}
    />
  );
};
