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
};

const findStoredItem = (item: MediaItem, mediaItems: MediaItem[]) =>
  mediaItems.find((mediaItem) => mediaItem.id === item.id) ?? item;

export const MediaModalRelated = ({
  currentItemId,
  mediaItems,
  collection,
  recommendations,
  credits,
}: MediaModalRelatedProps) => (
  <>
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
            />
          ))}
        </div>
      </div>
    )}

    {credits && (
      <div className="mt-6">
        <h2 className="mb-4 text-xl sm:text-2xl">Crédits</h2>
        <div className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {credits.cast.slice(0, 10).map((person) => (
            <div key={person.id} className="flex flex-col items-center">
              <img
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                    : "https://via.placeholder.com/185x278?text=Pas+d%27image"
                }
                alt={person.name}
                className="mb-1 h-24 w-16 rounded object-cover sm:mb-2 sm:h-36 sm:w-24"
              />
              <p className="line-clamp-2 text-center text-xs sm:text-sm">
                {person.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
);
