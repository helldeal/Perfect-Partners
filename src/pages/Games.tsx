import { useSearchGames } from "../api/igdb";
import { Game } from "../api/models/games";
import { MainLayout } from "../components/MainLayout";
import useSearchStore from "../store/searchStore";
import { useDebounce } from "../utils/useDebounce";
import { GameItem } from "../components/games/GameItem";
import { useAddGame, useFirebaseGames } from "../api/firebase/games";
import { useEffect } from "react";
import { GameItemModal } from "../api/models/gameItemModal";
import useModalStore from "../store/modalStore";

export const GamesPage = () => {
  const searchTerm = useSearchStore((state) => state.query);
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchGamesQuery = useSearchGames(debouncedQuery);
  const firebaseGamesQuery = useFirebaseGames();
  const addGameMutation = useAddGame();
  const payload: GameItemModal = useModalStore((state) => state.payload);
  const updatePayload = useModalStore((state) => state.updatePayload);

  const searchList = debouncedQuery.length > 0 ? searchGamesQuery.data : null;

  useEffect(() => {
    if (!payload || payload.game.id == null) return;

    const itemInList = firebaseGamesQuery.data?.find((item) => {
      return item.id === payload.game.id;
    });

    let newPayload: Partial<GameItemModal> = {};
    if (!itemInList) {
      if (payload.wishListed) {
        newPayload.wishListed = false;
      }
    } else if (itemInList && !payload.wishListed) {
      newPayload.wishListed = true;
    }
    if (Object.keys(newPayload).length > 0) {
      updatePayload(newPayload);
    }
  }, [payload, firebaseGamesQuery.data]);

  return (
    <MainLayout navSelected="games">
      <div className=" flex flex-col gap-6 p-12">
        {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
          searchGamesQuery.isLoading ? (
            <p>Loading...</p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-6 gap-12 items-stretch">
              {searchList.map((item: Game) => (
                <GameItem
                  key={item.id}
                  game={item}
                  onAdd={() => addGameMutation.mutate(item)}
                  inWishlist={firebaseGamesQuery.data?.some(
                    (g) => g.id === item.id
                  )}
                />
              ))}
            </div>
          ) : (
            <p>
              Pas de résultats (IGDP clc faut certainement être plus précis)
            </p>
          )
        ) : (
          firebaseGamesQuery.data &&
          firebaseGamesQuery.data.length > 0 && (
            <>
              <h2 className="text-2xl">Game List</h2>
              <div className="grid grid-cols-6 gap-12 items-stretch">
                {firebaseGamesQuery.data.map((game) => (
                  <GameItem key={game.id} game={game} inWishlist={true} />
                ))}
              </div>
            </>
          )
        )}
      </div>
    </MainLayout>
  );
};
