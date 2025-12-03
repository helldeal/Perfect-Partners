import { useEffect, useMemo, useRef, useState } from "react";
import { MediaItem, Movie, TVSeason } from "../../api/models/movies";
import {
  AddButtonIcon,
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  WatchButtonIcon,
} from "../../assets/svgs";
import { ItemIconButton } from "../ItemIconButton";
import { isMovie, isTVShow, streamingLinks } from "../../utils/movies";
import { formatRuntime } from "../../utils/dates";
import SearchItem from "../search/SearchItem";
import { useAddMovie, useFirebaseMovies } from "../../api/firebase/movies";
import { useAddTVShow, useFirebaseTVShows } from "../../api/firebase/tvshows";
import { MediaListIndicator } from "./MediaListIndicator";
import { MediaListMapping } from "./MediaListMapping";
import { WatchItemModal } from "../../api/models/watchItemModal";

export const WatchItemModalContent = ({ item }: { item: WatchItemModal }) => {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();

  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const handleRecommendationAddToList = (item: MediaItem) => {
    if (isMovie(item)) {
      addMovieMutation.mutate(item.id);
    } else if (isTVShow(item)) {
      addTVShowMutation.mutate(item.id);
    }
  };

  const handleAddToList = (item: WatchItemModal) => {
    if (!item.list) addMovieMutation.mutate(item.id);
    else if (item.list && item.list.length > 0) {
      if ((item.list as TVSeason[])[0].episodes) {
        addTVShowMutation.mutate(item.id);
      } else if ((item.list as Movie[])[0].collection) {
        (item.list as Movie[]).forEach((movie: Movie) => {
          addMovieMutation.mutate(movie.id);
        });
      }
    }
  };

  const mediaList = useMemo(
    () => [
      ...(firebaseMoviesQuery.data || []),
      ...(firebaseTVShowsQuery.data || []),
    ],
    [firebaseMoviesQuery.data, firebaseTVShowsQuery.data]
  );

  const recomandationsQueryResult = item.recomandationsQuery
    ? item.recomandationsQuery(item.id)
    : null;

  useEffect(() => {
    if (!iframeRef.current) return;

    const contentWindow = iframeRef.current.contentWindow;
    if (contentWindow) {
      contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: muted ? "mute" : "unMute",
          args: [],
        }),
        "*"
      );
      contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "setVolume",
          args: [50],
        }),
        "*"
      );
    }
  }, [muted]);
  return (
    <>
      <div className="relative">
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%" /* 16:9 */,
            paddingTop: "25px",
            width: "300%" /* enlarge beyond browser width */,
            left: "-100%" /* center */,
            zIndex: 20,
          }}
        >
          {item.videos && item.videos.length > 0 ? (
            <iframe
              ref={iframeRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
              className=" pointer-events-none"
              src={`https://www.youtube.com/embed/${item.videos[0]?.key}?autoplay=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${item.videos[0]?.key}&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&mute=1`}
              title={item.title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          ) : (
            item.background_path && (
              <img
                src={`https://image.tmdb.org/t/p/w780${item.background_path}`}
                alt={item.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                className=" pointer-events-none object-contain"
              />
            )
          )}
        </div>
        <div
          className="absolute top-0 left-0 w-full h-full z-30"
          style={{
            background: "linear-gradient(0deg, #181818, transparent 50%)",
          }}
        >
          <div className="absolute bottom-1/10 mb-4 left-12 flex flex-col gap-4">
            <img
              src={`https://image.tmdb.org/t/p/w300${item.logo}`}
              alt={item.title}
              className="object-contain mb-6"
            />
            {item.wishListed ? (
              <div className="flex space-x-4">
                {!item.allWatched && (
                  <ItemIconButton
                    type="primary"
                    title="Watch"
                    handleClick={item.handleAllWatch}
                  >
                    <WatchButtonIcon />
                  </ItemIconButton>
                )}
                <ItemIconButton
                  type="secondary"
                  title="Remove"
                  handleClick={item.handleDelete}
                >
                  <RemoveButtonIcon />
                </ItemIconButton>
              </div>
            ) : (
              <button
                className="w-fit bg-white text-black px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleAddToList(item)}
              >
                <AddButtonIcon />
                <span className="leading-none mb-0.5">Ajouter à la liste</span>
              </button>
            )}
          </div>
          {item.videos && item.videos.length > 0 ? (
            <div className="absolute bottom-1/10 mb-4 right-12 flex">
              <ItemIconButton
                type="secondary"
                title={muted ? "Unmute" : "Mute"}
                handleClick={() => setMuted(!muted)}
              >
                {muted ? <MutedIcon /> : <UnmutedIcon />}
              </ItemIconButton>
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-12 py-3 pb-12 text-white z-30 relative flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex space-x-4 mt-2 text-gray-400 items-center mb-4">
              <p>{item.date}</p>
              <MediaListIndicator list={item.list ?? []} />
              {item.runtime && <p>{formatRuntime(item.runtime)}</p>}
            </div>
            <p className="mb-2 line-clamp-4">{item.overview}</p>
          </div>
          <div className="col-span-1 flex flex-col items-end">
            {item.watch_providers ? (
              item.watch_providers?.slice(0, 3).map((provider) => {
                const link = streamingLinks[provider.provider_id] || null;
                return (
                  <img
                    key={provider.provider_id}
                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                    alt={provider.provider_name}
                    className={`mb-2 ml-2 object-contain w-8 h-8 ${
                      link ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (link) {
                        window.open(link, "_blank");
                      }
                    }}
                  />
                );
              })
            ) : (
              <p className="text-sm text-gray-400">
                Aucun fournisseur de streaming disponible
              </p>
            )}
          </div>
        </div>
        <MediaListMapping
          list={item.list ?? []}
          handleWatchItem={item.handleWatchItem}
        />
        <div className="mt-6">
          <h2 className="text-2xl mb-4">Recommandations</h2>
          {recomandationsQueryResult && recomandationsQueryResult.isLoading ? (
            <p>Loading...</p>
          ) : (
            recomandationsQueryResult &&
            recomandationsQueryResult.data && (
              <div className="grid grid-cols-5 gap-4 pb-4">
                {recomandationsQueryResult.data.results
                  .slice(0, 10)
                  .map((item: any) => (
                    <SearchItem
                      key={item.id}
                      id={item.id}
                      image={item.poster_path}
                      title={item.title || item.name}
                      release_date={item.release_date || item.first_air_date}
                      overview={item.overview}
                      itemList={mediaList}
                      handleAddToList={handleRecommendationAddToList}
                      item={item}
                    />
                  ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};
