import { TVShow } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteTVShow, useUpdateTVShow } from "../../api/firebase/tvshows";
import {
  useTVCreditsQuery,
  useTVDetailsQuery,
  useTVImagesQuery,
  useTVRecommendationsQuery,
  useTVVideosQuery,
  useTVWatchProvidersQuery,
} from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const TVShowWatchItem = ({
  tvShow,
  inWishlist = true,
  onAdd,
}: {
  tvShow: TVShow;
  inWishlist?: boolean;
  onAdd?: () => void;
}) => {
  const deleteTVShowMutation = useDeleteTVShow();
  const updateTVShowMutation = useUpdateTVShow();

  const handleDeleteTVShow = () => {
    deleteTVShowMutation.mutate(tvShow.id.toString());
  };
  const handleAllWatch = () => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      progress: { watched: true },
    });
  };

  const handleWatchItem = (id: string) => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      progress: { episodeId: Number(id), watched: true },
    });
  };

  const handleUnwatchItem = (id: string) => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      progress: { episodeId: Number(id), watched: false },
    });
  };

  const progress =
    ((tvShow.seasons
      ?.flatMap((season) => season.episodes ?? [])
      .filter((episode) => episode.watched).length ?? 0) /
      (tvShow.seasons?.flatMap((season) => season.episodes ?? []).length ??
        1)) *
    100;
  const hasRecentSeason =
    !!tvShow.newSeasonAt &&
    Date.now() - tvShow.newSeasonAt < 14 * 24 * 60 * 60 * 1000;

  const modalContent: WatchItemModal = {
    id: tvShow.id,
    title: tvShow.name,
    overview: tvShow.overview,
    date: formatYearRange(
      tvShow.seasons
        ?.map((season) => season.air_date)
        .filter((date) => date !== undefined) || []
    ),
    background_path: tvShow.backdrop_path,
    list: tvShow.seasons,
    videos: tvShow.videos ?? [],
    logo: tvShow.logo,
    watch_providers: tvShow.watch_providers ?? [],
    recommendationsQuery: useTVRecommendationsQuery,
    watchProvidersQuery: useTVWatchProvidersQuery,
    videosQuery: useTVVideosQuery,
    imagesQuery: useTVImagesQuery,
    detailsQuery: useTVDetailsQuery,
    creditsQuery: useTVCreditsQuery,
    handleDelete: handleDeleteTVShow,
    handleAllWatch: handleAllWatch,
    handleWatchItem: handleWatchItem,
    handleUnwatchItem: handleUnwatchItem,
    allWatched: tvShow.seasons?.every((season) =>
      season.episodes?.every((episode) => episode.watched) ? true : false
    ),
    wishListed: inWishlist,
    newSeasonAt: tvShow.newSeasonAt,
  };

  return (
    <ItemLayout
      name={tvShow.name}
      image={`https://image.tmdb.org/t/p/w400${tvShow.poster_path}`}
      progress={progress}
      payload={modalContent}
      onAdd={onAdd}
      inList={inWishlist}
      specialTag={hasRecentSeason ? "Nouvelle saison" : undefined}
    />
  );
};
