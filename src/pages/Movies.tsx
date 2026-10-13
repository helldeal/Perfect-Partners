import { LibrarySection } from "../components/LibrarySection";
import { CardGridSkeleton } from "../components/Skeleton";
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

export const MoviesPage = () => {
  const searchTerm = useSearchStore((state) => state.query);
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchMultiQuery = useSearchMultiQuery(debouncedQuery);
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const payload: WatchItemModal = useModalStore((state) => state.payload);
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
    if (!payload || payload.id === null) return;

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
      const allWatched = (itemInList as Movie).watched;
      if (payload.allWatched !== allWatched) {
        newPayload = { allWatched };
      }
    } else {
      const allWatched = (itemInList as TVShow).seasons?.every((season) =>
        season.episodes?.every((episode) => episode.watched)
      );
      if (
        payload.allWatched !== allWatched ||
        payload.list !== (itemInList as TVShow).seasons ||
        payload.newSeasonAt !== (itemInList as TVShow).newSeasonAt
      ) {
        newPayload = {
          list: (itemInList as TVShow).seasons,
          allWatched,
          newSeasonAt: (itemInList as TVShow).newSeasonAt,
        };
      }
    }

    if (Object.keys(newPayload).length > 0) {
      updatePayload(newPayload);
    }
  }, [mediaItems, payload, updatePayload]);

  return (
    <MainLayout navSelected="movies">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-10 p-4 sm:gap-12 sm:p-6 md:p-8 lg:p-12">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-app-primary">Votre bibliothèque partagée</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{searchTerm ? "Recherche" : "Films et séries"}</h1>
          <p className="text-sm text-app-muted sm:text-base">{searchTerm ? `Résultats pour « ${searchTerm} »` : "Vos prochaines séances, vos séries en cours et vos souvenirs de cinéma."}</p>
        </header>
        {firebaseMoviesQuery.isLoading || firebaseTVShowsQuery.isLoading ? (
          <>
            <LibrarySection title="Continuer" loading />
            <LibrarySection title="À regarder" loading />
            <LibrarySection title="Terminés" loading />
          </>
        ) : searchTerm.length > 0 ? (
          searchTerm !== debouncedQuery || searchMultiQuery.isLoading ? (
            <CardGridSkeleton />
          ) : searchMultiQuery.isError ? (
            <p role="alert">Impossible de charger les résultats. <button type="button" className="text-app-primary underline" onClick={() => void searchMultiQuery.refetch()}>Réessayer</button></p>
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
        ) : (firebaseMoviesQuery.isError || firebaseTVShowsQuery.isError) ? (
          <p role="alert">Impossible de charger la bibliothèque. <button type="button" className="text-app-primary underline" onClick={() => { void firebaseMoviesQuery.refetch(); void firebaseTVShowsQuery.refetch(); }}>Réessayer</button></p>
        ) : (mediaItems).length === 0 ? (
          <p className="text-app-muted">Votre bibliothèque est vide. Recherchez un film ou une série pour commencer.</p>
        ) : (
          <>
            {watching.length > 0 && (
              <LibrarySection title="Continuer" count={watching.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {watching.map((itemList) => (
                    <WatchItemMapping key={itemList.id} itemList={itemList} />
                  ))}
                </div>
              </LibrarySection>
            )}
            {planToWatch.length > 0 && (
              <LibrarySection title="À regarder" count={planToWatch.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {planToWatch.map((itemList) => (
                    <WatchItemMapping key={itemList.id} itemList={itemList} />
                  ))}
                </div>
              </LibrarySection>
            )}
            {completed.length > 0 && (
              <LibrarySection title="Terminés" count={completed.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {completed.map((itemList) => (
                    <WatchItemMapping key={itemList.id} itemList={itemList} />
                  ))}
                </div>
              </LibrarySection>
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
