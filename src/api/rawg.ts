import { useQuery } from "@tanstack/react-query";
import { Game } from "./models/games";

export const rawgApi = {
  baseURL: "https://api.rawg.io/api",
  apiKey: import.meta.env.VITE_RAWG_API_KEY,
};

export async function fetchCoverFromSGDB(name: string): Promise<string | null> {
  const key = import.meta.env.VITE_SGDB_API_KEY;

  // 1) Chercher le jeu
  const searchRes = await fetch(
    `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(
      name
    )}`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    }
  );

  const searchJson = await searchRes.json();
  if (!searchJson.data || searchJson.data.length === 0) return null;

  const gameId = searchJson.data[0].id;

  // 2) Récupérer les covers du jeu
  const coverRes = await fetch(
    `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900&types=static`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    }
  );

  const coverJson = await coverRes.json();
  if (!coverJson.data || coverJson.data.length === 0) return null;

  // On prend la première cover
  return coverJson.data[0].url;
}

export const RAWG = {
  fetchGames: async (query: string): Promise<Game[]> => {
    const response = await fetch(
      `${rawgApi.baseURL}/games?key=${
        rawgApi.apiKey
      }&search=${encodeURIComponent(query)}&page_size=20`
    );

    const data = await response.json();
    const games = data.results;

    // Ajouter les covers SGDB
    const withCovers: Game[] = await Promise.all(
      games.map(async (g: Game) => {
        const cover = await fetchCoverFromSGDB(g.name);
        return {
          ...g,
          sgdbCover: cover,
        };
      })
    );

    return withCovers;
  },
};

export function useSearchGames(query: string) {
  return useQuery({
    queryKey: ["searchGames", query],
    queryFn: () => RAWG.fetchGames(query),
    enabled: query.length > 0,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });
}
