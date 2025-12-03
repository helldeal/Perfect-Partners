import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ref, onValue } from "firebase/database";
import { useEffect } from "react";
import { db } from "../../firebase/firebase";
import { filterMovieFields } from "../../utils/movies";
import { Movie } from "../models/movies";
import { TMDB } from "../tmdb";

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

  const addMovie = async (id: number): Promise<void> => {
    const [details, watchProviders, videos, images] = await Promise.all([
      TMDB.fetchMovieDetails(id.toString()),
      TMDB.fetchMovieWatchProviders(id.toString()),
      TMDB.fetchMovieVideos(id.toString()),
      TMDB.fetchMovieImages(id.toString()),
    ]);

    const movie = details; // Les détails du film contiennent déjà les champs de base

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

    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/movies/${cleanMovie.id}.json`,
      {
        method: "PUT",
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
