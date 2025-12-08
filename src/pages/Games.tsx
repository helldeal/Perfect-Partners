import { useSearchGames } from "../api/rawg";
import { Game } from "../api/models/games";
import { MainLayout } from "../components/MainLayout";
import useSearchStore from "../store/searchStore";
import { useDebounce } from "../utils/useDebounce";
import { ItemLayout } from "../components/ItemLayout";

export const GamesPage = () => {
  const searchTerm = useSearchStore((state) => state.query);
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchGamesQuery = useSearchGames(debouncedQuery);

  const searchList = debouncedQuery.length > 0 ? searchGamesQuery.data : null;

  return (
    <MainLayout navSelected="games">
      <div className=" flex flex-col gap-6 p-12">
        {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
          searchGamesQuery.isLoading ? (
            <p>Loading...</p>
          ) : searchList && searchList.length > 0 ? (
            <div className="grid grid-cols-6 gap-12 items-stretch">
              {searchList.map((item: Game) => (
                <ItemLayout
                  name={item.name}
                  image={item.background_image}
                  key={item.id}
                  payload={item}
                />
              ))}
            </div>
          ) : (
            <p>No results found.</p>
          )
        ) : null}
      </div>
    </MainLayout>
  );
};
