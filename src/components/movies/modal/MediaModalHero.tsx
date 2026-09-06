import { RefObject } from "react";
import { WatchItemModal } from "../../../api/models/watchItemModal";
import {
  AddButtonIcon,
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  UnwatchButtonIcon,
  WatchButtonIcon,
} from "../../../assets/svgs";
import { ItemIconButton } from "../../ItemIconButton";

type MediaModalHeroProps = {
  item: WatchItemModal;
  iframeRef: RefObject<HTMLIFrameElement>;
  muted: boolean;
  onAdd: (item: WatchItemModal) => void;
  onToggleMuted: () => void;
};

export const MediaModalHero = ({
  item,
  iframeRef,
  muted,
  onAdd,
  onToggleMuted,
}: MediaModalHeroProps) => (
  <div className="relative">
    <div
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        paddingTop: "25px",
        width: "300%",
        left: "-100%",
        zIndex: 20,
      }}
    >
      {item.videos.length > 0 ? (
        <iframe
          ref={iframeRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          className="pointer-events-none"
          src={`https://www.youtube.com/embed/${item.videos[0]?.key}?autoplay=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${item.videos[0]?.key}&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&mute=1`}
          title={item.title}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        item.background_path && (
          <img
            src={`https://image.tmdb.org/t/p/w780${item.background_path}`}
            alt={item.title}
            className="pointer-events-none absolute left-0 top-0 h-full w-full object-contain"
          />
        )
      )}
    </div>

    <div
      className="absolute left-0 top-0 z-30 h-full w-full"
      style={{
        background: "linear-gradient(0deg, var(--app-bg), transparent 50%)",
      }}
    >
      <div className="absolute bottom-1/10 left-4 mb-2 flex flex-col gap-2 sm:left-12 sm:mb-4 sm:gap-4">
        {item.logo ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${item.logo}`}
            alt={item.title}
            className="h-16 max-w-24 object-contain sm:mb-6 sm:h-auto sm:max-w-xs"
          />
        ) : (
          <h1 className="max-w-xs text-2xl font-bold text-white sm:mb-6 sm:text-4xl">
            {item.title}
          </h1>
        )}

        {item.wishListed ? (
          <div className="flex space-x-4">
            {(!item.allWatched || item.handleAllUnwatch) && (
              <ItemIconButton
                type={item.allWatched ? "secondary" : "primary"}
                title={
                  item.allWatched
                    ? "Marquer comme non regardé"
                    : "Marquer comme regardé"
                }
                handleClick={
                  item.allWatched ? item.handleAllUnwatch! : item.handleAllWatch
                }
              >
                {item.allWatched ? <UnwatchButtonIcon /> : <WatchButtonIcon />}
              </ItemIconButton>
            )}
            <ItemIconButton
              type="secondary"
              title="Supprimer"
              handleClick={item.handleDelete}
            >
              <RemoveButtonIcon />
            </ItemIconButton>
          </div>
        ) : (
          <button
            className="flex w-fit cursor-pointer items-center space-x-2 rounded bg-white px-4 py-2 text-black hover:bg-gray-200"
            onClick={() => onAdd(item)}
          >
            <AddButtonIcon />
            <span className="mb-0.5 leading-none">Ajouter à la liste</span>
          </button>
        )}
      </div>

      {item.videos.length > 0 && (
        <div className="absolute bottom-1/10 right-4 mb-2 flex sm:right-12 sm:mb-4">
          <ItemIconButton
            type="secondary"
            title={muted ? "Augmenter le son" : "Couper le son"}
            handleClick={onToggleMuted}
          >
            {muted ? <MutedIcon /> : <UnmutedIcon />}
          </ItemIconButton>
        </div>
      )}
    </div>
  </div>
);
