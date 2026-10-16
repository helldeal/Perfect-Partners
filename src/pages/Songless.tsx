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

const STEPS = [100, 500, 2_000, 8_000, 15_000] as const;
const PLAYLISTS_STORAGE_KEY = "perfect-partners.songless-playlists";
const PERSONALIZED_SOURCE_ID = "__personalized__";

const normalizeTitle = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\([^)]*(remaster|radio edit|version|deluxe|feat\.?)[^)]*\)/gi, "")
    .replace(/\[[^\]]*(remaster|radio edit|version|deluxe|feat\.?)[^\]]*\]/gi, "")
    .replace(/\s[-–—]\s.*\b(remaster|radio edit|version|deluxe)\b.*$/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PLAYLISTS_STORAGE_KEY) ?? "[]") as string[];
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
  const searchRef = useRef<HTMLInputElement>(null);

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
    if (selectedPlaylistIds.length === 0) return;
    setLoadingTracks(true);
    setError(null);
    try {
      const lists = await Promise.all(
        selectedPlaylistIds.map((playlistId) =>
          playlistId === PERSONALIZED_SOURCE_ID
            ? fetchSpotifyPersonalizedTracks()
            : fetchSpotifyPlaylistTracks(playlistId)
        )
      );
      const uniqueTracks = Array.from(
        new Map(lists.flat().map((track) => [track.id, track])).values()
      );
      if (uniqueTracks.length === 0) throw new Error("Aucun morceau jouable dans cette sélection.");
      const shuffled = shuffle(uniqueTracks);
      const first = shuffled.shift() ?? null;
      setTracks(uniqueTracks);
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
    const normalizedQuery = normalizeTitle(query);
    if (normalizedQuery.length < 2) return [];
    return tracks
      .filter((track) => {
        const haystack = normalizeTitle(
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
    void player.playFullTrack(currentTrack.uri, 10_000).catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Lecture impossible.")
    );
  };

  const miss = () => {
    setResult("wrong");
    setSelectedAnswer(null);
    setQuery("");
    if (stepIndex < STEPS.length - 1) setStepIndex((value) => value + 1);
    else revealAndPlay("wrong");
  };

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (!currentTrack || revealed) return;
    const answerIsCorrect = selectedAnswer
      ? selectedAnswer.id === currentTrack.id
      : normalizeTitle(query) === normalizeTitle(currentTrack.name);
    if (answerIsCorrect) {
      revealAndPlay("correct");
    } else {
      miss();
    }
  };

  const play = () => {
    if (!currentTrack) return;
    setResult(null);
    const startPositionMs = Math.min(
      10_000,
      Math.max(0, currentTrack.duration_ms - STEPS[stepIndex] - 1_000)
    );
    void player.playSnippet(currentTrack.uri, STEPS[stepIndex], startPositionMs).catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Lecture impossible.")
    );
  };

  const blendId = import.meta.env.VITE_SPOTIFY_BLEND_PLAYLIST_ID as string | undefined;

  return (
    <MainLayout navSelected="songless">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1ed760]">Blind test Spotify</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Songless</h1>
            <p className="mt-2 max-w-2xl text-app-muted">Une fraction de seconde. Un titre à retrouver.</p>
          </div>
          {spotifyAuth.connected && (
            <button type="button" onClick={() => setShowSources((value) => !value)} className="cursor-pointer rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold transition hover:border-[#1ed760]/60 hover:text-[#1ed760]">
              {tracks.length > 0 ? "Changer les playlists" : "Choisir les playlists"}
            </button>
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
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-app-border pb-6">
              <div>
                <h2 className="text-2xl font-bold">Sources musicales</h2>
                <p className="mt-1 text-sm text-app-muted">Mélangez une ou plusieurs playlists. Les doublons seront retirés.</p>
              </div>
              <button type="button" onClick={spotifyAuth.disconnect} className="cursor-pointer text-sm text-app-muted underline-offset-4 hover:text-app-text hover:underline">Déconnecter Spotify</button>
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
                  const isBlend = playlist.id === blendId;
                  return (
                    <label key={playlist.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition ${selected ? "border-[#1ed760] bg-[#1ed760]/10" : "border-app-border bg-app-bg/40 hover:border-app-muted"}`}>
                      <input type="checkbox" checked={selected} onChange={() => setSelectedPlaylistIds((current) => selected ? current.filter((id) => id !== playlist.id) : [...current, playlist.id])} className="sr-only" />
                      {playlist.images[0]?.url ? <img src={playlist.images[0].url} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-app-surface-elevated text-xl">♫</div>}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 truncate font-semibold">{playlist.name}{isBlend && <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[10px] font-bold uppercase text-black">Blend</span>}</span>
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
              <button type="button" disabled={selectedPlaylistIds.length === 0 || loadingTracks} onClick={() => void loadSelection()} className="cursor-pointer rounded-full bg-[#1ed760] px-7 py-3 font-bold text-black transition hover:bg-[#25e66a] disabled:cursor-not-allowed disabled:opacity-40">
                {loadingTracks ? "Préparation…" : tracks.length > 0 ? "Relancer avec cette sélection" : "Commencer"}
              </button>
            </div>
          </section>
        ) : currentTrack ? (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
            <div className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-2xl">
              <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-[#1ed760]/20 via-app-surface-elevated to-app-accent-soft p-8 sm:min-h-72">
                {revealed && currentTrack.album.images[0]?.url ? (
                  <img src={currentTrack.album.images[0].url} alt={`Pochette de ${currentTrack.album.name}`} className="absolute inset-0 h-full w-full object-cover opacity-25 blur-2xl" />
                ) : null}
                {revealed ? (
                  <div aria-label="Morceau en lecture" className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-white/10 bg-[#1ed760] text-4xl text-black shadow-[0_0_60px_rgba(30,215,96,0.25)] sm:h-32 sm:w-32">♫</div>
                ) : (
                  <button type="button" disabled={!player.ready} onClick={play} aria-label="Écouter l'extrait" className="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border-8 border-white/10 bg-[#1ed760] text-4xl text-black shadow-[0_0_60px_rgba(30,215,96,0.25)] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50 sm:h-32 sm:w-32">
                    {player.playing ? "↻" : "▶"}
                  </button>
                )}
                {!revealed && <span className="absolute bottom-5 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-sm font-bold backdrop-blur">{STEPS[stepIndex] < 1000 ? `${STEPS[stepIndex]} ms` : `${STEPS[stepIndex] / 1000} s`}</span>}
              </div>

              <div className="p-5 sm:p-8">
                <div aria-label="Progression des indices" className="mb-7 grid grid-cols-5 gap-2">
                  {STEPS.map((duration, index) => <div key={duration} className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-[#1ed760]" : "bg-app-border"}`} />)}
                </div>

                {revealed ? (
                  <div className="text-center">
                    {currentTrack.album.images[0]?.url && <img src={currentTrack.album.images[0].url} alt="" className="mx-auto mb-5 h-28 w-28 rounded-2xl object-cover shadow-xl" />}
                    <p className={`text-sm font-bold uppercase tracking-wider ${result === "correct" ? "text-app-success" : "text-app-warning"}`}>{result === "correct" ? "Bien joué !" : "C'était…"}</p>
                    <a href={currentTrack.external_urls?.spotify} target="_blank" rel="noreferrer" className="mt-2 block text-2xl font-black hover:text-[#1ed760]">{currentTrack.name}</a>
                    <p className="mt-1 text-app-muted">{currentTrack.artists.map((artist) => artist.name).join(", ")} · {currentTrack.album.name}</p>
                    <button type="button" onClick={nextTrack} className="mt-7 cursor-pointer rounded-full bg-[#1ed760] px-8 py-3 font-bold text-black transition hover:scale-[1.02] hover:bg-[#25e66a]">Musique suivante</button>
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
                    {result === "wrong" && <p role="status" className="mt-3 text-sm text-app-warning">Pas encore — un extrait plus long est maintenant disponible.</p>}
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <button type="button" onClick={() => { if (stepIndex === STEPS.length - 1) revealAndPlay("wrong"); else miss(); }} className="cursor-pointer text-sm font-semibold text-app-muted underline-offset-4 hover:text-app-text hover:underline">{stepIndex === STEPS.length - 1 ? "Révéler" : "Passer"}</button>
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

