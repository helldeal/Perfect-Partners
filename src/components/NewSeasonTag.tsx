export const NewSeasonTag = ({ compact = false }: { compact?: boolean }) =>
  compact ? (
    <span className="flex max-w-full items-center overflow-hidden rounded-sm border border-app-primary/50 bg-app-primary/95 text-white shadow-lg shadow-black/30 backdrop-blur-sm">
      <span className="truncate px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] sm:text-[9px]">
        Nouveaux épisodes
      </span>
    </span>
  ) : (
    <div className="flex items-center rounded-lg border border-app-border bg-linear-to-r from-app-accent-soft/65 to-app-surface px-3 py-2.5 shadow-lg shadow-app-accent/10">
      <span className="flex flex-col text-left">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-app-accent">
          À découvrir
        </span>
        <span className="text-sm font-semibold text-app-text">
          Nouveaux épisodes disponibles
        </span>
      </span>
    </div>
  );
