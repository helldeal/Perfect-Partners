import { WatchItemModal } from "../../../api/models/watchItemModal";
import { formatRuntime } from "../../../utils/dates";
import { streamingLinks } from "../../../utils/movies";
import { MediaListIndicator } from "../MediaListIndicator";

export const MediaModalSummary = ({ item }: { item: WatchItemModal }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
    <div className="col-span-1 sm:col-span-2">
      {!!item.newSeasonAt &&
        Date.now() - item.newSeasonAt < 14 * 24 * 60 * 60 * 1000 && (
          <span className="mb-2 inline-flex rounded-full bg-app-primary-soft px-2.5 py-1 text-xs font-semibold text-app-primary ring-1 ring-app-primary/40">
            Nouvelle saison
          </span>
        )}
      <div className="mb-4 mt-2 flex flex-wrap items-center gap-2 space-x-4 text-gray-400">
        <p>{item.date}</p>
        <MediaListIndicator list={item.list ?? []} />
        {item.runtime && <p>{formatRuntime(item.runtime)}</p>}
      </div>
      <p className="mb-2 line-clamp-4">{item.overview}</p>
    </div>
    <div className="col-span-1 flex flex-row justify-between gap-4 sm:justify-end">
      <div className="mb-4 flex flex-col">
        {item.watch_providers ? (
          item.watch_providers.slice(0, 3).map((provider) => {
            const link = streamingLinks[provider.provider_id] || null;

            return (
              <img
                key={provider.provider_id}
                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                alt={provider.provider_name}
                className={`mb-2 ml-2 h-8 w-8 object-contain ${
                  link ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                onClick={() => {
                  if (link) window.open(link, "_blank");
                }}
              />
            );
          })
        ) : (
          <p className="text-sm text-gray-400">
            Aucun fournisseur de streaming disponible
          </p>
        )}
      </div>
    </div>
  </div>
);
