import { RelatedSkeleton } from "../../Skeleton";
import { MediaItem, Movie } from "../../../api/models/movies";
import { MediaItemSearch } from "../MediaItemSearch";

type CollectionData = {
  name: string;
  backdrop_path: string;
  parts: Movie[];
};

type RecommendationData = {
  results: MediaItem[];
};

type CastMember = {
  id: number;
  name: string;
  profile_path?: string;
  character?: string;
  known_for_department?: string;
};

type CreditsData = {
  cast: CastMember[];
};

type MediaModalRelatedProps = {
  currentItemId: number;
  mediaItems: MediaItem[];
  collection?: CollectionData | null;
  recommendations?: RecommendationData | null;
  credits?: CreditsData | null;
  collectionLoading?: boolean;
  recommendationsLoading?: boolean;
  creditsLoading?: boolean;
};

const findStoredItem = (item: MediaItem, mediaItems: MediaItem[]) =>
  mediaItems.find((mediaItem) => mediaItem.id === item.id) ?? item;

export const MediaModalRelated = ({
  currentItemId,
  mediaItems,
  collection,
  recommendations,
  credits,
  collectionLoading,
  recommendationsLoading,
  creditsLoading,
}: MediaModalRelatedProps) => (
  <>
    {collectionLoading && <RelatedSkeleton title="Collection" />}
    {recommendationsLoading && <RelatedSkeleton title="Recommandations" />}
    {creditsLoading && <RelatedSkeleton title="Crédits" />}
    {collection && (
      <div className="relative mt-6 p-4 sm:p-5">
        <h2 className="mb-4 text-xl sm:text-2xl">{collection.name}</h2>
        <div className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {[...collection.parts]
            .sort((a, b) => a.release_date.localeCompare(b.release_date))
            .map((movie) => (
              <div
                className="opacity-90 transition-opacity hover:opacity-100"
                key={movie.id}
              >
                <MediaItemSearch
                  item={findStoredItem(movie, mediaItems)}
                  itemSelected={movie.id === currentItemId}
                />
              </div>
            ))}
        </div>
        <img
          src={`https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`}
          alt={collection.name}
          className="absolute left-0 top-0 -z-10 h-full w-full rounded-xl object-cover opacity-70"
        />
      </div>
    )}

    {recommendations && (
      <div className="mt-6">
        <h2 className="mb-4 text-xl sm:text-2xl">Recommandations</h2>
        <div className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {recommendations.results.slice(0, 10).map((item) => (
            <MediaItemSearch
              key={item.id}
              item={findStoredItem(item, mediaItems)}
              showStatusBadge
            />
          ))}
        </div>
      </div>
    )}

    {credits && credits.cast.length > 0 && (
      <section className="mt-6" aria-labelledby="credits-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="credits-title" className="text-xl font-semibold sm:text-2xl">Crédits</h2>
            <p className="mt-1 text-xs text-app-muted sm:text-sm">Distribution principale</p>
          </div>
          <span className="shrink-0 rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-xs font-medium text-app-muted">
            {Math.min(credits.cast.length, 10)} personnes
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {credits.cast.slice(0, 10).map((person) => (
            <article key={person.id} className="group overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-md shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-app-primary/40 hover:shadow-xl hover:shadow-black/20">
              <div className="relative aspect-[2/3] overflow-hidden bg-app-surface-elevated">
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                    alt={person.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-app-surface-elevated to-app-primary-soft text-app-muted">
                    <svg viewBox="0 0 24 24" className="mb-2 h-12 w-12 opacity-70" fill="none" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-medium">Photo indisponible</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
              </div>
              <div className="min-h-20 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-app-text sm:text-base">{person.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-app-muted sm:text-sm">
                  {person.character ? `dans le rôle de ${person.character}` : person.known_for_department ?? "Interprète"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    )}
  </>
);
