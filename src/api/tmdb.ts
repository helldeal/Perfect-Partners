import { useQuery } from "@tanstack/react-query";
import { MediaItem } from "./movies";
export const tmdbApi = {
  baseUrl: import.meta.env.VITE_TMDB_URL,
  apiKey: import.meta.env.VITE_TMDB_API_KEY,
};
export const TMDB = {
  fetchTrending: async (): Promise<MediaItem[]> => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/trending/all/day?api_key=${tmdbApi.apiKey}&language=fr`
    );
    const data = await response.json();
    return data.results.filter(
      (item: any) => item.media_type === "movie" || item.media_type === "tv"
    );
  },
  fetchSearchMulti: async (query: string): Promise<MediaItem[]> => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/search/multi?query=${query}&api_key=${tmdbApi.apiKey}&language=fr&page=1&include_adult=false`
    );
    const data = await response.json();
    return data.results.filter(
      (item: any) => item.media_type === "movie" || item.media_type === "tv"
    );
  },
  fetchMovieDetails: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchMovieWatchProviders: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}/watch/providers?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchMovieVideos: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}/videos?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchMovieImages: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}/images?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchMovieCredits: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}/credits?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchMovieRecommendations: async (movieId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/movie/${movieId}/recommendations?api_key=${tmdbApi.apiKey}&language=fr&page=1`
    );
    return await response.json();
  },
  fetchTVDetails: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchTVWatchProviders: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/watch/providers?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchTVVideos: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/videos?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchTVImages: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/images?api_key=${tmdbApi.apiKey}`
    );
    return await response.json();
  },
  fetchTVCredits: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/credits?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
  fetchTVRecommendations: async (tvId: string) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/recommendations?api_key=${tmdbApi.apiKey}&language=fr&page=1`
    );
    return await response.json();
  },
  fetchTVSeasonDetails: async (tvId: string, seasonNumber: number) => {
    const response = await fetch(
      `${tmdbApi.baseUrl}/tv/${tvId}/season/${seasonNumber}?api_key=${tmdbApi.apiKey}&language=fr`
    );
    return await response.json();
  },
};

// export function getTrendingMoviesQuery() {
//   return useQuery({
//     queryKey: ["trendingMovies"],
//     queryFn: TMDB.fetchTrending,
//     staleTime: Infinity,
//   });
// }
export function getSearchMultiQuery(query: string) {
  return useQuery({
    queryKey: ["searchMulti", query],
    queryFn: () => TMDB.fetchSearchMulti(query),
    enabled: query.length > 0,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });
}
