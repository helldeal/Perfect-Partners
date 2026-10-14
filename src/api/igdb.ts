import { useQuery } from "@tanstack/react-query";
import { Game } from "./models/games";

const igdbWorkerUrl = import.meta.env.VITE_IGDB_WORKER_URL?.replace(/\/+$/, "");

const getIGDBEndpoint = (path: string) => {
  if (!igdbWorkerUrl) throw new Error("L'adresse du service de jeux n'est pas configurée.");
  return `${igdbWorkerUrl}/${path}`;
};

async function fetchIGDBGames(query: string): Promise<Game[]> {
  const res = await fetch(
    `${getIGDBEndpoint("search")}?q=${encodeURIComponent(
      query
    )}`
  );
  if (!res.ok) throw new Error("Impossible de charger les jeux IGDB");
  const data = await res.json();
  return data;
}

export async function fetchIGDBGame(id: number, name: string) {
  const games = await fetchIGDBGames(name);
  return games.find((game) => game.id === id) ?? null;
}
async function fetchIGDBSimilarGames(gameIds: number[]): Promise<Game[]> {
  const res = await fetch(
    `${getIGDBEndpoint("similar")}?ids=${encodeURIComponent(
      gameIds.join(",")
    )}`
  );
  const data = await res.json();
  return data;
}
async function fetchIGDBCollection(id: number): Promise<Game[]> {
  const res = await fetch(
    `${getIGDBEndpoint("collection")}?id=${encodeURIComponent(
      id
    )}`
  );
  const data = await res.json();
  return data;
}
export function useSearchGames(query: string) {
  return useQuery({
    queryKey: ["searchGames", query],
    queryFn: () => fetchIGDBGames(query),
    enabled: query.length > 0,
    staleTime: Infinity,
  });
}
export function useSimilarGames(gameIds: number[]) {
  return useQuery({
    queryKey: ["similarGames", gameIds],
    queryFn: () => fetchIGDBSimilarGames(gameIds),
    enabled: gameIds.length > 0,
    staleTime: Infinity,
  });
}
export function useCollectionGames(collectionId: number | null) {
  return useQuery({
    queryKey: ["collectionGames", collectionId],
    queryFn: () => fetchIGDBCollection(collectionId!),
    enabled: collectionId !== null,
    staleTime: Infinity,
  });
}
