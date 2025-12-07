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
                    className="border-b rounded border-gray-500 pb-2 flex items-center gap-4 px-4"
                  >
                    <p
                      className="text-2xl text-center"
                      style={{ flex: "0 0 7%" }}
                    >
                      {episode.episode_number}
                    </p>
                    <div className="relative">
                      <img
                        src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                        alt={episode.name}
                        className="w-32 h-18 object-cover rounded"
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
                              title={"Mark as Unwatched"}
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
                            title={"Mark as Watched"}
                            type={"primary"}
                          >
                            <WatchButtonIcon />
                          </ItemIconButton>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: "0 0 70%" }}>
                      <div className="flex items-center gap-4 mb-1 justify-between">
                        <h4 className="text-lg">{`Episode ${episode.episode_number}: ${episode.name}`}</h4>
                        <p>{formatRuntime(episode.runtime!)}</p>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-3 mb-2">
                        {episode.overview}
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
            className="border-b rounded border-gray-500 pb-4 flex items-center gap-4 px-4"
          >
            <div className=" relative shrink-0">
              <img
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                className="w-32 h-48 object-cover rounded"
              />
              {movie.watched ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-70 transition-opacity">
                    <ItemIconButton
                      handleClick={() =>
                        handleUnwatchItem!(movie.id.toString())
                      }
                      title={"Mark as Unwatched"}
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
                    title={"Mark as Watched"}
                    type={"primary"}
                  >
                    <WatchButtonIcon />
                  </ItemIconButton>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p>{formatYearRange([movie.release_date])}</p>
              <div className="flex items-center gap-4 mb-1 justify-between">
                <h3 className="text-xl">{movie.title}</h3>
                <p>{formatRuntime(movie.runtime!)}</p>
              </div>
              <p className="text-gray-300 text-sm line-clamp-4">
                {movie.overview}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
};
