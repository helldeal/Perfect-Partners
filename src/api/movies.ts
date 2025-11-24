import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TMDB } from "./tmdb";
import { useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/firebase";
import { filterMovieFields, filterTVShowFields } from "../utils/movies";

export type MediaItem = Movie | TVShow;

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  watched?: boolean;
  watch_providers?: any;
  collection?: any;
  videos?: any;
};

export type TVShow = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  backdrop_path: string;
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
    const data = await response.json();
    return data ? Object.values(data) : [];
  };

  const moviesQuery = useQuery({
    queryKey: ["firebaseMovies"],
    queryFn: fetchStoredMovies,
  });

  // 🔥 Listener en temps réel
  useEffect(() => {
    const dbRef = ref(db, "movies");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const movies = data ? Object.values(data) : [];

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
    const [details, watchProviders, videos] = await Promise.all([
      TMDB.fetchMovieDetails(movie.id.toString()),
      TMDB.fetchMovieWatchProviders(movie.id.toString()),
      TMDB.fetchMovieVideos(movie.id.toString()),
    ]);

    const providersFR = watchProviders.results["FR"];

    // enrichir l'objet
    const enrichedMovie = {
      ...movie,
      watch_providers: providersFR?.flatrate ?? [],
      videos: videos.results ?? [],
      collection: details.belongs_to_collection ?? null,
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

export const useFirebaseTVShows = () => {
  const queryClient = useQueryClient();
  const fetchStoredTVShows = async (): Promise<TVShow[]> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/tvshows.json`
    );
    const data = await response.json();
    return data ? Object.values(data) : [];
  };

  const tvShowsQuery = useQuery({
    queryKey: ["firebaseTVShows"],
    queryFn: fetchStoredTVShows,
  });

  // 🔥 Listener en temps réel
  useEffect(() => {
    const dbRef = ref(db, "tvshows");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const tvShows = data ? Object.values(data) : [];

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
    const [details, watchProviders, videos] = await Promise.all([
      TMDB.fetchTVDetails(tvShow.id.toString()),
      TMDB.fetchTVWatchProviders(tvShow.id.toString()),
      TMDB.fetchTVVideos(tvShow.id.toString()),
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

    // enrichir l'objet
    const enrichedTVShow = {
      ...tvShow,
      seasons: seasonsWithEpisodes,
      watch_providers: providersFR?.flatrate ?? [],
      videos: videos.results ?? [],
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
