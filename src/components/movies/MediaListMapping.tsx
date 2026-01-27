import { TVSeason, Movie } from "../../api/models/movies";
import { formatRuntime, formatYearRange } from "../../utils/dates";
import { ItemIconButton } from "../ItemIconButton";
import { RemoveButtonIcon, WatchButtonIcon } from "../../assets/svgs";
import { WatchProgress } from "./WatchProgress";

export const MediaListMapping = ({
  list,
  handleWatchItem,
  handleUnwatchItem,
}: {
  list: TVSeason[] | Movie[];
  handleWatchItem?: (id: string, list?: TVSeason[]) => void;
  handleUnwatchItem?: (id: string, list?: TVSeason[]) => void;
}) => {
  if (list.length === 0) return null;
  if ((list[0] as TVSeason).season_number !== undefined) {
    const seasons = list as TVSeason[];
    return (
      <div className="flex flex-col gap-4">
        {seasons.map((season) => {
          return !season.episodes ? null : (
            <div key={season.id}>
              <h3 className="text-xl">{season.name}</h3>
              <div className="flex flex-col mt-2 gap-2">
                {season.episodes?.map((episode) => (
                  <div
                    key={episode.id}
                    className="border-b rounded border-gray-500 pb-2 flex gap-2 sm:gap-4 px-2 sm:px-4 items-center"
                  >
                    <div className="shrink-0 flex items-center min-w-0">
                      <p className="text-xs sm:text-lg font-semibold text-gray-400 w-10 sm:w-16">
                        Ep {episode.episode_number}
                      </p>
                      <div className="relative shrink-0">
                        <img
                          src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                          alt={episode.name}
                          className="w-24 sm:w-32 h-auto object-cover rounded"
                        />
                        {episode.watched ? (
                          <>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-70 transition-opacity">
                              <ItemIconButton
                                handleClick={() =>
                                  handleUnwatchItem!(
                                    episode.id.toString(),
                                    seasons
                                  )
                                }
                                title={"Marquer comme non regardé"}
                                type={"secondary"}
                              >
                                <RemoveButtonIcon />
                              </ItemIconButton>
                            </div>
                            <div className="absolute left-0 right-0 bottom-0">
                              <WatchProgress progress={100} />
                            </div>
                          </>
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-70 transition-opacity">
                            <ItemIconButton
                              handleClick={() =>
                                handleWatchItem!(episode.id.toString(), seasons)
                              }
                              title={"Marquer comme regardé"}
                              type={"primary"}
                            >
                              <WatchButtonIcon />
                            </ItemIconButton>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-2">
                        {episode.name}
                      </h4>
                      <p className="text-gray-300 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 mb-1">
                        {episode.overview}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {formatRuntime(episode.runtime!)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const movies = list as Movie[];
    return (
      <div className="flex flex-col mt-2 gap-4">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="border-b rounded border-gray-500 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-2 sm:px-4"
          >
            <div className="relative shrink-0 w-full sm:w-auto">
              <img
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                className="w-20 sm:w-32 h-32 sm:h-48 object-cover rounded"
              />
              {movie.watched ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-70 transition-opacity">
                    <ItemIconButton
                      handleClick={() =>
                        handleUnwatchItem!(movie.id.toString())
                      }
                      title={"Marquer comme non regardé"}
                      type={"secondary"}
                    >
                      <RemoveButtonIcon />
                    </ItemIconButton>
                  </div>
                  <div className="absolute left-0 right-0 bottom-0">
                    <WatchProgress progress={100} />
                  </div>
                </>
              ) : (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-70 transition-opacity">
                  <ItemIconButton
                    handleClick={() => handleWatchItem!(movie.id.toString())}
                    title={"Marquer comme regardé"}
                    type={"primary"}
                  >
                    <WatchButtonIcon />
                  </ItemIconButton>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1 w-full">
              <p className="text-xs sm:text-base text-gray-400">
                {formatYearRange([movie.release_date])}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mb-1 sm:justify-between">
                <h3 className="text-base sm:text-xl font-semibold">
                  {movie.title}
                </h3>
                <p className="text-xs sm:text-base text-gray-400 whitespace-nowrap">
                  {formatRuntime(movie.runtime!)}
                </p>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 sm:line-clamp-4">
                {movie.overview}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
};
