import { MediaItem, Movie, TVEpisode, TVSeason, TVShow } from "../api/movies";

export function isMovie(item: MediaItem): item is Movie {
  return "title" in item;
}

export function isTVShow(item: MediaItem): item is TVShow {
  return "name" in item;
}

export const streamingLinks: Record<number, string> = {
  8: "https://www.netflix.com/", // Netflix
  337: "https://www.disneyplus.com/", // Disney+
  9: "https://www.amazon.com/Prime-Video/", // Amazon Prime Video
  10: "https://www.amazon.com/Prime-Video/", // Amazon Video (purchase/rental)
  2: "https://www.apple.com/apple-tv-plus/", // Apple TV / Apple iTunes
  350: "https://www.apple.com/apple-tv-plus/", // Apple TV+ (alternate ID)
  15: "https://www.hulu.com/", // Hulu
  384: "https://www.max.com/", // HBO Max
  387: "https://www.peacocktv.com/", // Peacock Premium
  386: "https://www.peacocktv.com/", // Peacock (standard version)
  130: "https://www.sky.com/", // Sky Store
  35: "https://www.rakuten.tv/", // Rakuten TV
  76: "https://www.viaplay.com/", // Viaplay
  421: "https://www.joynplus.de/", // Joyn Plus (Germany)
  425: "https://www.paramountplus.com/", // Paramount+
  430: "https://www.starz.com/", // Starz
  440: "https://www.crunchyroll.com/", // Crunchyroll
  450: "https://www.showtime.com/", // Showtime
  460: "https://www.discoveryplus.com/", // Discovery+
  470: "https://www.amcplus.com/", // AMC+
  480: "https://www.britbox.com/", // BritBox
  490: "https://www.acorn.tv/", // Acorn TV
  500: "https://www.zee5.com/", // ZEE5
  510: "https://www.hotstar.com/", // Hotstar
  520: "https://www.fubo.tv/", // FuboTV
  530: "https://www.tubitv.com/", // Tubi
  540: "https://www.pluto.tv/", // Pluto TV
  550: "https://www.sling.com/", // Sling TV
  600: "https://www.mycanal.fr/", // myCANAL (France)
  610: "https://www.arte.tv/", // ARTE (France)
  620: "https://www.tf1.fr/tf1/", // TF1 (France)
  630: "https://www.france.tv/", // France.tv (France)
  640: "https://www.6play.fr/", // 6play (France)
  650: "https://www.allocine.fr/", // AlloCiné (France)
  660: "https://www.molotov.tv/", // Molotov.tv (France)
  670: "https://www.ocs.fr/", // OCS (France)
  680: "https://www.canalplus.com/", // Canal+ (France)
  690: "https://www.salto.fr/", // Salto (France)
  700: "https://www.orange.fr/", // Orange TV (France)
  710: "https://www.free.fr/freebox/", // Freebox TV (France)
};

export const filterMovieFields = (movie: any): Movie => {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    release_date: movie.release_date,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    watched: movie.watched ?? false,
    watch_providers: movie.watch_providers,
    collection: movie.collection,
    videos: movie.videos,
  };
};

export const filterTVShowFields = (tvShow: any): TVShow => {
  return {
    id: tvShow.id,
    name: tvShow.name,
    overview: tvShow.overview,
    first_air_date: tvShow.first_air_date,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    watch_providers: tvShow.watch_providers,
    videos: tvShow.videos,
    seasons: tvShow.seasons.map((season: any) => filterTVSeasonFields(season)),
  };
};

export const filterTVSeasonFields = (season: any): TVSeason => {
  return {
    id: season.id,
    air_date: season.air_date,
    name: season.name,
    overview: season.overview,
    season_number: season.season_number,
    poster_path: season.poster_path,
    episodes: season.episodes.map((episode: any) =>
      filterTVEpisodeFields(episode)
    ),
  };
};

export const filterTVEpisodeFields = (episode: any): TVEpisode => {
  return {
    id: episode.id,
    name: episode.name,
    overview: episode.overview,
    episode_number: episode.episode_number,
    air_date: episode.air_date,
    still_path: episode.still_path,
    watched: episode.watched ?? false,
  };
};
