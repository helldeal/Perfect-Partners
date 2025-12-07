import { TVSeason, Movie } from "../../api/models/movies";

export const MediaListIndicator = ({
  list,
}: {
  list: TVSeason[] | Movie[];
}) => {
  if (list.length === 0) return null;
  if ((list[0] as TVSeason).season_number !== undefined) {
    const seasons = list as TVSeason[];
    return (
      <span>
        {seasons.length} Saison{seasons.length > 1 ? "s" : ""}
      </span>
    );
  } else {
    const movies = list as Movie[];
    return <span>{movies.length} Films</span>;
  }
};
