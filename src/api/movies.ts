import { useQuery } from "@tanstack/react-query";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const db = getFirestore();

export type MediaItem = Movie | TVShow;

export type Status = "COMPLETED" | "WATCHING" | "PLAN_TO_WATCH";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  status: Status;
};

export type TVShow = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  status: Status;
};

const useFirebaseMovies = () => {
  const fetchStoredMovies = async (): Promise<Movie[]> => {
    const snapshot = await getDocs(collection(db, "movies"));
    return snapshot.docs
      .map((d) => {
        const data = d.data() as Record<string, any>;
        if (!data.title) return null;
        const id =
          typeof data.id === "number" ? data.id : Number(data.id ?? d.id);
        return {
          id,
          title: data.title,
          overview: data.overview ?? "",
          release_date: data.release_date ?? data.releaseDate ?? "",
          poster_path: data.poster_path ?? data.posterPath ?? "",
          status: (data.status ?? "PLAN_TO_WATCH") as Status,
        } as Movie;
      })
      .filter((m): m is Movie => m !== null);
  };
  const moviesQuery = useQuery({
    queryKey: ["firebaseMovies"],
    queryFn: fetchStoredMovies,
  });
  return moviesQuery;
};
