import { useEffect, useRef, useState } from "react";
import { MediaItem, Movie, TVEpisode, TVSeason } from "../api/movies";
import {
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  WatchButtonIcon,
} from "../assets/svgs";
import { ItemIconButton } from "./ItemIconButton";
import { streamingLinks } from "../utils/movies";
import { formatRuntime, formatYearRange } from "../utils/dates";

interface ItemModalContentProps {
  title: string;
  overview: string;
  date: string;
  background_path: string;
  list?: TVSeason[] | Movie[];
  runtime?: number;
  videos: any[];
  logo?: string;
  recomandations?: MediaItem[];
  credits?: any;
  watch_providers: any[];
  handleDelete: () => void;
  handleAllWatch: () => void;
  handleWatchItem?: (item: TVEpisode | Movie) => void;
}

export const ItemModalContent = ({
  title,
  overview,
  date,
  background_path,
  list,
  runtime,
  videos,
  logo,
  recomandations,
  credits,
  watch_providers,
  handleDelete,
  handleAllWatch,
}: ItemModalContentProps) => {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
              <ItemIconButton title="Watch" handleClick={handleAllWatch}>
                <WatchButtonIcon />
              </ItemIconButton>
              <ItemIconButton title="Remove" handleClick={handleDelete}>
                <RemoveButtonIcon />
              </ItemIconButton>
            </div>
          </div>
          {videos && videos.length > 0 ? (
            <div className="absolute bottom-1/10 mb-4 right-12 flex">
              <ItemIconButton
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
              <ListIndicator list={list ?? []} />
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
        <ListMapping list={list ?? []} />
      </div>
    </>
  );
};

const ListIndicator = ({ list }: { list: TVSeason[] | Movie[] }) => {
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

const ListMapping = ({ list }: { list: TVSeason[] | Movie[] }) => {
  if (list.length === 0) return null;
  if ((list[0] as TVSeason).season_number !== undefined) {
    const seasons = list as TVSeason[];
    return (
      <div className="flex flex-col gap-4">
        {seasons.map((season) => (
          <div key={season.id}>
            <h3 className="text-xl">{season.name}</h3>
            <div className="flex flex-col mt-2 gap-2">
              {season.episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="border-b rounded border-gray-500 pb-2 flex items-center gap-4 px-4"
                >
                  <p
                    className="text-2xl text-center"
                    style={{ flex: "0 0 7%" }}
                  >
                    {episode.episode_number}
                  </p>
                  <img
                    src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                    alt={episode.name}
                    className="w-32 h-18 object-cover rounded"
                  />
                  <div style={{ flex: "0 0 70%" }}>
                    <div className="flex items-center gap-4 mb-1 justify-between">
                      <h4 className="text-lg">{`Episode ${episode.episode_number}: ${episode.name}`}</h4>
                      <p>{formatRuntime(episode.runtime!)}</p>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-3 mb-2">
                      {episode.overview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    const movies = list as Movie[];
    return (
      <div className="flex flex-col gap-4">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="border-b rounded border-gray-500 pb-4 flex items-center gap-4 px-4"
          >
            <img
              src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
              alt={movie.title}
              className="w-32 h-48 object-cover rounded"
            />
            <div className="flex flex-col gap-2">
              <p>{formatYearRange([movie.release_date])}</p>
              <div className="flex items-center gap-4 mb-1 justify-between">
                <h3 className="text-xl">{movie.title}</h3>
                <p>{formatRuntime(movie.runtime!)}</p>
              </div>
              <p className="text-gray-300 text-sm line-clamp-4">
                {movie.overview}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
};
