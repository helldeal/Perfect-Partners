import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Game } from "../models/games";
import { ref, onValue } from "firebase/database";
import { useEffect } from "react";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/authContext";
import { notifyOtherUsers } from "./notifications";
import { NotificationEvent } from "../models/notifications";

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
  const { currentUser } = useAuth();
  const addGame = async (game: Game): Promise<void> => {
    const gameToAdd = { ...game, status: undefined, updatedAt: Date.now() };
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${game.id}.json`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameToAdd),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to add game");
    }
    await notifyOtherUsers(currentUser, {
      action: "added",
      category: "games",
      itemId: game.id,
      itemName: game.name,
      image: game.cover,
    });
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
  const { currentUser } = useAuth();
  const removeGame = async (firebaseId: string): Promise<void> => {
    const game = queryClient
      .getQueryData<Game[]>(["firebaseGames"])
      ?.find((item) => item.id.toString() === firebaseId);
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${firebaseId}.json`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete game");
    }
    if (game) {
      await notifyOtherUsers(currentUser, {
        action: "deleted",
        category: "games",
        itemId: game.id,
        itemName: game.name,
        image: game.cover,
      });
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
  const { currentUser } = useAuth();
  const updateGame = async ({
    firebaseId,
    updatedData,
    notification,
  }: {
    firebaseId: string;
    updatedData: Partial<Game>;
    notification?: NotificationEvent;
  }): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/games/${firebaseId}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedData, updatedAt: Date.now() }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update game");
    }
    if (notification) {
      await notifyOtherUsers(currentUser, notification);
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
