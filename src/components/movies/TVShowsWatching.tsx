import { TVShow } from "../../api/models/movies";
import { ItemLayout } from "../ItemLayout";
import { formatYearRange } from "../../utils/dates";
import { useDeleteTVShow, useUpdateTVShow } from "../../api/firebase/tvshows";
import { useTVRecommendationsQuery } from "../../api/tmdb";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const TVShowWatchItem = ({ tvShow }: { tvShow: TVShow }) => {
  const deleteTVShowMutation = useDeleteTVShow();
  const updateTVShowMutation = useUpdateTVShow();

  const handleDeleteTVShow = () => {
    deleteTVShowMutation.mutate(tvShow.firebaseId!);
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
      tvShowId: tvShow.firebaseId!,
      updatedData: { seasons: updatedSeasons },
    });
  };

  const handleWatchItem = (id: string) => {
    updateTVShowMutation.mutate({
      tvShowId: tvShow.firebaseId!,
      updatedData: {
        ...tvShow,
        seasons: tvShow.seasons?.map((season) => ({
          ...season,
          episodes: season.episodes?.map((episode) =>
            episode.id === Number(id) ? { ...episode, watched: true } : episode
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
    list: tvShow.seasons ?? [],
    videos: tvShow.videos ?? [],
    logo: tvShow.logo,
    watch_providers: tvShow.watch_providers ?? [],
    recomandationsQuery: useTVRecommendationsQuery,
    handleDelete: handleDeleteTVShow,
    handleAllWatch: handleAllWatch,
    handleWatchItem: handleWatchItem,
    allWatched: tvShow.seasons?.every((season) =>
      season.episodes?.every((episode) => episode.watched) ? true : false
    ),
  };

  return (
    <ItemLayout
      name={tvShow.name}
      image={tvShow.poster_path}
      progress={progress}
      payload={modalContent}
    />
  );
};
