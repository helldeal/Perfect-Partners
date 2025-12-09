import React from "react";
import { MediaItem, Movie, TVShow } from "../../api/models/movies";
import { TVShowWatchItem } from "./TVShowsWatching";
import { isMovie, isTVShow } from "../../utils/movies";
import { MovieWatchItem } from "./MoviesWatching";
import { useAddTVShow, useFirebaseTVShows } from "../../api/firebase/tvshows";
import { useAddMovie, useFirebaseMovies } from "../../api/firebase/movies";

interface MediaItemSearchProps {
  item: MediaItem;
  itemSelected?: boolean;
}

export const MediaItemSearch: React.FC<MediaItemSearchProps> = ({
  item,
  itemSelected,
}) => {
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const handleAddToList = (item: MediaItem) => {
    if (isMovie(item)) {
      addMovieMutation.mutate(item.id);
    } else if (isTVShow(item)) {
      addTVShowMutation.mutate(item.id);
    }
  };

  return (
    <div className="transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      {isMovie(item) ? (
        <MovieWatchItem
          movie={item as Movie}
          onAdd={() => handleAddToList(item)}
          inWishlist={firebaseMoviesQuery.data?.some((m) => m.id === item.id)}
          itemSelected={itemSelected}
        />
      ) : (
        <TVShowWatchItem
          tvShow={item as TVShow}
          onAdd={() => handleAddToList(item)}
          inWishlist={firebaseTVShowsQuery.data?.some(
            (tv) => tv.id === item.id
          )}
        />
      )}
    </div>
  );
};
