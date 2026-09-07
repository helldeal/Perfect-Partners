import { useEffect, useRef } from "react";
import { Game } from "../api/models/games";
import { Movie, TVShow } from "../api/models/movies";
import {
  checkTVShowForNewSeasons,
  refreshGameMetadata,
  refreshMovieMetadata,
  refreshTVShowMetadata,
} from "../api/systemUpdates";

const HOUR = 60 * 60 * 1000;

const runThrottled = async (
  lastUpdatedAt: number | undefined,
  interval: number,
  action: () => Promise<boolean>,
  onStart?: () => void,
  onFinish?: () => void
) => {
  if (Date.now() - (lastUpdatedAt ?? 0) < interval) return false;

  onStart?.();
  try {
    return await action();
  } catch (error) {
    console.error("Échec d'une mise à jour système", error);
    return false;
  } finally {
    onFinish?.();
  }
};

export const useTVShowSeasonUpdates = (tvShows: TVShow[]) => {
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (tvShows.length === 0 || isCheckingRef.current) return;

    const checkAllTVShows = async () => {
      isCheckingRef.current = true;
      try {
        for (const tvShow of tvShows) {
          await runThrottled(
            tvShow.seasonCheckedAt,
            24 * HOUR,
            () => checkTVShowForNewSeasons(tvShow)
          );
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    void checkAllTVShows();
  }, [tvShows]);
};

const announceUpdateStarted = () =>
  window.dispatchEvent(new Event("system-update-started"));

const announceUpdateFinished = () =>
  window.dispatchEvent(new Event("system-update-finished"));

export const refreshMediaOnOpen = async (item: Movie | TVShow) => {
  await runThrottled(
    item.updatedAt,
    24 * HOUR,
    () =>
      "title" in item
        ? refreshMovieMetadata(item)
        : refreshTVShowMetadata(item),
    announceUpdateStarted,
    announceUpdateFinished
  );
};

export const refreshGameOnOpen = async (game: Game) => {
  await runThrottled(
    game.updatedAt,
    24 * HOUR,
    () => refreshGameMetadata(game),
    announceUpdateStarted,
    announceUpdateFinished
  );
};
