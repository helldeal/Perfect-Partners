import { useQuery } from "@tanstack/react-query";
import { MediaItem } from "./models/movies";
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
export function useSearchMultiQuery(query: string) {
  return useQuery({
    queryKey: ["searchMulti", query],
    queryFn: () => TMDB.fetchSearchMulti(query),
    enabled: query.length > 0,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });
}

export function useMovieDetailsQuery(movieId: string, opts?: any) {
  return useQuery({
    queryKey: ["movieDetails", movieId],
    queryFn: () => TMDB.fetchMovieDetails(movieId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useTVDetailsQuery(tvId: string, opts?: any) {
  return useQuery({
    queryKey: ["tvDetails", tvId],
    queryFn: () => TMDB.fetchTVDetails(tvId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useMovieImagesQuery(movieId: string, opts?: any) {
  return useQuery({
    queryKey: ["movieImages", movieId],
    queryFn: () => TMDB.fetchMovieImages(movieId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useTVImagesQuery(tvId: string, opts?: any) {
  return useQuery({
    queryKey: ["tvImages", tvId],
    queryFn: () => TMDB.fetchTVImages(tvId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useMovieWatchProvidersQuery(movieId: string, opts?: any) {
  return useQuery({
    queryKey: ["movieWatchProviders", movieId],
    queryFn: () => TMDB.fetchMovieWatchProviders(movieId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useTVWatchProvidersQuery(tvId: string, opts?: any) {
  return useQuery({
    queryKey: ["tvWatchProviders", tvId],
    queryFn: () => TMDB.fetchTVWatchProviders(tvId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useMovieVideosQuery(movieId: string, opts?: any) {
  return useQuery({
    queryKey: ["movieVideos", movieId],
    queryFn: () => TMDB.fetchMovieVideos(movieId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useTVVideosQuery(tvId: string, opts?: any) {
  return useQuery({
    queryKey: ["tvVideos", tvId],
    queryFn: () => TMDB.fetchTVVideos(tvId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useMovieRecommendationsQuery(movieId: string, opts?: any) {
  return useQuery({
    queryKey: ["movieRecommendations", movieId],
    queryFn: () => TMDB.fetchMovieRecommendations(movieId),
    staleTime: Infinity,
    ...opts,
  });
}

export function useTVRecommendationsQuery(tvId: string, opts?: any) {
  return useQuery({
    queryKey: ["tvRecommendations", tvId],
    queryFn: () => TMDB.fetchTVRecommendations(tvId),
    staleTime: Infinity,
    ...opts,
  });
}

export const useMovieCreditsQuery = (movieId: string, opts?: any) => {
  return useQuery({
    queryKey: ["movieCredits", movieId],
    queryFn: () => TMDB.fetchMovieCredits(movieId),
    staleTime: Infinity,
    ...opts,
  });
};

export const useTVCreditsQuery = (tvId: string, opts?: any) => {
  return useQuery({
    queryKey: ["tvCredits", tvId],
    queryFn: () => TMDB.fetchTVCredits(tvId),
    staleTime: Infinity,
    ...opts,
  });
};
