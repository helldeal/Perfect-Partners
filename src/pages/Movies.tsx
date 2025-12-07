import { useEffect, useMemo } from "react";
import { useSearchMultiQuery } from "../api/tmdb";
import { useDebounce } from "../utils/useDebounce";
import {
  MediaItem,
  MediaList,
  Movie,
  TVSeason,
  TVShow,
} from "../api/models/movies";
import { getMediaListFromMediaItems, isMovie } from "../utils/movies";
import { MovieWatchItem } from "../components/movies/MoviesWatching";
import { TVShowWatchItem } from "../components/movies/TVShowsWatching";
import { useFirebaseMovies } from "../api/firebase/movies";
import { useFirebaseTVShows } from "../api/firebase/tvshows";
import useModalStore from "../store/modalStore";
import { WatchItemModal } from "../api/models/watchItemModal";
import { MediaItemSearch } from "../components/movies/MediaItemSearch";
import useSearchStore from "../store/searchStore";
import { MainLayout } from "../components/MainLayout";

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

  const { planToWatch, watching, completed } = useMemo(
    () => getMediaListFromMediaItems(mediaItems),
    [mediaItems]
  );

  const mediaList: MediaList = useMemo(
    () => planToWatch.concat(watching).concat(completed),
    [planToWatch, watching, completed]
  );

  useEffect(() => {
    if (!payload || payload.id == null) return;

    const itemInList = mediaList.find((item) => {
      return item.id === payload.id;
    });

    let newPayload: Partial<WatchItemModal> = {};

    if (!itemInList) {
      if (payload.wishListed)
        newPayload = {
          list: (payload.list as TVSeason[])?.some((e) => e.episodes.length > 0)
            ? (payload.list as TVSeason[]).map((e) => ({
                ...e,
                episodes: e.episodes.map((episode) => ({
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
        payload.list !== (itemInList as TVShow).seasons
      ) {
        newPayload = { list: (itemInList as TVShow).seasons, allWatched };
      }
    }

    if (Object.keys(newPayload).length > 0) {
      updatePayload(newPayload);
    }
  }, [mediaList, payload, updatePayload]);

  return (
    <MainLayout navSelected="movies">
      <div className=" flex flex-col gap-6 p-12">
        {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
          searchMultiQuery.isLoading ? (
            <p>Loading...</p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-6 gap-12 items-stretch">
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
            <p>No results found.</p>
          )
        ) : (
          <>
            {watching.length > 0 && (
              <>
                <h2 className="text-2xl">Continue</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
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
                <h2 className="text-2xl">Plan to Watch</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
                  {planToWatch.map((itemList, index) => (
                    <WatchItemMapping key={index} itemList={itemList} />
                  ))}
                </div>
              </>
            )}
            {completed.length > 0 && (
              <>
                <h2 className="text-2xl">Completed</h2>
                <div className="grid grid-cols-6 gap-12 items-stretch">
                  {completed.map((itemList) => {
                    // const previousItem = completed[index - 1] ?? null;
                    // const nextItem = completed[index + 1] ?? null;
                    // const isSameCollectionAsPrevious =
                    //   previousItem &&
                    //   isMovie(previousItem) &&
                    //   isMovie(itemList) &&
                    //   itemList.collection?.id === previousItem.collection?.id;
                    // const isSameCollectionAsNext =
                    //   nextItem &&
                    //   isMovie(nextItem) &&
                    //   isMovie(itemList) &&
                    //   itemList.collection?.id === nextItem.collection?.id;
                    return (
                      //                       <div
                      //                         key={index}
                      //                         className={`${
                      //                           isSameCollectionAsPrevious ? "pl-6" : "ml-6"
                      //                         } ${
                      //                           isSameCollectionAsNext ? "pr-6" : "mr-6"
                      //                         } relative z-0`}
                      //                       >
                      //                         {(isSameCollectionAsNext ||
                      //                           isSameCollectionAsPrevious) && (
                      //                           <div
                      //                             className="
                      //   absolute top-1/2 left-0 right-0 h-[2px]
                      //   bg-gradient-to-r from-red-500 via-red-700 to-red-500
                      //   opacity-50 rounded-full
                      //   -translate-y-1/2
                      //   -z-10
                      // "
                      //                           ></div>
                      //                         )}
                      <WatchItemMapping itemList={itemList} key={itemList.id} />
                      // </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

const WatchItemMapping = ({ itemList }: { itemList: MediaItem }) => {
  return (
    <div className="w-full h-full transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      {isMovie(itemList) ? (
        <MovieWatchItem
          key={(itemList as Movie).id}
          movie={itemList as Movie}
        />
      ) : (
        <TVShowWatchItem
          key={(itemList as TVShow).id}
          tvShow={itemList as TVShow}
        />
      )}
    </div>
  );
};
