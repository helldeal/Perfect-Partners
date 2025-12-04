import React from "react";
import { MediaItem, Movie, TVShow } from "../../api/models/movies";
import { TVShowWatchItem } from "./TVShowsWatching";
import { isMovie } from "../../utils/movies";
import { MovieWatchItem } from "./MoviesWatching";

interface MediaItemSearchProps {
  item: MediaItem;
}

export const MediaItemSearch: React.FC<MediaItemSearchProps> = ({ item }) => {
  return (
    <div className="transform transition-transform duration-350 hover:scale-110 cursor-pointer">
      {isMovie(item as MediaItem) ? (
        <MovieWatchItem key={(item as Movie).id} movie={item as Movie} />
      ) : (
        <TVShowWatchItem key={(item as TVShow).id} tvShow={item as TVShow} />
      )}
    </div>
  );
};
