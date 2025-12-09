import { useQuery } from "@tanstack/react-query";
import { Game } from "./models/games";

async function fetchIGDBGames(query: string): Promise<Game[]> {
  const res = await fetch(
    `https://perfect-partners.mrhelldeal.workers.dev/search?q=${encodeURIComponent(
      query
    )}`
  );
  const data = await res.json();
  return data;
}
async function fetchIGDBSimilarGames(gameIds: number[]): Promise<Game[]> {
  const res = await fetch(
    `https://perfect-partners.mrhelldeal.workers.dev/similar?ids=${encodeURIComponent(
      gameIds.join(",")
    )}`
  );
  const data = await res.json();
  return data;
}
async function fetchIGDBCollection(id: number): Promise<Game[]> {
  const res = await fetch(
    `https://perfect-partners.mrhelldeal.workers.dev/collection?id=${encodeURIComponent(
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
