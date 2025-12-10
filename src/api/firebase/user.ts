import { useQueries } from "@tanstack/react-query";
import { User } from "firebase/auth";

export const useFirebaseUsers = (ids: string[]) => {
  const fetchUserById = async (id: string): Promise<User> => {
    const response = await fetch(
      `${import.meta.env.VITE_FIREBASE_DB_URL}/users/${id}.json`
    );
    const data = await response.json();
    return data as User;
  };

  const usersQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["firebaseUser", id],
      queryFn: () => fetchUserById(id),
      staleTime: Infinity,
    })),
  });
  const data = usersQueries
    .map((query) => query.data)
    .filter(Boolean) as User[];
  return data;
};
