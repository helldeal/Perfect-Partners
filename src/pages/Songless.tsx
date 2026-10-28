import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "../components/MainLayout";
import { SpotifyPlaylist, SpotifyTrack } from "../api/models/spotify";
import {
  fetchSpotifyPersonalizedTracks,
  fetchSpotifyPlaylists,
  fetchSpotifyPlaylistTracks,
} from "../api/spotify";
import { useSpotifyAuth } from "../hooks/useSpotifyAuth";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { deduplicateSpotifyTracks, normalizeSpotifyText } from "../utils/spotify";

const STEPS = [100, 500, 2_000, 8_000, 15_000] as const;
const PLAYLISTS_STORAGE_KEY = "perfect-partners.songless-playlists";
const PERSONALIZED_SOURCE_ID = "__personalized__";

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};

const playlistTrackCount = (playlist: SpotifyPlaylist) =>
  playlist.items?.total ?? playlist.tracks?.total ?? 0;

export const SonglessPage = () => {
  const spotifyAuth = useSpotifyAuth();
  const player = useSpotifyPlayer(spotifyAuth.connected);
  const { prepareTrack, ready: spotifyReady } = player;
  const preparationQueue = useRef<Promise<void>>(Promise.resolve());
  const [preparedTrack, setPreparedTrack] = useState<{ uri: string } | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [preparationAttempt, setPreparationAttempt] = useState(0);
  const [startingPlayback, setStartingPlayback] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(() => {
    try {
      return (JSON.parse(localStorage.getItem(PLAYLISTS_STORAGE_KEY) ?? "[]") as string[]).filter((id) => !id.startsWith("__genre__"));
    } catch {
      return [];
    }
  });
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<SpotifyTrack | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [mode, setMode] = useState<"blindtest" | "songless">("blindtest");
  const [enabledSteps, setEnabledSteps] = useState<number[]>([...STEPS]);
  const [roundMode, setRoundMode] = useState<"blindtest" | "songless">("songless");
  const [roundSteps, setRoundSteps] = useState<number[]>([...STEPS]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!spotifyAuth.connected || roundMode !== "songless" || !currentTrack || revealed || showSources) return;
    const controller = new AbortController();
    const { signal } = controller;
    setPreparedTrack(null);
    setPreparationError(null);
    const prepare = async () => {
      if (signal.aborted) return;
      if (!spotifyReady) return;
      try {
        await prepareTrack(currentTrack.uri, Math.min(10_000, Math.max(0, currentTrack.duration_ms - 16_000)), signal);
        if (!signal.aborted) setPreparedTrack({ uri: currentTrack.uri });
      } catch (reason) {
        if (!signal.aborted) setPreparationError(reason instanceof Error ? reason.message : "Chargement impossible.");
      }
    };
    preparationQueue.current = preparationQueue.current.catch(() => undefined).then(prepare);
    return () => { controller.abort(); };
  }, [currentTrack, roundMode, revealed, showSources, spotifyAuth.connected, spotifyReady, prepareTrack, preparationAttempt]);

  const songlessReady = preparedTrack?.uri === currentTrack?.uri && preparedTrack !== null;
  const songlessLoading = roundMode === "songless" && !songlessReady && !preparationError;

  useEffect(() => {
    if (!spotifyAuth.connected) return;
    setLoadingPlaylists(true);
    setError(null);
    void fetchSpotifyPlaylists()
      .then((items) => {
        setPlaylists(items);
        const availableIds = new Set(items.map((item) => item.id));
        setSelectedPlaylistIds((current) =>
          current.filter((id) => id === PERSONALIZED_SOURCE_ID || availableIds.has(id))
        );
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Impossible de charger les playlists.")
      )
      .finally(() => setLoadingPlaylists(false));
  }, [spotifyAuth.connected]);


  useEffect(() => {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(selectedPlaylistIds));
  }, [selectedPlaylistIds]);

  const nextTrack = useCallback(() => {
    setError(null);
    void player.pause();
    setQueue((currentQueue) => {
      const available = currentQueue.length > 0 ? [...currentQueue] : shuffle(tracks);
      const next = available.shift() ?? null;
      setCurrentTrack(next);
      return available;
    });
    setStepIndex(0);
    setQuery("");
    setSelectedAnswer(null);
    setRevealed(false);
    setResult(null);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [player, tracks]);

  const loadSelection = async () => {
    if (selectedPlaylistIds.length === 0 || !mode || (mode === "songless" && enabledSteps.length === 0)) return;
    setLoadingTracks(true);
    void player.activate()?.catch(() => undefined);
    setError(null);
    try {
      const lists = await Promise.all(
        selectedPlaylistIds.map((playlistId) => {
          if (playlistId === PERSONALIZED_SOURCE_ID) return fetchSpotifyPersonalizedTracks();
          return fetchSpotifyPlaylistTracks(playlistId);
        })
      );
      const uniqueTracks = deduplicateSpotifyTracks(lists.flat());
      if (uniqueTracks.length === 0) throw new Error("Aucun morceau jouable dans cette sélection.");
      await player.pause();
      const shuffled = shuffle(uniqueTracks);
      const first = shuffled.shift() ?? null;
      setTracks(uniqueTracks);
      setRoundMode(mode);
      setRoundSteps(STEPS.filter((duration) => enabledSteps.includes(duration)));
      setQueue(shuffled);
      setCurrentTrack(first);
      setStepIndex(0);
      setQuery("");
      setSelectedAnswer(null);
      setRevealed(false);
      setResult(null);
      setShowSources(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les morceaux.");
    } finally {
      setLoadingTracks(false);
    }
  };

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeSpotifyText(query);
    if (normalizedQuery.length < 2) return [];
    return tracks
      .filter((track) => {
        const haystack = normalizeSpotifyText(
          `${track.name} ${track.artists.map((artist) => artist.name).join(" ")}`
        );
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [query, tracks]);

  const revealAndPlay = (outcome: "correct" | "wrong") => {
    if (!currentTrack) return;
    setResult(outcome);
    setRevealed(true);
    if (roundMode === "blindtest" && player.playing) return;
    void player.playFullTrack(currentTrack.uri, roundMode === "blindtest" ? 0 : 10_000).catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Lecture impossible.")
    );
  };

  const miss = (skipped = false) => {
    setResult(skipped ? null : "wrong");
    setSelectedAnswer(null);
    setQuery("");
    if (roundMode === "blindtest") return;
    if (stepIndex < roundSteps.length - 1) setStepIndex((value) => value + 1);
    else revealAndPlay("wrong");
  };

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (!currentTrack || revealed) return;
    const answerIsCorrect = selectedAnswer
      ? selectedAnswer.id === currentTrack.id
      : normalizeSpotifyText(query) === normalizeSpotifyText(currentTrack.name);
    if (answerIsCorrect) {
      revealAndPlay("correct");
    } else {
      miss();
    }
  };

  const play = async () => {
    if (!currentTrack) return;
    setResult(null);
    if (roundMode === "blindtest") {
      const action = player.playing ? player.pause() : player.playFullTrack(currentTrack.uri, 0, true);
      void action.catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Lecture impossible."));
      return;
    }
    if (!songlessReady || startingPlayback) return;
    const startPositionMs = Math.min(
      10_000,
      Math.max(0, currentTrack.duration_ms - roundSteps[stepIndex] - 1_000)
    );
    setStartingPlayback(true);
    void player.playSnippet(currentTrack.uri, roundSteps[stepIndex], startPositionMs).catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Lecture impossible.")
    ).finally(() => setStartingPlayback(false));
  };


  return (
    <MainLayout navSelected="blindtest">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1ed760]">Blind test Spotify</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Blindtest</h1>
            <p className="mt-2 max-w-2xl text-app-muted">Retrouvez vos titres en Blindtest ou en Songless.</p>
          </div>
          {spotifyAuth.connected && (
            <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => { void player.pause(); setShowSources((value) => !value); }} className="cursor-pointer rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold transition hover:border-[#1ed760]/60 hover:text-[#1ed760]">
              {tracks.length > 0 ? (showSources ? "Revenir à la partie" : "Configurer une partie") : "Choisir les playlists"}
            </button>
              <button type="button" onClick={spotifyAuth.disconnect} className="cursor-pointer text-sm text-app-muted underline-offset-4 hover:text-app-text hover:underline">Déconnecter Spotify</button>
            </div>
          )}
        </header>

        {(spotifyAuth.error || error || player.error) && (
          <div role="alert" className="mb-6 rounded-2xl border border-app-danger/40 bg-app-danger-soft px-5 py-4 text-sm text-app-danger">
            {spotifyAuth.error ?? error ?? player.error}
          </div>
        )}

        {!spotifyAuth.connected ? (
          <section className="flex flex-1 items-center justify-center py-16">
            <div className="w-full max-w-xl rounded-3xl border border-app-border bg-app-surface p-8 text-center shadow-2xl sm:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1ed760]/15 text-4xl">♫</div>
              <h2 className="text-2xl font-bold">Connectez votre compte Spotify</h2>
              <p className="mx-auto mt-3 max-w-md text-app-muted">La connexion permet d'accéder à vos playlists et d'utiliser votre compte Premium pour lire les extraits.</p>
              <button type="button" disabled={spotifyAuth.loading} onClick={spotifyAuth.connect} className="mt-8 cursor-pointer rounded-full bg-[#1ed760] px-7 py-3 font-bold text-black transition hover:scale-[1.02] hover:bg-[#25e66a] disabled:cursor-wait disabled:opacity-60">
                {spotifyAuth.loading ? "Connexion…" : "Continuer avec Spotify"}
              </button>
              {!import.meta.env.VITE_SPOTIFY_CLIENT_ID && <p className="mt-5 text-xs text-app-warning">Le Client ID Spotify doit d'abord être ajouté à l'environnement.</p>}
            </div>
          </section>
        ) : (tracks.length === 0 || showSources) ? (
          <section className="rounded-3xl border border-app-border bg-app-surface p-5 sm:p-8">
            <fieldset className="mb-6">
              <legend className="text-2xl font-bold">Choisissez votre mode</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["blindtest", "songless"] as const).map((value) => (
                  <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 ${mode === value ? "border-[#1ed760] bg-[#1ed760]/10" : "border-app-border"}`}>
                    <input type="radio" name="game-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-[#1ed760]" />
                    <span><span className="block font-bold">{value === "blindtest" ? "Blindtest" : "Songless"}</span><span className="mt-1 block text-sm text-app-muted">{value === "blindtest" ? "Écoutez le morceau en continu et retrouvez son titre." : "Devinez le titre avec des extraits de plus en plus longs."}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            {mode === "songless" && (
              <fieldset className="mb-6 rounded-2xl border border-app-border bg-app-bg/40 p-4 sm:p-5">
                <legend className="px-2 text-sm font-semibold">Deviner après</legend>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {STEPS.map((duration) => (
                    <label key={duration} className="relative cursor-pointer">
                      <input type="checkbox" checked={enabledSteps.includes(duration)} disabled={enabledSteps.length === 1 && enabledSteps.includes(duration)} onChange={() => setEnabledSteps((current) => current.includes(duration) ? current.filter((item) => item !== duration) : [...current, duration])} className="peer sr-only" />
                      <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border border-app-border bg-app-surface text-xs font-bold tabular-nums text-app-muted transition-colors peer-checked:border-[#1ed760] peer-checked:bg-[#1ed760]/15 peer-checked:text-[#1ed760] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1ed760] peer-disabled:cursor-not-allowed sm:text-sm">
                        <span>{(duration / 1000).toLocaleString("fr-FR")} s</span>
                        <span aria-hidden="true" className="text-[10px] leading-none">{enabledSteps.includes(duration) ? "✓" : "−"}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-app-muted">Activez les paliers souhaités. Au moins un indice doit rester actif.</p>
              </fieldset>
            )}
            {mode && <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-app-border pb-6">
              <div>
                <h2 className="text-2xl font-bold">Sources musicales</h2>
                <p className="mt-1 text-sm text-app-muted">Mélangez une ou plusieurs playlists. Les doublons seront retirés.</p>
              </div>
            </div>

            {loadingPlaylists ? (
              <p className="py-16 text-center text-app-muted">Chargement de vos playlists…</p>
            ) : (
              <div className="my-6 grid max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition ${selectedPlaylistIds.includes(PERSONALIZED_SOURCE_ID) ? "border-[#1ed760] bg-[#1ed760]/10" : "border-app-border bg-app-bg/40 hover:border-app-muted"}`}>
                  <input type="checkbox" checked={selectedPlaylistIds.includes(PERSONALIZED_SOURCE_ID)} onChange={() => setSelectedPlaylistIds((current) => current.includes(PERSONALIZED_SOURCE_ID) ? current.filter((id) => id !== PERSONALIZED_SOURCE_ID) : [PERSONALIZED_SOURCE_ID, ...current])} className="sr-only" />
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ed760] to-[#0c7c3b] text-2xl font-black text-black">✦</div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate font-semibold">Pour moi<span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[10px] font-bold uppercase text-black">Auto</span></span>
                    <span className="block truncate text-xs text-app-muted">Tops, écoutes récentes et titres likés</span>
                  </span>
                  <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selectedPlaylistIds.includes(PERSONALIZED_SOURCE_ID) ? "border-[#1ed760] bg-[#1ed760] text-black" : "border-app-muted"}`}>{selectedPlaylistIds.includes(PERSONALIZED_SOURCE_ID) ? "✓" : ""}</span>
                </label>
                {playlists.map((playlist) => {
                  const selected = selectedPlaylistIds.includes(playlist.id);
                  return (
                    <label key={playlist.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition ${selected ? "border-[#1ed760] bg-[#1ed760]/10" : "border-app-border bg-app-bg/40 hover:border-app-muted"}`}>
                      <input type="checkbox" checked={selected} onChange={() => setSelectedPlaylistIds((current) => selected ? current.filter((id) => id !== playlist.id) : [...current, playlist.id])} className="sr-only" />
                      {playlist.images[0]?.url ? <img src={playlist.images[0].url} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-app-surface-elevated text-xl">♫</div>}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 truncate font-semibold">{playlist.name}</span>
                        <span className="block truncate text-xs text-app-muted">{playlist.owner.display_name ?? "Spotify"} · {playlistTrackCount(playlist)} titres</span>
                      </span>
                      <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#1ed760] bg-[#1ed760] text-black" : "border-app-muted"}`}>{selected ? "✓" : ""}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-app-border pt-6">
              <p className="text-sm text-app-muted">{selectedPlaylistIds.length} source{selectedPlaylistIds.length > 1 ? "s" : ""} sélectionnée{selectedPlaylistIds.length > 1 ? "s" : ""}</p>
              <button type="button" disabled={selectedPlaylistIds.length === 0 || loadingTracks || (mode === "songless" && enabledSteps.length === 0)} onClick={() => void loadSelection()} className="cursor-pointer rounded-full bg-[#1ed760] px-7 py-3 font-bold text-black transition hover:bg-[#25e66a] disabled:cursor-not-allowed disabled:opacity-40">
                {loadingTracks ? "Préparation…" : tracks.length > 0 ? "Relancer avec cette sélection" : "Commencer"}
              </button>
            </div>
            </>}
          </section>
        ) : currentTrack ? (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
            <div className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-2xl">
              <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1ed760]/20 via-app-surface-elevated to-app-accent-soft ${revealed ? "px-6 pb-8 pt-7 sm:px-12 sm:pb-10 sm:pt-9" : "min-h-64 p-8 sm:min-h-72"}`}>
                {revealed && currentTrack.album.images[0]?.url ? (
                  <img src={currentTrack.album.images[0].url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl" />
                ) : null}
                {revealed ? (
                  <div className="relative flex w-full flex-col items-center">
                    <p role="status" className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${result === "correct" ? "border-app-success/30 bg-app-success-soft text-app-success" : "border-app-warning/30 bg-app-warning-soft text-app-warning"}`}>
                      <span aria-hidden="true">{result === "correct" ? "✓" : "♫"}</span>
                      {result === "correct" ? "Bien joué, vous l'avez trouvé !" : "Le titre à retrouver"}
                    </p>
                    <div className="relative isolate aspect-square w-full max-w-80 overflow-hidden rounded-2xl border border-white/15 bg-app-surface-elevated shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:max-w-96">
                      <div aria-hidden="true" className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-app-accent-soft to-app-surface text-8xl text-app-muted">♫</div>
                      {currentTrack.album.images[0]?.url && <img src={currentTrack.album.images[0].url} alt={`Pochette de ${currentTrack.album.name}`} onError={(event) => { event.currentTarget.style.display = "none"; }} className="h-full w-full object-cover" />}
                    </div>
                  </div>
                ) : (
                  <button type="button" disabled={roundMode === "songless" ? !songlessReady || startingPlayback : !player.ready} onClick={play} aria-label={roundMode === "blindtest" ? (player.playing ? "Mettre en pause" : "Écouter le morceau") : "Écouter l'extrait"} className="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border-8 border-white/10 bg-[#1ed760] text-4xl text-black shadow-[0_0_60px_rgba(30,215,96,0.25)] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50 sm:h-32 sm:w-32">
                    {songlessLoading || startingPlayback ? <span aria-hidden="true" className="h-9 w-9 animate-spin rounded-full border-4 border-black/20 border-t-black motion-reduce:animate-none" /> : player.playing ? (roundMode === "blindtest" ? "Ⅱ" : "↻") : "▶"}
                  </button>
                )}
                {!revealed && <span className="absolute bottom-5 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-sm font-bold backdrop-blur">{roundMode === "blindtest" ? "Lecture continue" : `${(roundSteps[stepIndex] / 1000).toLocaleString("fr-FR")} s`}</span>}
              </div>

              <div className="p-5 sm:p-8">
                {roundMode === "songless" && !revealed && (
                  preparationError ? (
                    <div role="alert" className="mb-4 text-sm text-app-warning">
                      {preparationError}
                      <button type="button" onClick={() => { void player.activate()?.catch(() => undefined); setPreparationAttempt((value) => value + 1); }} className="ml-3 cursor-pointer underline">Réessayer le chargement</button>
                    </div>
                  ) : (songlessLoading || startingPlayback) ? <p role="status" className="mb-4 text-center text-sm text-app-muted">Chargement du morceau…</p> : null
                )}
                {!revealed && <p className="mb-4 text-sm font-semibold text-[#1ed760]">{roundMode === "blindtest" ? "Blindtest" : "Songless"}</p>}
                {roundMode === "songless" && !revealed && (
                  <div className="mb-7" aria-label="Progression des indices">
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-app-muted">{revealed ? "Réponse révélée" : `Indice ${stepIndex + 1} sur ${roundSteps.length}`}</span>
                      <span className="font-bold tabular-nums text-[#1ed760]">{(roundSteps[stepIndex] / 1000).toLocaleString("fr-FR")} s</span>
                    </div>
                    <div className="relative h-20">
                      <div role="meter" aria-label="Durée de l'indice débloqué" aria-valuemin={0} aria-valuemax={15} aria-valuenow={roundSteps[stepIndex] / 1000} aria-valuetext={`${(roundSteps[stepIndex] / 1000).toLocaleString("fr-FR")} secondes sur 15`} className="absolute inset-x-0 top-8 h-3 overflow-hidden rounded-full border border-app-border bg-app-surface-elevated">
                        <div className="h-full bg-[#1ed760] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${roundSteps[stepIndex] / 15000 * 100}%` }} />
                      </div>
                    <ol>
                      {STEPS.map((duration, position) => {
                        const index = roundSteps.indexOf(duration);
                        const enabled = index !== -1;
                        const current = enabled && index === stepIndex;
                        const reached = enabled && index <= stepIndex;
                        return (
                          <li key={duration} style={{ left: `${duration / 15000 * 100}%` }} className="absolute top-8" aria-current={current ? "step" : undefined} aria-label={`${(duration / 1000).toLocaleString("fr-FR")} seconde${duration >= 2000 ? "s" : ""} : ${!enabled ? "désactivé" : current ? "indice actuel" : reached ? "débloqué" : "à venir"}`}>
                            <div className={`absolute -left-px -top-1 h-5 border-l-2 ${current ? "border-[#1ed760]" : reached ? "border-app-success" : enabled ? "border-app-muted" : "border-dashed border-app-muted/40"}`} />
                            <span aria-hidden="true" className={`absolute whitespace-nowrap text-[10px] font-semibold tabular-nums sm:text-xs ${position % 2 === 1 ? "-top-7" : "top-6"} ${position < 2 ? "left-0" : position === STEPS.length - 1 ? "right-0" : "-translate-x-1/2"} ${current ? "text-[#1ed760]" : enabled ? "text-app-muted" : "text-app-muted/40 line-through"}`}>{(duration / 1000).toLocaleString("fr-FR")} s</span>
                          </li>
                        );
                      })}
                    </ol>
                    </div>
                  </div>
                )}

                {revealed ? (
                  <div className="mx-auto max-w-xl pb-2 text-center sm:pb-3">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-app-muted">{roundMode === "blindtest" ? "Blindtest" : "Songless"} <span aria-hidden="true">·</span> Réponse</p>
                    <h2 className="text-3xl font-black leading-tight tracking-tight break-words sm:text-4xl">{currentTrack.name}</h2>
                    <p className="mt-3 text-lg font-medium text-app-text/80 sm:text-xl">{currentTrack.artists.map((artist) => artist.name).join(", ")}</p>
                    <p className="mt-2 text-sm text-app-muted">{currentTrack.album.name}</p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-app-border pt-5 text-xs text-app-muted">
                      <span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${player.playing ? "bg-[#1ed760]" : "bg-app-muted"}`} />{player.playing ? "En lecture sur Spotify" : "Lecture Spotify"}</span>
                      {roundMode === "songless" && <span>{result === "correct" ? "Trouvé en" : "Dernier indice :"} {(roundSteps[stepIndex] / 1000).toLocaleString("fr-FR")} s</span>}
                    </div>
                    <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                      <button type="button" onClick={nextTrack} className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-full bg-[#1ed760] px-7 py-3 font-bold text-black transition hover:bg-[#25e66a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1ed760]">Musique suivante <span aria-hidden="true">→</span></button>
                      {currentTrack.external_urls?.spotify && <a href={currentTrack.external_urls.spotify} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-app-border px-6 py-3 text-sm font-semibold text-app-muted transition hover:border-app-muted hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1ed760]">Ouvrir dans Spotify <span aria-hidden="true">↗</span></a>}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitAnswer}>
                    <label htmlFor="songless-answer" className="mb-2 block text-sm font-semibold">Quel est ce titre ?</label>
                    <div className="relative">
                      <input ref={searchRef} id="songless-answer" autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedAnswer(null); setResult(null); }} placeholder="Rechercher un titre ou un artiste…" className="w-full rounded-2xl border border-app-border bg-app-bg px-5 py-4 pr-28 text-base outline-none transition placeholder:text-app-muted focus:border-[#1ed760] focus:ring-2 focus:ring-[#1ed760]/20" />
                      <button type="submit" disabled={!query.trim()} className="absolute right-2 top-2 cursor-pointer rounded-xl bg-app-surface-elevated px-4 py-2 font-semibold transition hover:text-[#1ed760] disabled:cursor-not-allowed disabled:opacity-40">Valider</button>
                      {suggestions.length > 0 && query && !selectedAnswer && (
                        <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-app-border bg-app-surface-elevated shadow-2xl">
                          {suggestions.map((track) => <li key={track.id}><button type="button" onClick={() => { setSelectedAnswer(track); setQuery(track.name); }} className="flex w-full cursor-pointer items-center gap-3 border-b border-app-border/60 px-4 py-3 text-left last:border-0 hover:bg-app-primary-soft"><span className="min-w-0"><span className="block truncate font-semibold">{track.name}</span><span className="block truncate text-xs text-app-muted">{track.artists.map((artist) => artist.name).join(", ")}</span></span></button></li>)}
                        </ul>
                      )}
                    </div>
                    {result === "wrong" && <p role="status" className="mt-3 text-sm text-app-warning">{roundMode === "blindtest" ? "Ce n'est pas ce titre. Réessayez !" : "Pas encore — un extrait plus long est maintenant disponible."}</p>}
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <button type="button" onClick={() => { if (roundMode === "blindtest" || stepIndex === roundSteps.length - 1) revealAndPlay("wrong"); else miss(true); }} className="cursor-pointer text-sm font-semibold text-app-muted underline-offset-4 hover:text-app-text hover:underline">{roundMode === "blindtest" || stepIndex === roundSteps.length - 1 ? "Révéler" : "Passer"}</button>
                      <p className="text-xs text-app-muted">{tracks.length - queue.length} / {tracks.length} avant remélange</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-app-muted">Contenu et lecture fournis par Spotify · Compte Premium requis</p>
          </section>
        ) : null}
      </main>
    </MainLayout>
  );
};
