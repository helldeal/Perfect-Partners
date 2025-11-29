import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TMDB } from "./tmdb";
import { useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/firebase";
import { filterMovieFields, filterTVShowFields } from "../utils/movies";

export type MediaItem = Movie | TVShow;
export type MediaList = (MovieSaga | TVShow | Movie)[];

export type MovieSaga = Movie[];

export type Movie = {
  id: number;
  firebaseId?: string;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  logo?: string;
  runtime?: number;
  watched?: boolean;
  watch_providers?: any;
  collection?: any;
  videos?: any;
};

export type TVShow = {
  id: number;
  firebaseId?: string;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  backdrop_path: string;
  logo?: string;
  watch_providers?: any;
  videos?: any;
  seasons?: TVSeason[];
};

export type TVSeason = {
  id: number;
  air_date: string;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string;
  episodes: TVEpisode[];
};

export type TVEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  runtime?: number;
  air_date: string;
  still_path: string;
  watched?: boolean;
};

export const useFirebaseMovies = () => {
  const queryClient = useQueryClient();

  const fetchStoredMovies = async (): Promise<Movie[]> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/movies.json`
    );
    const data = (await response.json()) as Record<string, Movie>;
    return data
      ? Object.entries(data).map(([key, movie]) => ({
          ...movie,
          firebaseId: key,
        }))
      : [];
  };

  const moviesQuery = useQuery({
    queryKey: ["firebaseMovies"],
    queryFn: fetchStoredMovies,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });

  // 🔥 Listener en temps réel
  useEffect(() => {
    const dbRef = ref(db, "movies");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Movie>;
      const movies = data
        ? Object.entries(data).map(([key, movie]) => ({
            ...movie,
            firebaseId: key,
          }))
        : [];

      // ➡️ Mise à jour du cache React Query
      queryClient.setQueryData(["firebaseMovies"], movies);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return moviesQuery;
};

export const useAddMovie = () => {
  const queryClient = useQueryClient();

  const addMovie = async (movie: Movie): Promise<void> => {
    const [details, watchProviders, videos, images] = await Promise.all([
      TMDB.fetchMovieDetails(movie.id.toString()),
      TMDB.fetchMovieWatchProviders(movie.id.toString()),
      TMDB.fetchMovieVideos(movie.id.toString()),
      TMDB.fetchMovieImages(movie.id.toString()),
    ]);

    const providersFR = watchProviders.results["FR"];
    const logo =
      images.logos.find((l: any) => l.iso_3166_1 === "FR")?.file_path ??
      images.logos.find((l: any) => l.iso_3166_1 === "US")?.file_path ??
      images.logos[0]?.file_path ??
      undefined;

    // enrichir l'objet
    const enrichedMovie: Movie = {
      ...movie,
      watch_providers: providersFR?.flatrate ?? [],
      videos: videos.results ?? [],
      logo,
      collection: details.belongs_to_collection ?? undefined,
      runtime: details.runtime ?? undefined,
      watched: false,
    };

    // filtrer pour ne garder QUE les champs voulus
    const cleanMovie = filterMovieFields(enrichedMovie);

    console.log("Movie sent to Firebase:", cleanMovie);

    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/movies.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanMovie),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add movie");
    }
  };
  const mutation = useMutation({
    mutationFn: addMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseMovies"] });
    },
  });

  return mutation;
};

export const useUpdateMovie = () => {
  const queryClient = useQueryClient();
  const updateMovie = async ({
    movieId,
    updatedData,
  }: {
    movieId: string;
    updatedData: Partial<Movie>;
  }): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/movies/${movieId}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update movie");
    }
  };
  const mutation = useMutation({
    mutationFn: updateMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseMovies"] });
    },
  });

  return mutation;
};

export const useDeleteMovie = () => {
  const queryClient = useQueryClient();
  const deleteMovie = async (movieId: string): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/movies/${movieId}.json`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete movie");
    }
  };
  const mutation = useMutation({
    mutationFn: deleteMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseMovies"] });
    },
  });

  return mutation;
};

export const useFirebaseTVShows = () => {
  const queryClient = useQueryClient();
  const fetchStoredTVShows = async (): Promise<TVShow[]> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/tvshows.json`
    );
    const data = (await response.json()) as Record<string, TVShow>;
    return data
      ? Object.entries(data).map(([key, tvShow]) => ({
          ...tvShow,
          firebaseId: key,
        }))
      : [];
  };

  const tvShowsQuery = useQuery({
    queryKey: ["firebaseTVShows"],
    queryFn: fetchStoredTVShows,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });

  // 🔥 Listener en temps réel
  useEffect(() => {
    const dbRef = ref(db, "tvshows");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() as Record<string, TVShow>;
      const tvShows = data
        ? Object.entries(data).map(([key, tvShow]) => ({
            ...tvShow,
            firebaseId: key,
          }))
        : [];

      // ➡️ Mise à jour du cache React Query
      queryClient.setQueryData(["firebaseTVShows"], tvShows);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return tvShowsQuery;
};

export const useAddTVShow = () => {
  const queryClient = useQueryClient();
  const addTVShow = async (tvShow: TVShow): Promise<void> => {
    const [details, watchProviders, videos, images] = await Promise.all([
      TMDB.fetchTVDetails(tvShow.id.toString()),
      TMDB.fetchTVWatchProviders(tvShow.id.toString()),
      TMDB.fetchTVVideos(tvShow.id.toString()),
      TMDB.fetchTVImages(tvShow.id.toString()),
    ]);
    const providersFR = watchProviders.results["FR"];

    const seasonsWithEpisodes = await Promise.all(
      details.seasons.map(async (season: any) => {
        const seasonDetails = await TMDB.fetchTVSeasonDetails(
          tvShow.id.toString(),
          season.season_number
        );
        return {
          ...season,
          episodes: seasonDetails.episodes,
        };
      })
    );

    const logo =
      images.logos.find((l: any) => l.iso_3166_1 === "FR")?.file_path ??
      images.logos.find((l: any) => l.iso_3166_1 === "US")?.file_path ??
      images.logos[0]?.file_path ??
      undefined;

    // enrichir l'objet
    const enrichedTVShow: TVShow = {
      ...tvShow,
      seasons: seasonsWithEpisodes,
      watch_providers: providersFR?.flatrate ?? [],
      videos: videos.results ?? [],
      logo,
    };
    // filtrer pour ne garder QUE les champs voulus
    const cleanTVShow = filterTVShowFields(enrichedTVShow);

    console.log("TV Show sent to Firebase:", cleanTVShow);
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/tvshows.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanTVShow),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to add TV show");
    }
  };
  const mutation = useMutation({
    mutationFn: addTVShow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseTVShows"] });
    },
  });

  return mutation;
};

export const useUpdateTVShow = () => {
  const queryClient = useQueryClient();
  const updateTVShow = async ({
    tvShowId,
    updatedData,
  }: {
    tvShowId: string;
    updatedData: Partial<TVShow>;
  }): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/tvshows/${tvShowId}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update TV show");
    }
  };
  const mutation = useMutation({
    mutationFn: updateTVShow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseTVShows"] });
    },
  });

  return mutation;
};

export const useDeleteTVShow = () => {
  const queryClient = useQueryClient();
  const deleteTVShow = async (tvShowId: string): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/tvshows/${tvShowId}.json`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete TV show");
    }
  };
  const mutation = useMutation({
    mutationFn: deleteTVShow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseTVShows"] });
    },
  });

  return mutation;
};
