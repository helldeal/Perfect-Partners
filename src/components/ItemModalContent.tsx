import { useEffect, useRef, useState } from "react";
import { Movie, TVSeason } from "../api/movies";
import {
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  WatchButtonIcon,
} from "../assets/svgs";
import { ItemIconButton } from "./ItemIconButton";

interface ItemModalContentProps {
  title: string;
  overview: string;
  release_date: string;
  background_path: string;
  list: TVSeason[] | Movie[];
  videos: any[] | undefined;
  logo: string | undefined;
  handleDelete: () => void;
  handleAllWatch: () => void;
}

export const ItemModalContent = ({
  title,
  overview,
  release_date,
  background_path,
  list,
  videos,
  logo,
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
              className="object-contain"
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
      <div className="p-6 text-white z-30 relative">
        <div className="flex space-x-4">
          {new Date(release_date).getFullYear()}
        </div>
        <p className="mb-2">{overview}</p>
      </div>
    </>
  );
};
