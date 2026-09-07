import { useState } from "react";
import { TVSeason } from "../../api/models/movies";
import { UnwatchButtonIcon, WatchButtonIcon } from "../../assets/svgs";
import { formatRuntime } from "../../utils/dates";
import { ItemIconButton } from "../ItemIconButton";
import { WatchProgress } from "./WatchProgress";

type TVShowSeasonsProps = {
  seasons: TVSeason[];
  handleWatchItem?: (id: string, list?: TVSeason[]) => void;
  handleUnwatchItem?: (id: string, list?: TVSeason[]) => void;
};

export const TVShowSeasons = ({ seasons, handleWatchItem, handleUnwatchItem }: TVShowSeasonsProps) => (
  <div className="flex flex-col gap-4">
    {seasons.map((season) => season.episodes ? (
      <SeasonSection key={season.id} season={season} seasons={seasons} handleWatchItem={handleWatchItem} handleUnwatchItem={handleUnwatchItem} />
    ) : null)}
  </div>
);

const SeasonSection = ({ season, seasons, handleWatchItem, handleUnwatchItem }: TVShowSeasonsProps & { season: TVSeason }) => {
  const episodes = season.episodes ?? [];
  const watchedCount = episodes.filter((episode) => episode.watched).length;
  const isInProgress = watchedCount > 0 && watchedCount < episodes.length;
  const hasWatchedEpisode = seasons.some((item) =>
    item.episodes?.some((episode) => episode.watched)
  );
  const [isOpen, setIsOpen] = useState(
    isInProgress || (!hasWatchedEpisode && season.season_number === 1)
  );

  return (
    <details open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)} className="group/season overflow-hidden rounded-lg border border-white/10 bg-white/3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-white/5 sm:px-4">
        <h3 className="text-base font-medium sm:text-xl">{season.name}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400 sm:text-sm">
          <span>{watchedCount}/{episodes.length} épisodes</span>
          <span className="text-lg transition-transform group-open/season:rotate-180">⌄</span>
        </div>
      </summary>
      <div className="flex flex-col gap-2 border-t border-white/10 p-2 sm:p-3">
        {episodes.map((episode) => (
          <div key={episode.id} className="flex items-center gap-2 rounded border-b border-gray-500 px-2 pb-2 sm:gap-4 sm:px-4">
            <div className="flex min-w-0 shrink-0 items-center">
              <p className="w-10 text-xs font-semibold text-gray-400 sm:w-16 sm:text-lg">Ep {episode.episode_number}</p>
              <div className="relative shrink-0">
                <img src={`https://image.tmdb.org/t/p/w185${episode.still_path}`} alt={episode.name} className="h-auto w-24 rounded object-cover sm:w-32" />
                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black opacity-0 transition-opacity hover:opacity-70">
                  <ItemIconButton
                    handleClick={() => episode.watched ? handleUnwatchItem?.(episode.id.toString(), seasons) : handleWatchItem?.(episode.id.toString(), seasons)}
                    title={episode.watched ? "Marquer comme non regardé" : "Marquer comme regardé"}
                    type={episode.watched ? "secondary" : "primary"}
                  >
                    {episode.watched ? <UnwatchButtonIcon /> : <WatchButtonIcon />}
                  </ItemIconButton>
                </div>
                {episode.watched && <div className="absolute bottom-0 left-0 right-0"><WatchProgress progress={100} /></div>}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-xs font-semibold sm:line-clamp-2 sm:text-base">{episode.name}</h4>
              <p className="mb-1 line-clamp-1 text-xs text-gray-300 sm:line-clamp-2 sm:text-sm">{episode.overview}</p>
              <p className="text-xs text-gray-400 sm:text-sm">{formatRuntime(episode.runtime!)}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};
