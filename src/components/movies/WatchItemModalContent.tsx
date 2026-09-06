import { useEffect, useMemo, useRef, useState } from "react";
import { Movie, TVSeason } from "../../api/models/movies";
import { formatYearRange } from "../../utils/dates";
import { useAddMovie, useFirebaseMovies } from "../../api/firebase/movies";
import { useAddTVShow, useFirebaseTVShows } from "../../api/firebase/tvshows";
import { MediaListMapping } from "./MediaListMapping";
import { WatchItemModal } from "../../api/models/watchItemModal";
import { TMDB } from "../../api/tmdb";
import { MediaModalHero } from "./modal/MediaModalHero";
import { MediaModalRelated } from "./modal/MediaModalRelated";
import { MediaModalSummary } from "./modal/MediaModalSummary";

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
      <MediaModalHero
        item={displayItem}
        iframeRef={iframeRef}
        muted={muted}
        onAdd={handleAddToList}
        onToggleMuted={() => setMuted((currentMuted) => !currentMuted)}
      />
      <div className="px-4 sm:px-12 py-3 pb-12 text-white z-30 relative flex flex-col gap-6">
        <MediaModalSummary item={displayItem} />
        <MediaListMapping
          list={displayItem.list ?? []}
          handleWatchItem={item.handleWatchItem}
          handleUnwatchItem={item.handleUnwatchItem}
        />
        <MediaModalRelated
          currentItemId={displayItem.id}
          mediaItems={mediaItems}
          collection={collectionsQuery.data}
          recommendations={recommendationsQueryResult?.data}
          credits={creditsQueryResult?.data}
        />
      </div>
    </>
  );
};
