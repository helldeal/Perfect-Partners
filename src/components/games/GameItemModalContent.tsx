import { useEffect, useRef, useState } from "react";
import {
  AddButtonIcon,
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
} from "../../assets/svgs";
import { ItemIconButton } from "../ItemIconButton";
import { GameItemModal } from "../../api/models/gameItemModal";
import { useAddGame, useFirebaseGames } from "../../api/firebase/games";
import { Game } from "../../api/models/games";
import { formatYearRange } from "../../utils/dates";
import { useCollectionGames, useSimilarGames } from "../../api/igdb";
import { GameItem } from "./GameItem";

export const GameItemModalContent = ({ item }: { item: GameItemModal }) => {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firebaseGamesQuery = useFirebaseGames();
  const addGameMutation = useAddGame();
  const useCollectionGamesQuery = useCollectionGames(
    item.game.collections ? item.game.collections[0] : null
  );
  const useSimilarGamesQuery = useSimilarGames(
    item.game.similar_games ? item.game.similar_games : []
  );

  const handleAddToList = (game: Game) => {
    addGameMutation.mutate(game);
  };

  const displayItem = item.game;

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
          {displayItem.video ? (
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
              src={`https://www.youtube.com/embed/${displayItem.video}?autoplay=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${displayItem.video}&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&mute=1`}
              title={displayItem.name}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          ) : (
            displayItem.artworks && (
              <img
                src={`${displayItem.artworks[0]}`}
                alt={displayItem.name}
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
            {displayItem.logoUrl ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${displayItem.logoUrl}`}
                alt={displayItem.name}
                className="object-contain mb-6 max-w-xs"
              />
            ) : (
              <h1 className="text-4xl font-bold text-white">
                {displayItem.name}
              </h1>
            )}
            {item.wishListed ? (
              <div className="flex space-x-4">
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
                onClick={() => handleAddToList(displayItem)}
              >
                <AddButtonIcon />
                <span className="leading-none mb-0.5">Ajouter à la liste</span>
              </button>
            )}
          </div>
          {item.game.video ? (
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
              <p>
                {displayItem.release_date &&
                  formatYearRange([
                    new Date(displayItem.release_date * 1000).toDateString(),
                  ])}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-400">Genres :</span>
              {displayItem.genres?.map((genre, index) => (
                <span key={index} className="text-sm ">
                  {genre}
                  {index < displayItem.genres!.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-400">Theme :</span>
              {displayItem.themes?.map((theme, index) => (
                <span key={index} className="text-sm">
                  {theme}
                  {index < displayItem.themes!.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-400">Platforms :</span>
              {displayItem.platforms?.map((platform, index) => (
                <span key={index} className="text-sm">
                  {platform.name}
                  {index < displayItem.platforms!.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
            <p className="mb-2 line-clamp-4">{displayItem.overview}</p>
            <p className="mb-2 line-clamp-4">{displayItem.storyline}</p>
          </div>
          <div className="col-span-1 flex flex-row justify-end gap-4">
            <div className="flex flex-col mb-4">
              {displayItem.companies ? (
                <>
                  {displayItem.companies.some((c) => c.developer) && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Developer:</p>
                      <p className="text-sm">
                        {displayItem.companies
                          .filter((c) => c.developer)
                          .map((c) => c.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                  {displayItem.companies.some((c) => c.publisher) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Publisher:</p>
                      <p className="text-sm">
                        {displayItem.companies
                          .filter((c) => c.publisher)
                          .map((c) => c.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">N/A</p>
              )}
            </div>
            <div className="flex flex-col items-end">
              {displayItem.websites?.stores ? (
                displayItem.websites.stores.map((store, index) => {
                  return (
                    <img
                      key={index}
                      src={`https://www.igdb.com/icons/${store.type.toLowerCase()}.svg`}
                      alt={store.type}
                      className={`mb-2 ml-2 object-contain w-8 h-8 cursor-pointer `}
                      onClick={() => window.open(`${store.url}`, "_blank")}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">
                  Aucun lien de magasin disponible
                </p>
              )}
            </div>
          </div>
        </div>
        {useCollectionGamesQuery.data &&
          useCollectionGamesQuery.data.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl mb-4">Collection</h2>
              <div className="grid grid-cols-5 gap-4 pb-4">
                {useCollectionGamesQuery.data
                  .sort((a, b) =>
                    (String(a.release_date) || "").localeCompare(
                      String(b.release_date) || ""
                    )
                  )
                  .map((game) => (
                    <GameItem
                      key={game.id}
                      game={game}
                      onAdd={() => addGameMutation.mutate(game)}
                      inWishlist={firebaseGamesQuery.data?.some(
                        (g) => g.id === game.id
                      )}
                      itemSelected={game.id === item.game.id}
                    />
                  ))}
              </div>
            </div>
          )}
        {useSimilarGamesQuery.data && useSimilarGamesQuery.data.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl mb-4">Similar Games</h2>
            <div className="grid grid-cols-5 gap-4 pb-4">
              {useSimilarGamesQuery.data.map((game) => (
                <GameItem
                  key={game.id}
                  game={game}
                  onAdd={() => addGameMutation.mutate(game)}
                  inWishlist={firebaseGamesQuery.data?.some(
                    (g) => g.id === game.id
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
