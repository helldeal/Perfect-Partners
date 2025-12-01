import { useEffect, useMemo, useRef, useState } from "react";
import {
  MediaItem,
  Movie,
  TVEpisode,
  TVSeason,
  Video,
  WatchProvider,
} from "../../api/models/movies";
import {
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  WatchButtonIcon,
} from "../../assets/svgs";
import { ItemIconButton } from "../ItemIconButton";
import { isMovie, isTVShow, streamingLinks } from "../../utils/movies";
import { formatRuntime, formatYearRange } from "../../utils/dates";
import SearchItem from "../search/SearchItem";
import { useAddMovie, useFirebaseMovies } from "../../api/firebase/movies";
import { useAddTVShow, useFirebaseTVShows } from "../../api/firebase/tvshows";
import { MediaListIndicator } from "./MediaListIndicator";
import { MediaListMapping } from "./MediaListMapping";

interface ItemModalContentProps {
  id: number;
  title: string;
  overview: string;
  date: string;
  background_path: string;
  list?: TVSeason[] | Movie[];
  runtime?: number;
  videos: Video[];
  logo?: string;
  recomandationsQuery?: any;
  creditsQuery?: any;
  watch_providers: WatchProvider[];
  handleDelete: () => void;
  handleAllWatch: () => void;
  handleWatchItem?: (id: string) => void;
  allWatched?: boolean;
}

export const WatchItemModalContent = ({
  id,
  title,
  overview,
  date,
  background_path,
  list,
  runtime,
  videos,
  logo,
  recomandationsQuery,
  creditsQuery,
  watch_providers,
  handleDelete,
  handleAllWatch,
  handleWatchItem,
  allWatched,
}: ItemModalContentProps) => {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();

  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const handleAddToList = (item: MediaItem) => {
    if (isMovie(item)) {
      addMovieMutation.mutate(item);
    } else if (isTVShow(item)) {
      addTVShowMutation.mutate(item);
    }
  };

  const mediaList = useMemo(
    () => [
      ...(firebaseMoviesQuery.data || []),
      ...(firebaseTVShowsQuery.data || []),
    ],
    [firebaseMoviesQuery.data, firebaseTVShowsQuery.data]
  );

  const recomandationsQueryResult = recomandationsQuery
    ? recomandationsQuery(id)
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
          {videos && videos.length > 0 ? (
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
              src={`https://www.youtube.com/embed/${videos[0]?.key}?autoplay=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${videos[0]?.key}&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&mute=1`}
              title={title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          ) : (
            background_path && (
              <img
                src={`https://image.tmdb.org/t/p/w780${background_path}`}
                alt={title}
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
              src={`https://image.tmdb.org/t/p/w300${logo}`}
              alt={title}
              className="object-contain mb-6"
            />
            <div className="flex space-x-4">
              {!allWatched && (
                <ItemIconButton
                  type="primary"
                  title="Watch"
                  handleClick={handleAllWatch}
                >
                  <WatchButtonIcon />
                </ItemIconButton>
              )}
              <ItemIconButton
                type="secondary"
                title="Remove"
                handleClick={handleDelete}
              >
                <RemoveButtonIcon />
              </ItemIconButton>
            </div>
          </div>
          {videos && videos.length > 0 ? (
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
              <p>{date}</p>
              <MediaListIndicator list={list ?? []} />
              {runtime && <p>{formatRuntime(runtime)}</p>}
            </div>
            <p className="mb-2 line-clamp-4">{overview}</p>
          </div>
          <div className="col-span-1 flex flex-col items-end">
            {watch_providers ? (
              watch_providers?.slice(0, 3).map((provider) => {
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
        <MediaListMapping list={list ?? []} handleWatchItem={handleWatchItem} />
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
                      handleAddToList={handleAddToList}
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
