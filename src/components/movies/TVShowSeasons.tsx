import { useState } from "react";
import { TVSeason } from "../../api/models/movies";
import { UnwatchButtonIcon, WatchButtonIcon } from "../../assets/svgs";
import { formatRuntime } from "../../utils/dates";
import { ItemIconButton } from "../ItemIconButton";

type TVShowSeasonsProps = {
  seasons: TVSeason[];
  handleWatchItem?: (id: string, list?: TVSeason[]) => void;
  handleUnwatchItem?: (id: string, list?: TVSeason[]) => void;
};

export const TVShowSeasons = ({ seasons, handleWatchItem, handleUnwatchItem }: TVShowSeasonsProps) => (
  <section className="flex flex-col gap-3" aria-label="Saisons et épisodes">
    {seasons.map((season) => season.episodes ? (
      <SeasonSection key={season.id} season={season} seasons={seasons} handleWatchItem={handleWatchItem} handleUnwatchItem={handleUnwatchItem} />
    ) : null)}
  </section>
);

const SeasonSection = ({ season, seasons, handleWatchItem, handleUnwatchItem }: TVShowSeasonsProps & { season: TVSeason }) => {
  const episodes = season.episodes ?? [];
  const watchedCount = episodes.filter((episode) => episode.watched).length;
  const isInProgress = watchedCount > 0 && watchedCount < episodes.length;
  const isComplete = episodes.length > 0 && watchedCount === episodes.length;
  const progress = episodes.length ? (watchedCount / episodes.length) * 100 : 0;
  const hasWatchedEpisode = seasons.some((item) =>
    item.episodes?.some((episode) => episode.watched)
  );
  const [isOpen, setIsOpen] = useState(
    isInProgress || (!hasWatchedEpisode && season.season_number === 1)
  );

  return (
    <details open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)} className="group/season overflow-hidden rounded-xl border border-app-border bg-app-surface/70 shadow-lg shadow-black/10 transition-colors open:border-app-primary/30">
      <summary className="cursor-pointer list-none transition-colors hover:bg-white/4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <img
            src={`https://image.tmdb.org/t/p/w185${season.poster_path}`}
            alt=""
            className="h-16 w-11 shrink-0 rounded-md bg-app-surface-elevated object-cover shadow-md sm:h-20 sm:w-14"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-app-text sm:text-lg">{season.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${isComplete ? "bg-app-success-soft text-app-success" : isInProgress ? "bg-app-primary-soft text-app-primary" : "bg-white/7 text-app-muted"}`}>
                {isComplete ? "Terminée" : isInProgress ? "En cours" : "À voir"}
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-app-muted sm:text-sm">
              <span>{watchedCount} sur {episodes.length} épisodes regardés</span>
              <span className="font-medium text-app-text">{Math.round(progress)} %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-app-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface-elevated text-app-muted transition-transform group-open/season:rotate-180" aria-hidden="true">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </summary>
      <div className="flex flex-col border-t border-app-border bg-black/10 p-2 sm:p-3">
        {episodes.map((episode) => (
          <article key={episode.id} className={`group/episode flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 sm:gap-4 sm:p-3 ${episode.watched ? "text-app-muted" : "text-app-text"}`}>
            <div className="w-8 shrink-0 text-center text-xs font-semibold text-app-muted sm:w-10 sm:text-sm">{episode.episode_number}</div>
            <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-app-surface-elevated sm:w-36">
                {episode.still_path ? <img src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} alt="" className={`h-full w-full object-cover transition-opacity ${episode.watched ? "opacity-60" : ""}`} /> : <div className="flex h-full items-center justify-center text-xs text-app-muted">Aperçu indisponible</div>}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/episode:opacity-100 sm:group-focus-within/episode:opacity-100">
                  <ItemIconButton
                    handleClick={() => episode.watched ? handleUnwatchItem?.(episode.id.toString(), seasons) : handleWatchItem?.(episode.id.toString(), seasons)}
                    title={episode.watched ? "Marquer comme non regardé" : "Marquer comme regardé"}
                    type={episode.watched ? "secondary" : "primary"}
                  >
                    {episode.watched ? <UnwatchButtonIcon /> : <WatchButtonIcon />}
                  </ItemIconButton>
                </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className={`line-clamp-2 text-sm font-semibold sm:text-base ${episode.watched ? "text-app-muted" : "text-app-text"}`}>{episode.name}</h4>
                {episode.watched && <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-app-success sm:flex"><span aria-hidden="true">✓</span> Regardé</span>}
              </div>
              {episode.overview && <p className="mb-1 line-clamp-2 text-xs text-app-muted sm:text-sm">{episode.overview}</p>}
              {episode.runtime && <p className="text-xs text-app-muted">{formatRuntime(episode.runtime)}</p>}
            </div>
          </article>
        ))}
      </div>
    </details>
  );
};
