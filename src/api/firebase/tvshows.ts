import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { ref, onValue } from "firebase/database";
import { useEffect } from "react";
import { db } from "../../firebase/firebase";
import { filterTVShowFields } from "../../utils/movies";
import { TVShow } from "../models/movies";
import { TMDB } from "../tmdb";

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
