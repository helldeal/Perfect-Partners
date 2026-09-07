import { Movie, TVSeason } from "../../api/models/movies";
import { MovieCollection } from "./MovieCollection";
import { TVShowSeasons } from "./TVShowSeasons";

type MediaListMappingProps = {
  list: TVSeason[] | Movie[];
  handleWatchItem?: (id: string, list?: TVSeason[]) => void;
  handleUnwatchItem?: (id: string, list?: TVSeason[]) => void;
};

export const MediaListMapping = ({
  list,
  handleWatchItem,
  handleUnwatchItem,
}: MediaListMappingProps) => {
  if (list.length === 0) return null;

  if ((list[0] as TVSeason).season_number !== undefined) {
    return (
      <TVShowSeasons
        seasons={list as TVSeason[]}
        handleWatchItem={handleWatchItem}
        handleUnwatchItem={handleUnwatchItem}
      />
    );
  }

  return (
    <MovieCollection
      movies={list as Movie[]}
      handleWatchItem={handleWatchItem}
      handleUnwatchItem={handleUnwatchItem}
    />
  );
};
