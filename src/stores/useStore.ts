import { create } from 'zustand';
import type { LibrarySource, LyricLine, PlaybackMode, Song, UserProfile, Message, VisualizerMode } from '../types';

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  currentIndex: number;
  seekHandler: ((time: number) => void) | null;
  playbackMode: PlaybackMode;
  playNextQueue: Song[];
}

interface UserState {
  isLoggedIn: boolean;
  neteaseUserId: string | null;
  profile: UserProfile | null;
  hasSkippedLogin: boolean;
}

interface KunaState {
  isChatOpen: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  messages: Message[];
  lastSpeakTime: number;
  voiceVolume: number;
}

interface UIState {
  isLoading: boolean;
  showLyrics: boolean;
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsError: string | null;
  visualizerMode: VisualizerMode;
  frequencyData: Uint8Array | null;
}

interface LibraryState {
  sources: LibrarySource[];
  activeSourceId: string | null;
  browseSongs: Array<Song & { url: string }>;
  browseIsLoading: boolean;
  browseHasMore: boolean;
  browseNextOffset: number;
}

interface AppState {
  player: PlayerState;
  user: UserState;
  kuna: KunaState;
  ui: UIState;
  library: LibraryState;

  // Player actions
  setPlaying: (playing: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaylist: (playlist: Song[]) => void;
  appendPlaylist: (songs: Song[]) => void;
  setCurrentIndex: (index: number) => void;
  setSeekHandler: (handler: ((time: number) => void) | null) => void;
  seekTo: (time: number) => void;
  togglePlaying: () => void;
  playSongAt: (index: number) => void;
  removeSongAt: (index: number) => void;
  clearPlaylist: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  cyclePlaybackMode: () => void;
  addToPlayNext: (song: Song) => void;
  removePlayNextAt: (index: number) => void;
  nextSong: () => void;
  previousSong: () => void;

  // Library actions
  setLibrarySources: (sources: LibrarySource[], activeSourceId?: string | null) => void;
  setActiveLibrarySource: (sourceId: string | null) => void;
  updateLibrarySource: (sourceId: string, updates: Partial<LibrarySource>) => void;
  setBrowseSongs: (sourceId: string, songs: Array<Song & { url: string }>, hasMore: boolean, nextOffset?: number) => void;
  appendBrowseSongs: (songs: Array<Song & { url: string }>, hasMore: boolean, nextOffset: number) => void;
  setBrowseLoading: (loading: boolean) => void;
  playBrowseSongAt: (index: number) => void;
  clearLibrary: () => void;

  // User actions
  setUserLoggedIn: (loggedIn: boolean, userId?: string, profile?: UserProfile) => void;
  setHasSkippedLogin: (skipped: boolean) => void;
  logout: () => void;
  returnToEntry: () => void;

  // Kuna actions
  setKunaChatOpen: (open: boolean) => void;
  setKunaSpeaking: (speaking: boolean) => void;
  setKunaListening: (listening: boolean) => void;
  addMessage: (message: Message) => void;
  setLastSpeakTime: (time: number) => void;
  setKunaVoiceVolume: (volume: number) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setShowLyrics: (show: boolean) => void;
  setLyrics: (lyrics: LyricLine[]) => void;
  setLyricsLoading: (loading: boolean) => void;
  setLyricsError: (error: string | null) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  setFrequencyData: (data: Uint8Array | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  player: {
    isPlaying: false,
    currentSong: null,
    currentTime: 0,
    duration: 0,
    volume: 70,
    playlist: [],
    currentIndex: 0,
    seekHandler: null,
    playbackMode: 'sequential',
    playNextQueue: [],
  },
  user: {
    isLoggedIn: false,
    neteaseUserId: null,
    profile: null,
    hasSkippedLogin: false,
  },
  kuna: {
    isChatOpen: false,
    isSpeaking: false,
    isListening: false,
    messages: [],
    lastSpeakTime: 0,
    voiceVolume: 85,
  },
  ui: {
    isLoading: false,
    showLyrics: false,
    lyrics: [],
    lyricsLoading: false,
    lyricsError: null,
    visualizerMode: 'spectrum',
    frequencyData: null,
  },
  library: {
    sources: [],
    activeSourceId: null,
    browseSongs: [],
    browseIsLoading: false,
    browseHasMore: false,
    browseNextOffset: 0,
  },

  // Player actions
  setPlaying: (playing) => set((state) => ({ player: { ...state.player, isPlaying: playing } })),
  setCurrentSong: (song) => set((state) => ({ player: { ...state.player, currentSong: song } })),
  setCurrentTime: (time) => set((state) => ({ player: { ...state.player, currentTime: time } })),
  setDuration: (duration) => set((state) => ({ player: { ...state.player, duration } })),
  setVolume: (volume) => set((state) => ({
    player: { ...state.player, volume: clampVolume(volume) },
  })),
  setPlaylist: (playlist) => set((state) => ({ player: { ...state.player, playlist, currentIndex: 0 } })),
  appendPlaylist: (songs) => set((state) => {
    const existingIds = new Set(state.player.playlist.map((song) => song.id));
    const newSongs = songs.filter((song) => !existingIds.has(song.id));
    return { player: { ...state.player, playlist: [...state.player.playlist, ...newSongs] } };
  }),
  setCurrentIndex: (index) => set((state) => ({ player: { ...state.player, currentIndex: index } })),
  setSeekHandler: (handler) => set((state) => ({ player: { ...state.player, seekHandler: handler } })),
  seekTo: (time) => {
    const { duration, seekHandler } = get().player;
    if (!seekHandler) return;
    seekHandler(Math.max(0, Math.min(time, duration || time)));
  },
  togglePlaying: () => set((state) => ({ player: { ...state.player, isPlaying: !state.player.isPlaying } })),
  playSongAt: (index) => {
    const { playlist } = get().player;
    const song = playlist[index];
    if (!song) return;

    set((state) => ({
      player: {
        ...state.player,
        currentIndex: index,
        currentSong: song,
        currentTime: 0,
        isPlaying: true,
      },
    }));
  },
  removeSongAt: (index) => {
    const { playlist, currentIndex } = get().player;
    if (!playlist[index]) return;

    const nextPlaylist = playlist.filter((_, songIndex) => songIndex !== index);

    if (nextPlaylist.length === 0) {
      set((state) => ({
        player: {
          ...state.player,
          playlist: [],
          currentSong: null,
          currentIndex: 0,
          currentTime: 0,
          duration: 0,
          isPlaying: false,
        },
      }));
      return;
    }

    const nextIndex = index < currentIndex
      ? currentIndex - 1
      : index === currentIndex
        ? Math.min(currentIndex, nextPlaylist.length - 1)
        : currentIndex;

    set((state) => ({
      player: {
        ...state.player,
        playlist: nextPlaylist,
        currentIndex: nextIndex,
        currentSong: nextPlaylist[nextIndex],
        currentTime: index === currentIndex ? 0 : state.player.currentTime,
      },
    }));
  },
  clearPlaylist: () => set((state) => ({
    player: {
      ...state.player,
      playlist: [],
      currentSong: null,
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      playNextQueue: [],
    },
  })),
  setPlaybackMode: (mode) => set((state) => ({
    player: { ...state.player, playbackMode: mode },
  })),
  cyclePlaybackMode: () => set((state) => {
    const nextMode: PlaybackMode = state.player.playbackMode === 'sequential'
      ? 'shuffle'
      : state.player.playbackMode === 'shuffle'
        ? 'repeat-one'
        : 'sequential';
    return { player: { ...state.player, playbackMode: nextMode } };
  }),
  addToPlayNext: (song) => set((state) => {
    const exists = state.player.playNextQueue.some((item) => item.id === song.id);
    if (exists) return state;
    return { player: { ...state.player, playNextQueue: [...state.player.playNextQueue, song] } };
  }),
  removePlayNextAt: (index) => set((state) => ({
    player: {
      ...state.player,
      playNextQueue: state.player.playNextQueue.filter((_, itemIndex) => itemIndex !== index),
    },
  })),
  nextSong: () => {
    const { playlist, currentIndex, playbackMode, playNextQueue } = get().player;
    if (playNextQueue.length > 0) {
      const [nextQueuedSong, ...restQueue] = playNextQueue;
      const existingIndex = playlist.findIndex((song) => song.id === nextQueuedSong.id);
      const nextPlaylist = existingIndex === -1 ? [...playlist, nextQueuedSong] : playlist;
      const nextIndex = existingIndex === -1 ? nextPlaylist.length - 1 : existingIndex;
      set((state) => ({
        player: {
          ...state.player,
          playlist: nextPlaylist,
          playNextQueue: restQueue,
          currentIndex: nextIndex,
          currentSong: nextQueuedSong,
          currentTime: 0,
        },
      }));
      return;
    }

    if (playlist.length === 0) return;
    const nextIndex = playbackMode === 'repeat-one'
      ? currentIndex
      : playbackMode === 'shuffle'
        ? getRandomNextIndex(playlist.length, currentIndex)
        : (currentIndex + 1) % playlist.length;
    set((state) => ({
      player: { ...state.player, currentIndex: nextIndex, currentSong: playlist[nextIndex], currentTime: 0 },
    }));
  },
  previousSong: () => {
    const { playlist, currentIndex, playbackMode } = get().player;
    if (playlist.length === 0) return;
    const prevIndex = playbackMode === 'repeat-one'
      ? currentIndex
      : playbackMode === 'shuffle'
        ? getRandomNextIndex(playlist.length, currentIndex)
        : (currentIndex - 1 + playlist.length) % playlist.length;
    set((state) => ({
      player: { ...state.player, currentIndex: prevIndex, currentSong: playlist[prevIndex], currentTime: 0 },
    }));
  },

  // Library actions
  setLibrarySources: (sources, activeSourceId) => set(() => ({
    library: {
      sources,
      activeSourceId: activeSourceId === undefined ? sources[0]?.id || null : activeSourceId,
      browseSongs: [],
      browseIsLoading: false,
      browseHasMore: false,
      browseNextOffset: 0,
    },
  })),
  setActiveLibrarySource: (sourceId) => set((state) => ({
    library: { ...state.library, activeSourceId: sourceId },
  })),
  updateLibrarySource: (sourceId, updates) => set((state) => ({
    library: {
      ...state.library,
      sources: state.library.sources.map((source) =>
        source.id === sourceId ? { ...source, ...updates } : source
      ),
    },
  })),
  setBrowseSongs: (sourceId, songs, hasMore, nextOffset = songs.length) => set((state) => ({
    library: {
      ...state.library,
      activeSourceId: sourceId,
      browseSongs: songs,
      browseHasMore: hasMore,
      browseNextOffset: nextOffset,
      browseIsLoading: false,
    },
  })),
  appendBrowseSongs: (songs, hasMore, nextOffset) => set((state) => {
    const existingIds = new Set(state.library.browseSongs.map((song) => song.id));
    const newSongs = songs.filter((song) => !existingIds.has(song.id));
    return {
      library: {
        ...state.library,
        browseSongs: [...state.library.browseSongs, ...newSongs],
        browseHasMore: hasMore,
        browseNextOffset: nextOffset,
        browseIsLoading: false,
      },
    };
  }),
  setBrowseLoading: (loading) => set((state) => ({
    library: { ...state.library, browseIsLoading: loading },
  })),
  playBrowseSongAt: (index) => {
    const { browseSongs } = get().library;
    const song = browseSongs[index];
    if (!song) return;

    set((state) => ({
      player: {
        ...state.player,
        playlist: browseSongs,
        currentIndex: index,
        currentSong: song,
        currentTime: 0,
        isPlaying: true,
      },
    }));
  },
  clearLibrary: () => set(() => ({
    library: {
      sources: [],
      activeSourceId: null,
      browseSongs: [],
      browseIsLoading: false,
      browseHasMore: false,
      browseNextOffset: 0,
    },
  })),

  // User actions
  setUserLoggedIn: (loggedIn, userId, profile) =>
    set(() => ({
      user: { isLoggedIn: loggedIn, neteaseUserId: userId || null, profile: profile || null, hasSkippedLogin: true },
    })),
  setHasSkippedLogin: (skipped) =>
    set((state) => ({ user: { ...state.user, hasSkippedLogin: skipped } })),
  logout: () => set(() => ({ user: { isLoggedIn: false, neteaseUserId: null, profile: null, hasSkippedLogin: false } })),
  returnToEntry: () => set((state) => ({
    player: {
      ...state.player,
      isPlaying: false,
      currentSong: null,
      currentTime: 0,
      duration: 0,
      playlist: [],
      currentIndex: 0,
      playNextQueue: [],
    },
    user: {
      isLoggedIn: false,
      neteaseUserId: null,
      profile: null,
      hasSkippedLogin: false,
    },
    library: {
      sources: [],
      activeSourceId: null,
      browseSongs: [],
      browseIsLoading: false,
      browseHasMore: false,
      browseNextOffset: 0,
    },
    kuna: {
      ...state.kuna,
      isChatOpen: false,
      isSpeaking: false,
    },
  })),

  // Kuna actions
  setKunaChatOpen: (open) => set((state) => ({ kuna: { ...state.kuna, isChatOpen: open } })),
  setKunaSpeaking: (speaking) => set((state) => ({ kuna: { ...state.kuna, isSpeaking: speaking } })),
  setKunaListening: (listening) => set((state) => ({ kuna: { ...state.kuna, isListening: listening } })),
  addMessage: (message) =>
    set((state) => ({ kuna: { ...state.kuna, messages: [...state.kuna.messages, message].slice(-50) } })),
  setLastSpeakTime: (time) => set((state) => ({ kuna: { ...state.kuna, lastSpeakTime: time } })),
  setKunaVoiceVolume: (volume) => set((state) => ({
    kuna: { ...state.kuna, voiceVolume: clampVolume(volume) },
  })),

  // UI actions
  setLoading: (loading) => set((state) => ({ ui: { ...state.ui, isLoading: loading } })),
  setShowLyrics: (show) => set((state) => ({ ui: { ...state.ui, showLyrics: show } })),
  setLyrics: (lyrics) => set((state) => ({ ui: { ...state.ui, lyrics, lyricsError: null } })),
  setLyricsLoading: (loading) => set((state) => ({ ui: { ...state.ui, lyricsLoading: loading } })),
  setLyricsError: (error) => set((state) => ({ ui: { ...state.ui, lyricsError: error } })),
  setVisualizerMode: (mode) => set((state) => ({ ui: { ...state.ui, visualizerMode: mode } })),
  setFrequencyData: (data) => set((state) => ({ ui: { ...state.ui, frequencyData: data } })),
}));

function getRandomNextIndex(length: number, currentIndex: number): number {
  if (length <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * length);
  if (nextIndex === currentIndex) {
    nextIndex = (nextIndex + 1) % length;
  }
  return nextIndex;
}

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.max(0, Math.min(100, volume));
}

export function parseVolumeInput(value: string): number {
  return clampVolume(Number(value));
}
