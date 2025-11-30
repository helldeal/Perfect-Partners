import { Movie } from "../../api/models/movies";
import { ItemModalContent } from "../ItemModalContent";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteMovie } from "../../api/firebase/movies";

export const MovieWatchItem = ({ movie }: { movie: Movie }) => {
  const deleteMovieMutation = useDeleteMovie();

  const handleDeleteMovie = () => {
    deleteMovieMutation.mutate(movie.firebaseId!);
  };

  return (
    <ItemLayout name={movie.title} image={movie.poster_path}>
      <ItemModalContent
        title={movie.title}
        overview={movie.overview}
        date={formatYearRange([movie.release_date])}
        background_path={movie.backdrop_path}
        videos={movie.videos ?? []}
        runtime={movie.runtime}
        logo={movie.logo}
        watch_providers={movie.watch_providers ?? []}
        handleDelete={handleDeleteMovie}
        handleAllWatch={() => {}}
      />
    </ItemLayout>
  );
};
