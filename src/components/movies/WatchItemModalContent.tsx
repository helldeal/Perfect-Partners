import { useEffect, useMemo, useRef, useState } from "react";
import { Movie, TVSeason } from "../../api/models/movies";
import {
  AddButtonIcon,
  MutedIcon,
  RemoveButtonIcon,
  UnmutedIcon,
  WatchButtonIcon,
} from "../../assets/svgs";
import { ItemIconButton } from "../ItemIconButton";
import { streamingLinks } from "../../utils/movies";
import { formatRuntime, formatYearRange } from "../../utils/dates";
import { useAddMovie, useFirebaseMovies } from "../../api/firebase/movies";
import { useAddTVShow, useFirebaseTVShows } from "../../api/firebase/tvshows";
import { MediaListIndicator } from "./MediaListIndicator";
import { MediaListMapping } from "./MediaListMapping";
import { WatchItemModal } from "../../api/models/watchItemModal";
import { TMDB } from "../../api/tmdb";
import { MediaItemSearch } from "./MediaItemSearch";

export const WatchItemModalContent = ({ item }: { item: WatchItemModal }) => {
  const [enrichedItemState, setEnrichedItemState] =
    useState<WatchItemModal>(item);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const addMovieMutation = useAddMovie();
  const addTVShowMutation = useAddTVShow();
  const firebaseMoviesQuery = useFirebaseMovies();
  const firebaseTVShowsQuery = useFirebaseTVShows();

  const mediaItems = useMemo(
    () => [
      ...(firebaseMoviesQuery.data || []),
      ...(firebaseTVShowsQuery.data || []),
    ],
    [firebaseMoviesQuery.data, firebaseTVShowsQuery.data]
  );

  const handleAddToList = (item: WatchItemModal) => {
    if (!item.list) addMovieMutation.mutate(item.id);
    else if (item.list && item.list.length > 0) {
      if ((item.list as TVSeason[])[0].episodes) {
        addTVShowMutation.mutate(item.id);
      } else if ((item.list as Movie[])[0].collection) {
        (item.list as Movie[]).forEach((movie: Movie) => {
          addMovieMutation.mutate(movie.id);
        });
      }
    }
  };

  const recommendationsQueryResult = item.recommendationsQuery
    ? item.recommendationsQuery(item.id)
    : null;

  const creditsQueryResult = item.creditsQuery
    ? item.creditsQuery(item.id)
    : null;

  const shouldFetchDetails =
    !item.runtime && (!item.list || !(item.list[0] as TVSeason)?.episodes);

  const shouldFetchVideos = item.videos.length === 0;

  const shouldFetchProviders = item.watch_providers.length === 0;

  const shouldFetchImages = !item.logo;

  const detailsQuery = item.detailsQuery
    ? item.detailsQuery(item.id, { enabled: shouldFetchDetails })
    : { data: null };

  const videosQuery = item.videosQuery
    ? item.videosQuery(item.id, { enabled: shouldFetchVideos })
    : { data: null };

  const providersQuery = item.watchProvidersQuery
    ? item.watchProvidersQuery(item.id, { enabled: shouldFetchProviders })
    : { data: null };

  const imagesQuery = item.imagesQuery
    ? item.imagesQuery(item.id, { enabled: shouldFetchImages })
    : { data: null };

  // mémoire des données synchrones (runtime, videos, providers, logo, date partielle)
  const baseEnriched = useMemo(() => {
    const newItem: WatchItemModal = { ...item };

    // RUNTIME manquant → depuis detailsQuery.data.runtime
    if (detailsQuery?.data?.runtime) {
      newItem.runtime = detailsQuery.data.runtime;
    }

    // COLLECTION ID manquante → depuis item.list (adaptation : on prend la collection du 1er film)
    if (!item.collectionId && detailsQuery?.data?.belongs_to_collection?.id) {
      newItem.collectionId = detailsQuery.data.belongs_to_collection.id;
    }

    // VIDEOS manquantes
    if (videosQuery?.data?.results) {
      newItem.videos = videosQuery.data.results;
    }

    // WATCH PROVIDERS manquants (adaptation : providersQuery structure peut varier)
    if (providersQuery?.data?.results?.FR?.flatrate) {
      newItem.watch_providers = providersQuery.data.results.FR.flatrate;
    }

    // LOGO : bonus FR → US → fallback
    if (imagesQuery?.data?.logos) {
      const logos = imagesQuery.data.logos;
      const logoFR =
        logos.find((l: any) => l.iso_3166_1 === "FR")?.file_path ??
        logos.find((l: any) => l.iso_3166_1 === "US")?.file_path ??
        logos[0]?.file_path ??
        undefined;
      newItem.logo = logoFR;
    }

    // Si detailsQuery contient saisons, on peut calculer la date (mais pas encore les épisodes)
    if (shouldFetchDetails && detailsQuery?.data?.seasons) {
      newItem.date = formatYearRange(
        detailsQuery.data.seasons
          .filter((season: any) => season.season_number !== 0)
          .map((season: any) => season.air_date)
          .filter((d: any) => d !== undefined) || []
      );
      // on place les saisons sans épisodes pour l'instant
      newItem.list = detailsQuery.data.seasons.filter(
        (season: any) => season.season_number !== 0
      );
    }

    return newItem;
  }, [
    item,
    detailsQuery?.data,
    videosQuery?.data,
    providersQuery?.data,
    imagesQuery?.data,
    shouldFetchDetails,
  ]);

  // --- useEffect pour gérer la partie async (saisons -> épisodes) ---
  useEffect(() => {
    let cancelled = false;

    // si il n'y a pas de saisons à enrichir -> on écrit baseEnriched synchronement
    if (
      !detailsQuery?.data?.seasons ||
      detailsQuery.data.seasons.length === 0
    ) {
      setEnrichedItemState(baseEnriched);
      return;
    }

    // Si les saisons existent mais ont déjà des épisodes dans item.list, on merge/retourne directement
    const firstListHasEpisodes =
      item.list &&
      (item.list[0] as any)?.episodes &&
      (item.list[0] as any).episodes.length > 0;
    if (firstListHasEpisodes) {
      // preferer l'item original si il contient déjà des episodes
      setEnrichedItemState(baseEnriched);
      return;
    }

    // Async fetch des saisons + episodes
    (async () => {
      try {
        // récupération des saisons depuis detailsQuery
        const seasons: any[] = detailsQuery.data.seasons ?? [];

        // fetch en parallèle les détails de chaque saison
        const seasonsWithEpisodes = await Promise.all(
          seasons
            .filter((season) => season.season_number !== 0)
            .map(async (season) => {
              const seasonDetails = await TMDB.fetchTVSeasonDetails(
                item.id.toString(),
                season.season_number
              );
              return {
                ...season,
                episodes: seasonDetails?.episodes ?? [],
              };
            })
        );

        if (cancelled) return;

        // merge avec baseEnriched (déjà contient runtime, videos, providers, logo, date)
        const merged = {
          ...baseEnriched,
          list: seasonsWithEpisodes,
        } as WatchItemModal;

        setEnrichedItemState(merged);
      } catch (err) {
        console.error("Erreur lors du fetch des saisons/episodes:", err);
        // fallback : on met la version synchrone
        if (!cancelled) setEnrichedItemState(baseEnriched);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baseEnriched, detailsQuery?.data, item.id, item.list]);

  const displayItem = enrichedItemState;

  const shouldFetchCollection = !!displayItem.collectionId;

  const collectionsQuery = displayItem.collectionQuery
    ? displayItem.collectionQuery(displayItem.collectionId, {
        enabled: shouldFetchCollection,
      })
    : { data: null };

  useEffect(() => {
    if (!iframeRef.current) return;

    const contentWindow = iframeRef.current.contentWindow;
    if (contentWindow) {
      contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: muted ? "mute" : "unMute",
          args: [],
        }),
        "*"
      );
      contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "setVolume",
          args: [50],
        }),
        "*"
      );
    }
  }, [muted]);
  return (
    <>
      <div className="relative">
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%" /* 16:9 */,
            paddingTop: "25px",
            width: "300%" /* enlarge beyond browser width */,
            left: "-100%" /* center */,
            zIndex: 20,
          }}
        >
          {displayItem.videos && displayItem.videos.length > 0 ? (
            <iframe
              ref={iframeRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
              className=" pointer-events-none"
              src={`https://www.youtube.com/embed/${displayItem.videos[0]?.key}?autoplay=1&controls=0&showinfo=0&modestbranding=1&rel=0&loop=1&playlist=${displayItem.videos[0]?.key}&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&mute=1`}
              title={displayItem.title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          ) : (
            displayItem.background_path && (
              <img
                src={`https://image.tmdb.org/t/p/w780${displayItem.background_path}`}
                alt={displayItem.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                className=" pointer-events-none object-contain"
              />
            )
          )}
        </div>
        <div
          className="absolute top-0 left-0 w-full h-full z-30"
          style={{
            background: "linear-gradient(0deg, #181818, transparent 50%)",
          }}
        >
          <div className="absolute bottom-1/10 mb-4 left-12 flex flex-col gap-4">
            {displayItem.logo ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${displayItem.logo}`}
                alt={displayItem.title}
                className="object-contain mb-6 max-w-xs"
              />
            ) : (
              <h1 className="text-4xl font-bold text-white">
                {displayItem.title}
              </h1>
            )}
            {displayItem.wishListed ? (
              <div className="flex space-x-4">
                {!displayItem.allWatched && (
                  <ItemIconButton
                    type="primary"
                    title="Watch"
                    handleClick={displayItem.handleAllWatch}
                  >
                    <WatchButtonIcon />
                  </ItemIconButton>
                )}
                <ItemIconButton
                  type="secondary"
                  title="Remove"
                  handleClick={displayItem.handleDelete}
                >
                  <RemoveButtonIcon />
                </ItemIconButton>
              </div>
            ) : (
              <button
                className="w-fit bg-white text-black px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleAddToList(displayItem)}
              >
                <AddButtonIcon />
                <span className="leading-none mb-0.5">Ajouter à la liste</span>
              </button>
            )}
          </div>
          {displayItem.videos && displayItem.videos.length > 0 ? (
            <div className="absolute bottom-1/10 mb-4 right-12 flex">
              <ItemIconButton
                type="secondary"
                title={muted ? "Unmute" : "Mute"}
                handleClick={() => setMuted(!muted)}
              >
                {muted ? <MutedIcon /> : <UnmutedIcon />}
              </ItemIconButton>
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-12 py-3 pb-12 text-white z-30 relative flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex space-x-4 mt-2 text-gray-400 items-center mb-4">
              <p>{displayItem.date}</p>
              <MediaListIndicator list={displayItem.list ?? []} />
              {displayItem.runtime && (
                <p>{formatRuntime(displayItem.runtime)}</p>
              )}
            </div>
            <p className="mb-2 line-clamp-4">{displayItem.overview}</p>
          </div>
          <div className="col-span-1 flex flex-col items-end">
            {displayItem.watch_providers ? (
              displayItem.watch_providers?.slice(0, 3).map((provider) => {
                const link = streamingLinks[provider.provider_id] || null;
                return (
                  <img
                    key={provider.provider_id}
                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                    alt={provider.provider_name}
                    className={`mb-2 ml-2 object-contain w-8 h-8 ${
                      link ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (link) {
                        window.open(link, "_blank");
                      }
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
        <MediaListMapping
          list={displayItem.list ?? []}
          handleWatchItem={item.handleWatchItem}
          handleUnwatchItem={item.handleUnwatchItem}
        />
        {collectionsQuery && collectionsQuery.data && (
          <div className="mt-6 relative">
            <h2 className="text-2xl mb-4">{collectionsQuery.data.name}</h2>
            <div className="grid grid-cols-5 gap-4 pb-4">
              {collectionsQuery.data.parts.map((item: any) => (
                <MediaItemSearch
                  key={item.id}
                  item={
                    mediaItems.find((mediaItem) => mediaItem.id === item.id) ??
                    item
                  }
                />
              ))}
            </div>
            <img
              src={`https://image.tmdb.org/t/p/w1280${collectionsQuery.data.backdrop_path}`}
              alt={collectionsQuery.data.name}
              className="absolute top-0 left-0 w-full h-full object-cover opacity-70 -z-10 rounded-lg scale-105"
            />
          </div>
        )}
        {recommendationsQueryResult && recommendationsQueryResult.data && (
          <div className="mt-6">
            <h2 className="text-2xl mb-4">Recommandations</h2>
            <div className="grid grid-cols-5 gap-4 pb-4">
              {recommendationsQueryResult.data.results
                .slice(0, 10)
                .map((item: any) => (
                  <MediaItemSearch
                    key={item.id}
                    item={
                      mediaItems.find(
                        (mediaItem) => mediaItem.id === item.id
                      ) ?? item
                    }
                  />
                ))}
            </div>
          </div>
        )}
        {creditsQueryResult && creditsQueryResult.data && (
          <div className="mt-6">
            <h2 className="text-2xl mb-4">Crédits</h2>
            <div className="grid grid-cols-5 gap-4 pb-4">
              {creditsQueryResult.data.cast.slice(0, 10).map((person: any) => (
                <div key={person.id} className="flex flex-col items-center">
                  <img
                    src={
                      person.profile_path
                        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                        : "https://via.placeholder.com/185x278?text=No+Image"
                    }
                    alt={person.name}
                    className="w-24 h-36 object-cover rounded mb-2"
                  />
                  <p>{person.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
