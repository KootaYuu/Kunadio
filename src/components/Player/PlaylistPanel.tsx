import { Clock3, Heart, ListMusic, Loader2, Pause, Play, Plus, Sparkles, Trash2, UserRoundCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '../../stores/useStore';
import { loadLibrarySourcePage } from '../../services/songLoader';
import type { LibrarySource, Song } from '../../types';

const INITIAL_VISIBLE_SONGS = 120;
const VISIBLE_SONG_INCREMENT = 120;

const TEXT = {
  browse: '\u6d4f\u89c8\u6b4c\u5355',
  playlist: '\u64ad\u653e\u5217\u8868',
  loaded: '\u9996\u5df2\u8f7d\u5165',
  songs: '\u9996\u6b4c\u66f2',
  clear: '\u6e05\u7a7a\u5217\u8868',
  close: '\u5173\u95ed\u64ad\u653e\u5217\u8868',
  next: '\u4e0b\u4e00\u9996',
  playLater: '\u7a0d\u540e\u64ad\u653e',
  remove: '\u79fb\u9664',
  library: '\u97f3\u4e50\u5e93',
  netease: '\u7f51\u6613\u4e91\u8d26\u53f7',
  loading: '\u6b63\u5728\u52a0\u8f7d...',
  empty: '\u64ad\u653e\u5217\u8868\u4e3a\u7a7a',
  loadMore: '\u52a0\u8f7d\u66f4\u591a',
  showMoreLoaded: '\u663e\u793a\u66f4\u591a\u5df2\u8f7d\u5165',
  pause: '\u6682\u505c',
  play: '\u64ad\u653e',
  dailyUpdated: '\u6bcf\u65e5\u66f4\u65b0',
  dailyCount: '\u9996\u63a8\u8350',
  liked: '\u9996\u559c\u6b22',
  personal: '\u4e2a\u4eba\u6536\u85cf',
  created: '\u521b\u5efa\u7684\u6b4c\u5355',
  collected: '\u6536\u85cf\u7684\u6b4c\u5355',
  recommended: '\u63a8\u8350\u6b4c\u66f2',
  unknownArtist: '\u672a\u77e5\u6b4c\u624b',
};

interface PlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaylistPanel({ isOpen, onClose }: PlaylistPanelProps) {
  const [visibleSongCount, setVisibleSongCount] = useState(INITIAL_VISIBLE_SONGS);
  const {
    player,
    user,
    library,
    playSongAt,
    removeSongAt,
    clearPlaylist,
    togglePlaying,
    setActiveLibrarySource,
    updateLibrarySource,
    setBrowseSongs,
    appendBrowseSongs,
    setBrowseLoading,
    playBrowseSongAt,
    addToPlayNext,
    removePlayNextAt,
  } = useStore();

  async function handleSourceSelect(source: LibrarySource, offset = 0) {
    if (offset === 0) {
      setVisibleSongCount(INITIAL_VISIBLE_SONGS);
    }

    if (source.kind === 'guest') {
      setActiveLibrarySource(source.id);
      setBrowseSongs(source.id, player.playlist.filter(hasPlayableUrl), false);
      return;
    }

    if (!user.neteaseUserId || library.browseIsLoading) return;

    setActiveLibrarySource(source.id);
    updateLibrarySource(source.id, { isLoading: true });
    setBrowseLoading(true);

    try {
      const page = await loadLibrarySourcePage(source, user.neteaseUserId, offset, 80);
      updateLibrarySource(source.id, {
        isLoaded: true,
        songCount: page.rawCount,
      });

      if (offset === 0) {
        setBrowseSongs(source.id, page.songs, page.hasMore, page.nextOffset);
      } else {
        appendBrowseSongs(page.songs, page.hasMore, page.nextOffset);
      }
    } catch (error) {
      console.error('Failed to load library source:', error);
    } finally {
      updateLibrarySource(source.id, { isLoading: false });
      setBrowseLoading(false);
    }
  }

  async function handleLoadMore() {
    const source = library.sources.find((item) => item.id === library.activeSourceId);
    if (!source) return;
    await handleSourceSelect(source, library.browseNextOffset);
  }

  const displayedSongs = library.browseSongs.length > 0 || library.browseIsLoading
    ? library.browseSongs
    : player.playlist;
  const effectiveVisibleSongCount = Math.min(
    Math.max(INITIAL_VISIBLE_SONGS, visibleSongCount),
    Math.max(INITIAL_VISIBLE_SONGS, displayedSongs.length),
  );
  const visibleSongs = useMemo(
    () => displayedSongs.slice(0, effectiveVisibleSongCount),
    [displayedSongs, effectiveVisibleSongCount],
  );
  const isBrowsing = library.browseSongs.length > 0 || library.browseIsLoading;
  const nextPreview = getNextPreview(player);

  return (
    <aside
      className={`fixed inset-x-3 bottom-[11.25rem] z-40 h-[min(68dvh,34rem)] transition duration-300 ease-out sm:absolute sm:bottom-24 sm:left-7 sm:right-auto sm:top-36 sm:h-auto sm:w-[26rem] sm:max-w-[calc(100vw-3.5rem)] ${
        isOpen
          ? 'translate-y-0 opacity-100 sm:translate-x-0'
          : 'pointer-events-none translate-y-8 opacity-0 sm:-translate-x-6 sm:translate-y-0'
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-bg-primary/88 shadow-[0_24px_80px_oklch(8%_0.01_58_/_0.48)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-bg-panel/72 px-5 py-4">
          <div className="flex items-center gap-2">
            <ListMusic size={22} strokeWidth={1.8} className="text-caramel" />
            <div>
              <h3 className="text-lg font-medium text-glow">{isBrowsing ? TEXT.browse : TEXT.playlist}</h3>
              <p className="text-sm text-text-muted">
                {isBrowsing ? `${library.browseSongs.length} ${TEXT.loaded}` : `${player.playlist.length} ${TEXT.songs}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isBrowsing && player.playlist.length > 0 && (
              <button
                onClick={clearPlaylist}
                className="rounded-md p-2 text-text-muted transition-colors hover:bg-white/8 hover:text-red-300"
                title={TEXT.clear}
                aria-label={TEXT.clear}
              >
                <Trash2 size={17} strokeWidth={1.8} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-2 text-text-muted transition-colors hover:bg-white/8 hover:text-glow"
              title={TEXT.close}
              aria-label={TEXT.close}
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {(nextPreview || player.playNextQueue.length > 0) && (
          <div className="border-b border-white/10 px-3 py-3">
            {nextPreview && (
              <div className="mb-2 rounded-lg border border-caramel/25 bg-caramel/10 px-3 py-2">
                <p className="text-xs uppercase tracking-widest text-text-muted">{TEXT.next}</p>
                <p className="truncate text-base text-text-primary">{nextPreview.name}</p>
                <p className="truncate text-sm text-text-muted">{formatArtists(nextPreview)}</p>
              </div>
            )}

            {player.playNextQueue.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 px-1 text-xs uppercase tracking-widest text-text-muted">
                  <Clock3 size={13} strokeWidth={1.8} />
                  {TEXT.playLater}
                </p>
                {player.playNextQueue.map((song, index) => (
                  <div key={`${song.id}-${index}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary">
                    <span className="min-w-0 flex-1 truncate">{song.name}</span>
                    <button
                      onClick={() => removePlayNextAt(index)}
                      className="rounded p-1 text-text-muted hover:bg-white/8 hover:text-red-300"
                      aria-label={`${TEXT.remove} ${song.name}`}
                      title={TEXT.remove}
                    >
                      <X size={13} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {library.sources.length > 0 && (
          <div className="border-b border-white/10 px-3 py-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm uppercase tracking-widest text-text-muted">{TEXT.library}</p>
              {user.isLoggedIn && <span className="text-xs text-caramel">{TEXT.netease}</span>}
            </div>
            <div className="flex max-h-44 flex-col gap-1 overflow-y-auto pr-1">
              {library.sources.map((source) => {
                const isActive = source.id === library.activeSourceId;
                const Icon = getSourceIcon(source.kind);

                return (
                  <button
                    key={source.id}
                    onClick={() => void handleSourceSelect(source)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
                      isActive
                        ? 'border-caramel/45 bg-caramel/20 text-glow'
                        : 'border-transparent text-text-secondary hover:border-white/10 hover:bg-white/8'
                    }`}
                    title={source.name}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-bg-primary">
                      {source.coverImgUrl ? (
                        <img src={source.coverImgUrl} alt="" className="h-full w-full object-cover" />
                      ) : source.isLoading ? (
                        <Loader2 size={16} strokeWidth={1.8} className="animate-spin text-caramel" />
                      ) : (
                        <Icon size={16} strokeWidth={1.8} className="text-caramel" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base">{source.name}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {source.isLoading ? TEXT.loading : getSourceMeta(source)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {displayedSongs.length === 0 && !library.browseIsLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ListMusic size={30} strokeWidth={1.8} className="mb-3 text-text-muted" />
            <p className="text-base text-text-secondary">{TEXT.empty}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2">
            {visibleSongs.map((song, index) => {
              const isCurrent = player.currentSong?.id === song.id;

              return (
                <SongRow
                  key={`${song.id}-${index}`}
                  song={song}
                  isCurrent={isCurrent}
                  isPlaying={isCurrent && player.isPlaying}
                  onPlay={() => {
                    if (isBrowsing) {
                      playBrowseSongAt(index);
                    } else if (isCurrent) {
                      togglePlaying();
                    } else {
                      playSongAt(index);
                    }
                  }}
                  onAddNext={isBrowsing ? () => addToPlayNext(song) : undefined}
                  onRemove={isBrowsing ? undefined : () => removeSongAt(index)}
                />
              );
            })}

            {displayedSongs.length > effectiveVisibleSongCount && (
              <button
                onClick={() => setVisibleSongCount((count) => count + VISIBLE_SONG_INCREMENT)}
                className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-white/10 bg-bg-panel py-2.5 text-base text-text-secondary transition duration-200 ease-out hover:-translate-y-0.5 hover:border-caramel/40 hover:text-glow active:translate-y-0"
              >
                {TEXT.showMoreLoaded} ({effectiveVisibleSongCount}/{displayedSongs.length})
              </button>
            )}

            {library.browseIsLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-muted">
                <Loader2 size={15} strokeWidth={1.8} className="animate-spin text-caramel" />
                {TEXT.loading}
              </div>
            )}

            {isBrowsing && library.browseHasMore && !library.browseIsLoading && (
              <button
                onClick={() => void handleLoadMore()}
                className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-white/10 bg-bg-panel py-2.5 text-base text-text-secondary transition duration-200 ease-out hover:-translate-y-0.5 hover:border-caramel/40 hover:text-glow active:translate-y-0"
              >
                {TEXT.loadMore}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

interface SongRowProps {
  song: Song;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onAddNext?: () => void;
  onRemove?: () => void;
}

function SongRow({ song, isCurrent, isPlaying, onPlay, onAddNext, onRemove }: SongRowProps) {
  return (
    <div
      className={`group mx-2 flex items-center gap-3 rounded-lg border px-3 py-3 transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
        isCurrent
          ? 'border-caramel/70 bg-caramel/28 text-glow'
          : 'border-transparent text-text-primary hover:border-white/10 hover:bg-white/8'
      }`}
    >
      <button
        onClick={onPlay}
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border ${
          isCurrent ? 'border-caramel/50 bg-caramel/20' : 'border-white/10 bg-bg-panel'
        }`}
        title={isPlaying ? TEXT.pause : TEXT.play}
        aria-label={isPlaying ? TEXT.pause : TEXT.play}
      >
        {song.cover ? (
          <img src={song.cover} alt="" className="h-full w-full object-cover opacity-70" />
        ) : null}
        <span className="absolute">
          {isPlaying ? <Pause size={16} strokeWidth={1.8} /> : <Play size={16} strokeWidth={1.8} className="ml-0.5" />}
        </span>
      </button>

      <button onClick={onPlay} className="min-w-0 flex-1 text-left" title={`${song.name} - ${formatArtists(song)}`}>
        <p className="truncate text-[17px] leading-6">{song.name}</p>
        <p className="truncate text-sm text-text-muted">{formatArtists(song)}</p>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-text-muted">{formatDuration(song.duration / 1000)}</span>
        {onAddNext && (
          <button
            onClick={onAddNext}
            className="rounded p-1 text-text-muted opacity-0 transition-all hover:bg-white/8 hover:text-caramel group-hover:opacity-100"
            title={TEXT.playLater}
            aria-label={`${TEXT.playLater} ${song.name}`}
          >
            <Plus size={14} strokeWidth={1.8} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-text-muted opacity-0 transition-all hover:bg-white/8 hover:text-red-300 group-hover:opacity-100"
            title={TEXT.remove}
            aria-label={`${TEXT.remove} ${song.name}`}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  );
}

function getNextPreview(player: {
  playlist: Song[];
  currentIndex: number;
  playbackMode: string;
  playNextQueue: Song[];
}): Song | null {
  if (player.playNextQueue.length > 0) return player.playNextQueue[0];
  if (player.playlist.length === 0) return null;
  if (player.playbackMode === 'repeat-one') return player.playlist[player.currentIndex] || null;
  return player.playlist[(player.currentIndex + 1) % player.playlist.length] || null;
}

function hasPlayableUrl(song: Song): song is Song & { url: string } {
  return Boolean(song.url);
}

function getSourceIcon(kind: LibrarySource['kind']) {
  if (kind === 'daily') return Sparkles;
  if (kind === 'liked') return Heart;
  if (kind === 'created') return UserRoundCheck;
  return ListMusic;
}

function getSourceMeta(source: LibrarySource): string {
  const count = source.songCount ?? source.trackCount;
  if (source.kind === 'daily') return count ? `${count} ${TEXT.dailyCount}` : TEXT.dailyUpdated;
  if (source.kind === 'liked') return count ? `${count} ${TEXT.liked}` : TEXT.personal;
  if (source.kind === 'created') return count ? `${count} ${TEXT.songs}` : TEXT.created;
  if (source.kind === 'collected') return count ? `${count} ${TEXT.songs}` : TEXT.collected;
  return count ? `${count} ${TEXT.songs}` : TEXT.recommended;
}

function formatArtists(song: Song): string {
  return song.artists.map((artist) => artist.name).join(', ') || TEXT.unknownArtist;
}

function formatDuration(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
