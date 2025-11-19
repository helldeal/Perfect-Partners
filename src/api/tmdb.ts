import { useQueries, useQuery } from "@tanstack/react-query";
const tmdbApi = {
  baseUrl: import.meta.env.VITE_TMDB_URL,
  apiKey: import.meta.env.VITE_TMDB_API_KEY,
};
const TMDB = {
  fetchTrending: async () => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/trending/all/day?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchSearchMulti: async (query: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/search/multi?${query}&api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchMovieDetails: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchTVDetails: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
};

export function getTrendingMoviesQuery() {
  return useQuery({
    queryKey: ["trendingMovies"],
    queryFn: TMDB.fetchTrending,
  });
}
export function getSearchMultiQuery(query: string) {
  return useQuery({
    queryKey: ["searchMulti", query],
    queryFn: () => TMDB.fetchSearchMulti(query),
    enabled: query.length > 0,
  });
}
export function getMoviesQuerries(movieIds: number[]) {
  const querries = useQueries({
    queries: movieIds.map((id) => ({
      queryKey: ["movieDetails", id],
      queryFn: () => TMDB.fetchMovieDetails(id.toString()),
    })),
  });
  return querries;
}
export function getTVQuerries(tvIds: number[]) {
  const querries = useQueries({
    queries: tvIds.map((id) => ({
      queryKey: ["tvDetails", id],
      queryFn: () => TMDB.fetchTVDetails(id.toString()),
    })),
  });
  return querries;
}
