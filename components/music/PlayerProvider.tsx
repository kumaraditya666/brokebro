// BROKE MUSIC — centralized player engine (single HTMLAudioElement).
// Manages currentTrack, queue, index, isPlaying, volume, currentTime,
// duration, repeat, shuffle, loading, buffering, errors + Media Session API.
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RepeatMode, Track } from "@/types/music";
import { applyEq, ensureGraph, getAudio, resumeContext } from "@/lib/music/audioEngine";
import { useMusicLibrary } from "@/store/useMusicLibrary";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  loading: boolean;
  buffering: boolean;
  error: string | null;
  queueOpen: boolean;
  fullOpen: boolean;
  setQueueOpen: (v: boolean) => void;
  setFullOpen: (v: boolean) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  addToQueue: (t: Track) => void;
  playNext: (t: Track) => void;
  removeFromQueue: (i: number) => void;
  clearQueue: () => void;
  moveInQueue: (from: number, to: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playTrack: (t: Track, list?: Track[]) => void;
  playList: (list: Track[], start?: number) => void;
  dismissError: () => void;
}

const Ctx = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return v;
}

function playableUrl(t: Track): string | null {
  return t.objectUrl || t.streamUrl || null;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const orderRef = useRef<number[]>([]);
  const orderPos = useRef(0);

  const pushHistory = useMusicLibrary((s) => s.pushHistory);
  const defaultVolume = useMusicLibrary((s) => s.settings.defaultVolume);
  const autoplay = useMusicLibrary((s) => s.settings.autoplay);
  const eqBands = useMusicLibrary((s) => s.settings.eq.bands);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // init volume + eq
  useEffect(() => {
    setVolumeState(defaultVolume);
    const el = getAudio();
    if (el) {
      el.volume = defaultVolume;
      el.preload = "auto";
    }
  }, [defaultVolume]);

  useEffect(() => {
    applyEq(eqBands);
  }, [eqBands]);

  const loadAndPlay = useCallback(
    async (track: Track) => {
      const el = getAudio();
      if (!el) return;
      ensureGraph();
      resumeContext();
      const url = playableUrl(track);
      if (!track.playable || !url) {
        setError("Playback unavailable here");
        setIsPlaying(false);
        setLoading(false);
        return;
      }
      setError(null);
      setLoading(true);
      try {
        if (el.src !== url) el.src = url;
        el.volume = muted ? 0 : volume;
        await el.play();
        setIsPlaying(true);
        pushHistory(track);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Playback failed";
        if (/not allowed|play\(\) request was interrupted/i.test(msg)) {
          // autoplay policy — surface paused state, user taps play
          setIsPlaying(false);
        } else {
          setError("Playback unavailable here");
          setIsPlaying(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [muted, volume, pushHistory],
  );

  // when index changes → load
  const indexRef = useRef(currentIndex);
  useEffect(() => {
    if (currentIndex === indexRef.current) return;
    indexRef.current = currentIndex;
    const t = queue[currentIndex];
    setCurrentTime(0);
    setDuration(t?.duration ?? 0);
    if (t && autoplay) void loadAndPlay(t);
    else if (t) {
      const el = getAudio();
      const url = playableUrl(t);
      if (el && url && t.playable) {
        ensureGraph();
        if (el.src !== url) el.src = url;
      }
    }
  }, [currentIndex, queue, autoplay, loadAndPlay]);

  // audio element events
  useEffect(() => {
    const el = getAudio();
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      setLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onErr = () => {
      setLoading(false);
      setBuffering(false);
      setError("Playback unavailable here");
      setIsPlaying(false);
    };
    const onEnded = () => {
      setCurrentTime(0);
      // repeat-one
      if (repeatMode === "one") {
        el.currentTime = 0;
        void el.play().catch(() => {});
        return;
      }
      // advance (shuffle-aware)
      const q = (window as unknown as { __bmq?: Track[] }).__bmq;
      void q;
      setCurrentIndex((i) => {
        if (shuffle) {
          if (orderRef.current.length === 0) return i;
          orderPos.current += 1;
          if (orderPos.current >= orderRef.current.length) {
            if (repeatMode === "all") orderPos.current = 0;
            else {
              setIsPlaying(false);
              return i;
            }
          }
          return orderRef.current[orderPos.current] ?? i;
        }
        if (i + 1 < queue.length) return i + 1;
        if (repeatMode === "all" && queue.length > 0) return 0;
        setIsPlaying(false);
        return i;
      });
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onErr);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onErr);
      el.removeEventListener("ended", onEnded);
    };
  }, [queue.length, repeatMode, shuffle]);

  // Media Session API
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      if (currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album ?? "",
          artwork: currentTrack.artwork
            ? [{ src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" }]
            : [],
        });
      }
      navigator.mediaSession.setActionHandler("play", () => void playRef.current());
      navigator.mediaSession.setActionHandler("pause", () => pauseRef.current());
      navigator.mediaSession.setActionHandler("previoustrack", () => prevRef.current());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current());
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        const el = getAudio();
        if (el) el.currentTime = Math.max(0, el.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        const el = getAudio();
        if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
      });
    } catch {
      /* unsupported */
    }
  }, [currentTrack]);

  // keep document title in sync (nice background-tab cue)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = currentTrack ? `${currentTrack.title} · ${currentTrack.artist} — BROKE MUSIC` : "BROKE MUSIC — Your music. One player. Zero bullshit.";
  }, [currentTrack]);

  const play = useCallback(async () => {
    const el = getAudio();
    if (!el) return;
    ensureGraph();
    resumeContext();
    if (!currentTrack) return;
    const url = playableUrl(currentTrack);
    if (!currentTrack.playable || !url) {
      setError("Playback unavailable here");
      return;
    }
    try {
      if (el.src !== url) el.src = url;
      await el.play();
      setIsPlaying(true);
    } catch {
      setError("Playback unavailable here");
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    getAudio()?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else void play();
  }, [isPlaying, pause, play]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    if (shuffle && orderRef.current.length > 0) {
      orderPos.current = Math.min(orderPos.current + 1, orderRef.current.length - 1);
      const ni = orderRef.current[orderPos.current] ?? currentIndex;
      if (ni === currentIndex && queue.length > 1) {
        setCurrentIndex((currentIndex + 1) % queue.length);
        return;
      }
      setCurrentIndex(ni);
      return;
    }
    setCurrentIndex((i) => (i + 1 < queue.length ? i + 1 : repeatMode === "all" ? 0 : i));
    const t = queue[shuffle ? (orderRef.current[orderPos.current + 1] ?? currentIndex + 1) : currentIndex + 1];
    if (t) void loadAndPlay(t);
    else if (repeatMode === "all" && queue[0]) void loadAndPlay(queue[0]);
  }, [queue, shuffle, currentIndex, repeatMode, loadAndPlay]);

  const previous = useCallback(() => {
    const el = getAudio();
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (queue.length === 0) return;
    if (shuffle && orderRef.current.length > 0) {
      orderPos.current = Math.max(orderPos.current - 1, 0);
      setCurrentIndex(orderRef.current[orderPos.current] ?? 0);
      const t = queue[orderRef.current[orderPos.current] ?? 0];
      if (t) void loadAndPlay(t);
      return;
    }
    const ni = currentIndex - 1;
    if (ni >= 0) {
      setCurrentIndex(ni);
      void loadAndPlay(queue[ni]);
    } else if (el) {
      el.currentTime = 0;
      setCurrentTime(0);
    }
  }, [queue, shuffle, currentIndex, loadAndPlay]);

  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  const nextRef = useRef(next);
  const prevRef = useRef(previous);
  playRef.current = play;
  pauseRef.current = pause;
  nextRef.current = next;
  prevRef.current = previous;

  const seek = useCallback((sec: number) => {
    const el = getAudio();
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || sec, sec));
    setCurrentTime(el.currentTime);
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      const c = Math.max(0, Math.min(1, v));
      setVolumeState(c);
      const el = getAudio();
      if (el) {
        el.volume = c;
        if (c > 0 && muted) {
          setMuted(false);
          el.muted = false;
        }
      }
      useMusicLibrary.getState().updateSettings({ defaultVolume: c });
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    const el = getAudio();
    setMuted((m) => {
      const nm = !m;
      if (el) {
        el.muted = nm;
        if (!nm && el.volume === 0) {
          el.volume = volume || 0.5;
        }
      }
      return nm;
    });
  }, [volume]);

  const addToQueue = useCallback((t: Track) => {
    setQueue((q) => [...q, t]);
    if (shuffle) {
      orderRef.current = [...orderRef.current, queue.length];
    }
  }, [shuffle, queue.length]);

  const playNext = useCallback(
    (t: Track) => {
      setQueue((q) => {
        const nq = [...q];
        nq.splice(currentIndex + 1, 0, t);
        return nq;
      });
    },
    [currentIndex],
  );

  const removeFromQueue = useCallback(
    (i: number) => {
      setQueue((q) => {
        if (i < 0 || i >= q.length) return q;
        const nq = q.filter((_, j) => j !== i);
        if (i < currentIndex) setCurrentIndex((c) => Math.max(0, c - 1));
        if (i === currentIndex) {
          const el = getAudio();
          el?.pause();
          setIsPlaying(false);
          if (nq.length === 0) setCurrentIndex(-1);
        }
        return nq;
      });
    },
    [currentIndex],
  );

  const clearQueue = useCallback(() => {
    getAudio()?.pause();
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    orderRef.current = [];
    orderPos.current = 0;
  }, []);

  const moveInQueue = useCallback(
    (from: number, to: number) => {
      setQueue((q) => {
        if (from < 0 || to < 0 || from >= q.length || to >= q.length) return q;
        const nq = [...q];
        const [m] = nq.splice(from, 1);
        nq.splice(to, 0, m);
        // fix current index tracking
        if (from === currentIndex) setCurrentIndex(to);
        else if (from < currentIndex && to >= currentIndex) setCurrentIndex((c) => c - 1);
        else if (from > currentIndex && to <= currentIndex) setCurrentIndex((c) => c + 1);
        return nq;
      });
    },
    [currentIndex],
  );

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const ns = !s;
      if (ns && queue.length > 1) {
        const rest = queue.map((_, i) => i).filter((i) => i !== currentIndex);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        orderRef.current = [currentIndex, ...rest];
        orderPos.current = 0;
      } else {
        orderRef.current = [];
        orderPos.current = 0;
      }
      return ns;
    });
  }, [queue, currentIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const playTrack = useCallback(
    (t: Track, list?: Track[]) => {
      if (!t.playable || (!t.streamUrl && !t.objectUrl)) {
        setError("Playback unavailable here");
        return;
      }
      if (list && list.length > 0) {
        const idx = list.findIndex((x) => x.id === t.id);
        setQueue(list);
        orderRef.current = [];
        orderPos.current = 0;
        setCurrentIndex(idx >= 0 ? idx : 0);
        void loadAndPlay(list[idx >= 0 ? idx : 0]);
      } else {
        setQueue((q) => {
          const i = q.findIndex((x) => x.id === t.id);
          if (i >= 0) {
            setCurrentIndex(i);
            void loadAndPlay(q[i]);
            return q;
          }
          const nq = [...q, t];
          setCurrentIndex(nq.length - 1);
          void loadAndPlay(t);
          return nq;
        });
      }
    },
    [loadAndPlay],
  );

  const playList = useCallback(
    (list: Track[], start = 0) => {
      const playable = list.filter((t) => t.playable && (t.streamUrl || t.objectUrl));
      if (playable.length === 0) {
        setError("Playback unavailable here");
        return;
      }
      const idx = Math.max(0, Math.min(start, playable.length - 1));
      setQueue(playable);
      orderRef.current = [];
      orderPos.current = 0;
      setCurrentIndex(idx);
      void loadAndPlay(playable[idx]);
    },
    [loadAndPlay],
  );

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo<PlayerState>(
    () => ({
      currentTrack,
      queue,
      currentIndex,
      isPlaying,
      volume,
      muted,
      currentTime,
      duration,
      repeatMode,
      shuffle,
      loading,
      buffering,
      error,
      queueOpen,
      fullOpen,
      setQueueOpen,
      setFullOpen,
      play,
      pause,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      moveInQueue,
      toggleShuffle,
      toggleRepeat,
      playTrack,
      playList,
      dismissError,
    }),
    [
      currentTrack, queue, currentIndex, isPlaying, volume, muted, currentTime, duration,
      repeatMode, shuffle, loading, buffering, error, queueOpen, fullOpen,
      play, pause, togglePlay, next, previous, seek, setVolume, toggleMute,
      addToQueue, playNext, removeFromQueue, clearQueue, moveInQueue,
      toggleShuffle, toggleRepeat, playTrack, playList, dismissError,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
