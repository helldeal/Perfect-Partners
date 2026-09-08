import { useEffect, useMemo } from "react";
import { useSearchMultiQuery } from "../api/tmdb";
import { useDebounce } from "../utils/useDebounce";
import {
  MediaItem,
  Movie,
  MovieSaga,
  TVSeason,
  TVShow,
} from "../api/models/movies";
import {
  getMediaListFromMediaItems,
  isMovie,
  isMovieSaga,
} from "../utils/movies";
import { MovieWatchItem } from "../components/movies/MoviesWatching";
import { TVShowWatchItem } from "../components/movies/TVShowsWatching";
import { useFirebaseMovies } from "../api/firebase/movies";
import { useFirebaseTVShows } from "../api/firebase/tvshows";
import useModalStore from "../store/modalStore";
import { WatchItemModal } from "../api/models/watchItemModal";
import { MediaItemSearch } from "../components/movies/MediaItemSearch";
import useSearchStore from "../store/searchStore";
import { MainLayout } from "../components/MainLayout";
import { MovieSagaWatchItem } from "../components/movies/MovieSagasWatching";
import {
  refreshMediaOnOpen,
  useTVShowSeasonUpdates,
} from "../hooks/useSystemUpdates";
import { formatYearRange } from "../utils/dates";

const payloadValueChanged = (current: unknown, next: unknown) =>
  current !== next &&
  (typeof current !== "object" ||
    typeof next !== "object" ||
    JSON.stringify(current) !== JSON.stringify(next));

export const MoviesPage = () => {
  const searchTerm = useSearchStore((state) => state.query);
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchMultiQuery = useSearchMultiQuery(debouncedQuery);
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const payload: WatchItemModal = useModalStore((state) => state.payload);
  const isModalOpen = useModalStore((state) => state.isModalOpen);
  const updatePayload = useModalStore((state) => state.updatePayload);

  const searchList = debouncedQuery.length > 0 ? searchMultiQuery.data : null;

  const mediaItems = useMemo(
    () => [
      ...(firebaseMoviesQuery.data || []),
      ...(firebaseTVShowsQuery.data || []),
    ],
    [firebaseMoviesQuery.data, firebaseTVShowsQuery.data]
  );
  useTVShowSeasonUpdates(firebaseTVShowsQuery.data ?? []);

  const { planToWatch, watching, completed } = useMemo(
    () => getMediaListFromMediaItems(mediaItems),
    [mediaItems]
  );

  useEffect(() => {
    if (!isModalOpen || !payload || payload.id === null) return;

    const itemInList = mediaItems.find((item) => {
      return item.id === payload.id;
    });

    if (itemInList) void refreshMediaOnOpen(itemInList);

    let newPayload: Partial<WatchItemModal> = {};

    if (!itemInList) {
      if (payload.wishListed)
        newPayload = {
          list: (payload.list as TVSeason[])?.some(
            (e) => (e.episodes ?? []).length > 0
          )
            ? (payload.list as TVSeason[]).map((e) => ({
                ...e,
                episodes: e.episodes?.map((episode) => ({
                  ...episode,
                  watched: false,
                })),
              }))
            : undefined,
          allWatched: false,
          wishListed: false,
        };
    } else if (itemInList && !payload.wishListed) {
      newPayload = { wishListed: true };
    } else if ("watched" in itemInList) {
      const movie = itemInList as Movie;
      const moviePayload = {
        title: movie.title,
        overview: movie.overview,
        date: formatYearRange([movie.release_date]),
        background_path: movie.backdrop_path,
        videos: movie.videos ?? [],
        runtime: movie.runtime,
        logo: movie.logo,
        watch_providers: movie.watch_providers ?? [],
        collectionId: movie.collection?.id.toString(),
        allWatched: movie.watched,
      };
      if (
        Object.entries(moviePayload).some(
          ([key, value]) =>
            payloadValueChanged(
              payload[key as keyof WatchItemModal],
              value
            )
        )
      ) {
        newPayload = moviePayload;
      }
    } else {
      const tvShow = itemInList as TVShow;
      const allWatched = tvShow.seasons?.every((season) =>
        season.episodes?.every((episode) => episode.watched)
      );
      const tvPayload = {
        title: tvShow.name,
        overview: tvShow.overview,
        date: formatYearRange(
          tvShow.seasons
            ?.map((season) => season.air_date)
            .filter((date) => date !== undefined) ?? []
        ),
        background_path: tvShow.backdrop_path,
        list: tvShow.seasons,
        videos: tvShow.videos ?? [],
        logo: tvShow.logo,
        watch_providers: tvShow.watch_providers ?? [],
        allWatched,
        newSeasonAt: tvShow.newSeasonAt,
      };
      if (
        Object.entries(tvPayload).some(
          ([key, value]) =>
            payloadValueChanged(
              payload[key as keyof WatchItemModal],
              value
            )
        )
      ) {
        newPayload = tvPayload;
      }
    }

    if (Object.keys(newPayload).length > 0) {
      updatePayload(newPayload);
    }
  }, [isModalOpen, mediaItems, payload, updatePayload]);

  return (
    <MainLayout navSelected="movies">
      <div className=" flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:p-12">
        {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
          searchMultiQuery.isLoading ? (
            <p>Chargement...</p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-12 items-stretch">
              {searchList.map((item: MediaItem) => (
                <MediaItemSearch
                  key={item.id}
                  item={
                    mediaItems.find((mediaItem) => mediaItem.id === item.id) ??
                    item
                  }
                />
              ))}
            </div>
          ) : (
            <p>Aucun résultat trouvé.</p>
          )
        ) : (
          <>
            {watching.length > 0 && (
              <>
                <h2 className="text-lg sm:text-xl md:text-2xl">Continuer</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-12 items-stretch">
                  {watching.map((itemList, index) => (
                    <div key={index}>
                      <WatchItemMapping itemList={itemList} />
                    </div>
                  ))}
                </div>
              </>
            )}
            {planToWatch.length > 0 && (
              <>
                <h2 className="text-lg sm:text-xl md:text-2xl">À regarder</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-12 items-stretch">
                  {planToWatch.map((itemList, index) => (
                    <WatchItemMapping key={index} itemList={itemList} />
                  ))}
                </div>
              </>
            )}
            {completed.length > 0 && (
              <>
                <h2 className="text-lg sm:text-xl md:text-2xl">Terminés</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-12 items-stretch">
                  {completed.map((itemList) => (
                    <WatchItemMapping itemList={itemList} key={itemList.id} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

const WatchItemMapping = ({
  itemList,
}: {
  itemList: MediaItem | MovieSaga;
}) => {
  return (
    <div className="w-full h-full transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      {isMovieSaga(itemList) ? (
        <MovieSagaWatchItem movieSaga={itemList} />
      ) : isMovie(itemList) ? (
        <MovieWatchItem key={itemList.id} movie={itemList} />
      ) : (
        <TVShowWatchItem key={itemList.id} tvShow={itemList} />
      )}
    </div>
  );
};
