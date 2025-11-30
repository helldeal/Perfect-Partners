import { TVShow } from "../../api/models/movies";
import { ItemModalContent } from "../ItemModalContent";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteTVShow } from "../../api/firebase/tvshows";

export const TVShowWatchItem = ({ tvShow }: { tvShow: TVShow }) => {
  const deleteTVShowMutation = useDeleteTVShow();

  const handleDeleteTVShow = () => {
    deleteTVShowMutation.mutate(tvShow.firebaseId!);
  };

  return (
    <ItemLayout name={tvShow.name} image={tvShow.poster_path}>
      <ItemModalContent
        title={tvShow.name}
        overview={tvShow.overview}
        date={formatYearRange(
          tvShow.seasons
            ?.map((season) => season.air_date)
            .filter((date) => date !== undefined) || []
        )}
        background_path={tvShow.backdrop_path}
        list={tvShow.seasons ?? []}
        videos={tvShow.videos ?? []}
        logo={tvShow.logo}
        watch_providers={tvShow.watch_providers ?? []}
        handleDelete={handleDeleteTVShow}
        handleAllWatch={() => {}}
      />
    </ItemLayout>
  );
};
