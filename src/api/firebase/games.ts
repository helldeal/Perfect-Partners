import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Game } from "../models/games";
import { ref, onValue } from "firebase/database";
import { useEffect } from "react";
import { db } from "../../firebase/firebase";

export const useFirebaseGames = () => {
  const queryClient = useQueryClient();

  const fetchStoredGames = async (): Promise<Game[]> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games.json`
    );
    const data = (await response.json()) as Record<string, Game>;
    return data
      ? Object.entries(data).map(([key, game]) => ({
          ...game,
          firebaseId: key,
        }))
      : [];
  };

  const gamesQuery = useQuery({
    queryKey: ["firebaseGames"],
    queryFn: fetchStoredGames,
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });

  // 🔥 Listener en temps réel
  useEffect(() => {
    const dbRef = ref(db, "games");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Game>;
      const games = data
        ? Object.entries(data).map(([key, game]) => ({
            ...game,
            firebaseId: key,
          }))
        : [];

      // ➡️ Mise à jour du cache React Query
      queryClient.setQueryData(["firebaseGames"], games);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return gamesQuery;
};

export const useAddGame = () => {
  const queryClient = useQueryClient();
  const addGame = async (game: Game): Promise<void> => {
    game.status = undefined;
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${game.id}.json`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to add game");
    }
  };
  const mutation = useMutation({
    mutationFn: addGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseGames"] });
    },
  });
  return mutation;
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  const removeGame = async (firebaseId: string): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${firebaseId}.json`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete game");
    }
  };
  const mutation = useMutation({
    mutationFn: removeGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseGames"] });
    },
  });

  return mutation;
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  const updateGame = async ({
    firebaseId,
    updatedData,
  }: {
    firebaseId: string;
    updatedData: Partial<Game>;
  }): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${firebaseId}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update game");
    }
  };
  const mutation = useMutation({
    mutationFn: updateGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firebaseGames"] });
    },
  });

  return mutation;
};
