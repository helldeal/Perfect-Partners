import { useState } from "react";
import { getSearchMultiQuery } from "../api/tmdb";
import { Header } from "../components/Header";
import { useDebounce } from "../utils/useDebounce";
import {
  MediaItem,
  useAddMovie,
  useAddTVShow,
  useFirebaseMovies,
  useFirebaseTVShows,
} from "../api/movies";
import { isMovie, isTVShow } from "../utils/movies";

export const MoviesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedQuery = useDebounce(searchTerm, 400);
  const searchMultiQuery = getSearchMultiQuery(debouncedQuery);
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const searchList = debouncedQuery.length > 0 ? searchMultiQuery.data : null;

  const handleAddToList = (item: MediaItem) => {
    if (isMovie(item)) {
      addMovieMutation.mutate(item);
    } else if (isTVShow(item)) {
      addTVShowMutation.mutate(item);
    }
  };

  const mediaList = [
    ...(firebaseMoviesQuery.data || []),
    ...(firebaseTVShowsQuery.data || []),
  ];

  return (
    <div className="min-h-screen flex flex-col gap-6 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 p-8">
      <Header navSelected="movies" />
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a movie..."
          className="p-2 pr-8 w-full box-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSearchTerm("");
          }}
        />

        {searchTerm.length > 0 && (
          <span
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-2 cursor-pointer text-gray-600 select-none"
          >
            ✕
          </span>
        )}
      </div>
      {searchTerm.length > 0 && debouncedQuery.length > 0 ? (
        searchMultiQuery.isLoading ? (
          <p>Loading...</p>
        ) : searchList && searchList.length > 0 ? (
          <div className="flex gap-16 flex-wrap justify-center py-8">
            {searchList.map((item: any) => (
              <div
                key={item.id}
                className="text-center w-72 h-112 relative rounded-lg overflow-hidden transform transition-transform duration-200 hover:scale-120"
              >
                <img
                  src={
                    item.poster_path &&
                    `https://image.tmdb.org/t/p/w780${item.poster_path}`
                  }
                  alt={item.title || item.name}
                  className="absolute bg-gray-800 flex items-center justify-center w-full h-full object-cover"
                />
                <div className="absolute w-full h-full flex flex-col justify-around bg-black text-white opacity-0 hover:opacity-90 transition-opacity">
                  <h3 className="m-0 text-md font-bold">
                    {item.title || item.name}
                  </h3>
                  <h3>
                    {new Date(
                      item.release_date || item.first_air_date
                    ).toLocaleDateString() || "Date inconnue"}
                  </h3>
                  <div className="p-2">
                    <p className="text-sm text-justify leading-snug line-clamp-4">
                      {item.overview || "Aucune description disponible."}
                    </p>
                  </div>
                  {mediaList.some((movie) => movie.id === item.id) ? (
                    <span className="text-green-500 font-bold">
                      Added to your list
                    </span>
                  ) : (
                    <button
                      className="cursor-pointer"
                      onClick={() => handleAddToList(item)}
                    >
                      Add to List
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No results found.</p>
        )
      ) : (
        mediaList && (
          <div>
            <h2 className="text-2xl font-bold mb-4">My Movie List</h2>
            {mediaList.map((movie) => (
              <div key={movie.id} className="mb-2">
                <h3 className="text-xl font-semibold">
                  {isMovie(movie) ? movie.title : movie.name}
                </h3>
                <p className="text-sm">
                  Released on:{" "}
                  {isMovie(movie)
                    ? movie.release_date
                    : movie.first_air_date || "Unknown"}
                </p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
