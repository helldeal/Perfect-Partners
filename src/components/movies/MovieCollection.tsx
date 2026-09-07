import { Movie } from "../../api/models/movies";
import { UnwatchButtonIcon, WatchButtonIcon } from "../../assets/svgs";
import { formatRuntime, formatYearRange } from "../../utils/dates";
import { ItemIconButton } from "../ItemIconButton";
import { WatchProgress } from "./WatchProgress";

type MovieCollectionProps = {
  movies: Movie[];
  handleWatchItem?: (id: string) => void;
  handleUnwatchItem?: (id: string) => void;
};

export const MovieCollection = ({ movies, handleWatchItem, handleUnwatchItem }: MovieCollectionProps) => (
  <div className="mt-2 flex flex-col gap-4">
    {movies.map((movie) => (
      <div key={movie.id} className="flex flex-col items-start gap-2 rounded border-b border-gray-500 px-2 pb-4 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <div className="relative w-full shrink-0 sm:w-auto">
          <img src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} alt={movie.title} className="h-32 w-20 rounded object-cover sm:h-48 sm:w-32" />
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black opacity-0 transition-opacity hover:opacity-70">
            <ItemIconButton
              handleClick={() => movie.watched ? handleUnwatchItem?.(movie.id.toString()) : handleWatchItem?.(movie.id.toString())}
              title={movie.watched ? "Marquer comme non regardé" : "Marquer comme regardé"}
              type={movie.watched ? "secondary" : "primary"}
            >
              {movie.watched ? <UnwatchButtonIcon /> : <WatchButtonIcon />}
            </ItemIconButton>
          </div>
          {movie.watched && <div className="absolute bottom-0 left-0 right-0"><WatchProgress progress={100} /></div>}
        </div>
        <div className="flex w-full flex-1 flex-col gap-2">
          <p className="text-xs text-gray-400 sm:text-base">{formatYearRange([movie.release_date])}</p>
          <div className="mb-1 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h3 className="text-base font-semibold sm:text-xl">{movie.title}</h3>
            <p className="whitespace-nowrap text-xs text-gray-400 sm:text-base">{formatRuntime(movie.runtime!)}</p>
          </div>
          <p className="line-clamp-2 text-xs text-gray-300 sm:line-clamp-4 sm:text-sm">{movie.overview}</p>
        </div>
      </div>
    ))}
  </div>
);
