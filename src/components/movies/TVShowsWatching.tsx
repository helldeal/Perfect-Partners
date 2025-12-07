import { TVSeason, TVShow } from "../../api/models/movies";
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
    const updatedSeasons = tvShow.seasons?.map((season) => ({
      ...season,
      episodes: season.episodes?.map((episode) => ({
        ...episode,
        watched: true,
      })),
    }));

    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      updatedData: { seasons: updatedSeasons },
    });
  };

  const handleWatchItem = (id: string, list: TVSeason[]) => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      updatedData: {
        ...tvShow,
        seasons: list.map((season) => ({
          ...season,
          episodes: season.episodes?.map((episode) =>
            episode.id === Number(id) ? { ...episode, watched: true } : episode
          ),
        })),
      },
    });
  };

  const handleUnwatchItem = (id: string, list: TVSeason[]) => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.id.toString(),
      updatedData: {
        ...tvShow,
        seasons: list.map((season) => ({
          ...season,
          episodes: season.episodes?.map((episode) =>
            episode.id === Number(id) ? { ...episode, watched: false } : episode
          ),
        })),
      },
    });
  };

  const progress =
    ((tvShow.seasons
      ?.flatMap((season) => season.episodes ?? [])
      .filter((episode) => episode.watched).length ?? 0) /
      (tvShow.seasons?.flatMap((season) => season.episodes ?? []).length ??
        1)) *
    100;

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
  };

  return (
    <ItemLayout
      name={tvShow.name}
      image={`https://image.tmdb.org/t/p/w400${tvShow.poster_path}`}
      progress={progress}
      payload={modalContent}
      onAdd={onAdd}
      inList={inWishlist}
    />
  );
};
