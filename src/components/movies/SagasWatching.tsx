import { MovieSaga, useDeleteMovie } from "../../api/movies";
import { ItemModalContent } from "../ItemModalContent";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";

export const SagaWatchItem = ({ saga }: { saga: MovieSaga }) => {
  const deleteMovieMutation = useDeleteMovie();
  const sagaItem = saga[0].collection;

  const handleDeleteSaga = () => {
    saga.forEach((movie) => {
      deleteMovieMutation.mutate(movie.firebaseId!);
    });
  };

  return (
    <ItemLayout name={sagaItem.name} image={sagaItem.poster_path}>
      <ItemModalContent
        title={sagaItem.name}
        overview={saga[0].overview}
        date={formatYearRange(
          saga
            .map((movie) => movie.release_date)
            .filter((date) => date !== undefined) || []
        )}
        background_path={sagaItem.backdrop_path}
        list={saga}
        videos={saga[0].videos}
        logo={saga[0].logo}
        watch_providers={saga[0].watch_providers}
        handleDelete={handleDeleteSaga}
        handleAllWatch={() => {}}
      />
    </ItemLayout>
  );
};
