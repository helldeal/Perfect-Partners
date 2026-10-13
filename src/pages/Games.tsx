import { LibrarySection } from "../components/LibrarySection";
import { CardGridSkeleton } from "../components/Skeleton";
import { useSearchGames } from "../api/igdb";
import { MainLayout } from "../components/MainLayout";
import useSearchStore from "../store/searchStore";
import { useDebounce } from "../utils/useDebounce";
import { GameItem } from "../components/games/GameItem";
import { useAddGame, useFirebaseGames } from "../api/firebase/games";
import { useEffect, useMemo } from "react";
import { GameItemModal } from "../api/models/gameItemModal";
import useModalStore from "../store/modalStore";
import { Game } from "../api/models/games";
import { refreshGameOnOpen } from "../hooks/useSystemUpdates";

export const GamesPage = () => {
  const searchTerm = useSearchStore((state) => state.query);
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchGamesQuery = useSearchGames(debouncedQuery);
  const firebaseGamesQuery = useFirebaseGames();
  const addGameMutation = useAddGame();
  const payload: GameItemModal = useModalStore((state) => state.payload);
  const updatePayload = useModalStore((state) => state.updatePayload);

  const searchList = debouncedQuery.length > 0 ? searchGamesQuery.data : null;

  const gameList = useMemo(() => {
    const games = firebaseGamesQuery.data ?? [];
    const gamesSortedByLatestUpdate = [...games].sort((a, b) => {
      const dateDifference = (b.userUpdatedAt ?? 0) - (a.userUpdatedAt ?? 0);
      return dateDifference !== 0
        ? dateDifference
        : a.name.localeCompare(b.name);
    });

    const { done, playing, wishlist } = gamesSortedByLatestUpdate.reduce(
      (acc, game) => {
        if (game.status === "done") acc.done.push(game);
        else if (game.status === "playing") acc.playing.push(game);
        else acc.wishlist.push(game);
        return acc;
      },
      {
        done: [] as Game[],
        playing: [] as Game[],
        wishlist: [] as Game[],
      }
    );

    return { done, playing, wishlist };
  }, [firebaseGamesQuery.data]);

  useEffect(() => {
    if (!payload || payload.game.id === null) return;

    const itemInList = firebaseGamesQuery.data?.find((item) => {
      return item.id === payload.game.id;
    });

    if (itemInList) void refreshGameOnOpen(itemInList);

    const newPayload: Partial<GameItemModal> = {};
    if (!itemInList) {
      if (payload.wishListed) {
        newPayload.wishListed = false;
      }
    } else if (!payload.wishListed) {
      newPayload.wishListed = true;
      newPayload.game = itemInList;
    } else if (
      itemInList.status !== payload.game.status ||
      itemInList.possessedBy?.length !== payload.game.possessedBy?.length
    ) {
      newPayload.game = itemInList;
    }
    if (Object.keys(newPayload).length > 0) {
      updatePayload(newPayload);
    }
  }, [payload, firebaseGamesQuery.data, updatePayload]);

  return (
    <MainLayout navSelected="games">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-10 p-4 sm:gap-12 sm:p-6 md:p-8 lg:p-12">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-app-primary">Votre bibliothèque partagée</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{searchTerm ? "Recherche" : "Jeux vidéo"}</h1>
          <p className="text-sm text-app-muted sm:text-base">{searchTerm ? `Résultats pour « ${searchTerm} »` : "Vos prochaines aventures, vos parties en cours et vos jeux terminés."}</p>
        </header>
        {firebaseGamesQuery.isLoading ? (
          <>
            <LibrarySection title="En cours" loading />
            <LibrarySection title="Liste à faire" loading />
            <LibrarySection title="Jeux terminés" loading />
          </>
        ) : searchTerm.length > 0 ? (
          searchTerm !== debouncedQuery || searchGamesQuery.isLoading ? (
            <CardGridSkeleton />
          ) : searchGamesQuery.isError ? (
            <p role="alert">Impossible de charger les résultats. <button type="button" className="text-app-primary underline" onClick={() => void searchGamesQuery.refetch()}>Réessayer</button></p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-12 items-stretch">
              {searchList.map((item) => (
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
              Aucun jeu trouvé. Essayez un titre plus précis.
            </p>
          )
        ) : (firebaseGamesQuery.isError) ? (
          <p role="alert">Impossible de charger la bibliothèque. <button type="button" className="text-app-primary underline" onClick={() => { void firebaseGamesQuery.refetch(); }}>Réessayer</button></p>
        ) : (firebaseGamesQuery.data ?? []).length === 0 ? (
          <p className="text-app-muted">Votre bibliothèque est vide. Recherchez un jeu pour commencer.</p>
        ) : (
          <>
            {gameList.playing.length > 0 && (
              <LibrarySection title="En cours" count={gameList.playing.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {gameList.playing.map((game) => (
                    <GameItem key={game.id} game={game} inWishlist={true} />
                  ))}
                </div>
              </LibrarySection>
            )}
            {gameList.wishlist.length > 0 && (
              <LibrarySection title="Liste à faire" count={gameList.wishlist.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {gameList.wishlist.map((game) => (
                    <GameItem key={game.id} game={game} inWishlist={true} />
                  ))}
                </div>
              </LibrarySection>
            )}
            {gameList.done.length > 0 && (
              <LibrarySection title="Jeux terminés" count={gameList.done.length}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6 items-stretch">
                  {gameList.done.map((game) => (
                    <GameItem key={game.id} game={game} inWishlist={true} />
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
