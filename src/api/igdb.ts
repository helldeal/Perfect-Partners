import { useQuery } from "@tanstack/react-query";
import { Game } from "./models/games";

export async function fetchIGDBGames(query: string): Promise<Game[]> {
  const res = await fetch(
    `https://perfect-partners.mrhelldeal.workers.dev/search?q=${encodeURIComponent(
      query
    )}`
  );
  const data = await res.json();

  return data.map((g: any) => ({
    id: g.id,
    name: g.name,
    cover: g.cover,
    overview: g.overview,
    releaseDate: g.release_date,
  }));
}

export function useSearchGames(query: string) {
  return useQuery({
    queryKey: ["searchGames", query],
    queryFn: () => fetchIGDBGames(query),
    enabled: query.length > 0,
    staleTime: Infinity,
  });
}
