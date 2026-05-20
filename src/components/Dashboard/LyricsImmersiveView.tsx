import { ListTree, Loader2, Music2, Quote, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../stores/useStore';
import {
  findActiveLyricIndex,
  getImmersiveLyricsDisplayState,
  getLyricWindow,
  parseLrc,
} from '../../services/lyrics';
import { neteaseAPI } from '../../services/netease';

const TEXT = {
  loading: '正在读取歌词...',
  empty: '这首歌暂时没有歌词',
  waiting: '播放一首歌，歌词会出现在这里',
  now: 'Now singing',
  browse: '浏览歌词',
  follow: '回到当前',
  jump: '点击歌词跳转',
  noArtist: '未知艺术家',
};

export default function LyricsImmersiveView() {
  const {
    player,
    ui,
    seekTo,
    setLyrics,
    setLyricsLoading,
    setLyricsError,
  } = useStore();
  const [isBrowsingLyrics, setIsBrowsingLyrics] = useState(false);
  const lyricListRef = useRef<HTMLDivElement | null>(null);

  const songId = player.currentSong?.id;
  const activeIndex = useMemo(
    () => findActiveLyricIndex(ui.lyrics, player.currentTime),
    [player.currentTime, ui.lyrics],
  );
  const [previousLine, activeLine, nextLine] = getLyricWindow(ui.lyrics, activeIndex);
  const artistNames = player.currentSong?.artists?.map((artist) => artist.name).join(', ') || TEXT.noArtist;
  const displayState = getImmersiveLyricsDisplayState({
    hasCurrentSong: Boolean(player.currentSong),
    hasCover: Boolean(player.currentSong?.cover),
    isLoading: ui.lyricsLoading,
    lyricsError: ui.lyricsError,
    activeLine,
  });
  const visibleActiveLine = displayState.mode === 'lyrics' ? activeLine : null;

  useEffect(() => {
    let isCancelled = false;

    async function loadLyrics() {
      if (!songId) {
        setLyrics([]);
        setLyricsError(null);
        setLyricsLoading(false);
        return;
      }

      setIsBrowsingLyrics(false);
      setLyrics([]);
      setLyricsError(null);
      setLyricsLoading(true);

      try {
        const result = await neteaseAPI.getLyrics(songId);
        const parsed = parseLrc(result?.lrc?.lyric || '');
        if (isCancelled) return;
        setLyrics(parsed);
        setLyricsError(parsed.length === 0 ? TEXT.empty : null);
      } catch (error) {
        console.error('Failed to load lyrics:', error);
        if (!isCancelled) {
          setLyrics([]);
          setLyricsError(TEXT.empty);
        }
      } finally {
        if (!isCancelled) {
          setLyricsLoading(false);
        }
      }
    }

    void loadLyrics();

    return () => {
      isCancelled = true;
    };
  }, [songId, setLyrics, setLyricsError, setLyricsLoading]);

  useEffect(() => {
    if (!isBrowsingLyrics) return;
    const targetIndex = activeIndex >= 0 ? activeIndex : 0;
    const activeNode = lyricListRef.current?.querySelector(`[data-lyric-index="${targetIndex}"]`);
    activeNode?.scrollIntoView({ block: 'center' });
  }, [isBrowsingLyrics, activeIndex]);

  const handleLyricJump = (time: number) => {
    seekTo(time);
    setIsBrowsingLyrics(false);
  };

  if (displayState.mode === 'waiting') {
    return (
      <div className="flex min-h-[34rem] w-full flex-col items-center justify-center text-center text-xl leading-relaxed text-text-secondary">
        <Quote size={34} strokeWidth={1.5} className="mb-4 text-caramel/64" />
        {TEXT.waiting}
      </div>
    );
  }

  return (
    <div className="relative grid min-h-[24rem] w-full grid-cols-1 items-center gap-5 overflow-hidden px-1 py-2 sm:min-h-[34rem] sm:gap-8 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:px-12">
      <div className="min-w-0">
        <div className="mb-5 flex max-w-4xl flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative mx-auto mb-1 block h-28 w-28 overflow-hidden rounded-lg border border-white/12 bg-bg-primary/46 shadow-[0_18px_54px_oklch(8%_0.01_58_/_0.34)] sm:hidden">
            {player.currentSong?.cover ? (
              <img
                src={player.currentSong.cover}
                alt={player.currentSong.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music2 size={38} strokeWidth={1.4} className="text-caramel/45" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/28 via-transparent to-white/5" />
          </div>

          <div className="min-w-0">
            <p className="mb-3 text-xs uppercase tracking-[0.38em] text-caramel/85 sm:text-sm">{TEXT.now}</p>
            <p className="truncate text-base text-text-secondary sm:text-xl">
              {player.currentSong?.name || 'Kunadio'} · {artistNames}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBrowsingLyrics((value) => !value)}
            className="kunadio-button inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-bg-primary/46 px-3 py-2 text-sm text-text-secondary backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 hover:border-caramel/45 hover:bg-caramel/14 hover:text-glow active:translate-y-0 sm:px-4 sm:py-2.5"
            aria-pressed={isBrowsingLyrics}
          >
            {isBrowsingLyrics ? <RotateCcw size={17} /> : <ListTree size={17} />}
            <span>{isBrowsingLyrics ? TEXT.follow : TEXT.browse}</span>
          </button>
        </div>

        {displayState.mode === 'loading' ? (
          <div className="flex h-[42dvh] max-w-4xl items-center justify-center gap-3 text-base text-text-secondary sm:h-[31rem]">
            <Loader2 size={19} className="animate-spin text-caramel" />
            {TEXT.loading}
          </div>
        ) : displayState.mode === 'empty' ? (
          <div className="flex h-[42dvh] max-w-4xl flex-col items-start justify-center text-xl leading-relaxed text-text-secondary sm:h-[31rem] sm:text-3xl">
            <Quote size={34} strokeWidth={1.5} className="mb-4 text-caramel/64" />
            {ui.lyricsError || TEXT.empty}
          </div>
        ) : isBrowsingLyrics ? (
          <div className="h-[52dvh] max-w-4xl overflow-hidden rounded-lg border border-white/10 bg-bg-primary/42 backdrop-blur-md sm:h-[26rem]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3 text-sm text-text-secondary">
              <span>{TEXT.jump}</span>
              <span className="font-mono text-text-muted">{ui.lyrics.length}</span>
            </div>
            <div ref={lyricListRef} className="h-[calc(52dvh-3.125rem)] overflow-y-auto px-3 py-4 sm:h-[calc(26rem-3.125rem)]">
              {ui.lyrics.map((line, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${line.time}-${index}`}
                    type="button"
                    data-lyric-index={index}
                    onClick={() => handleLyricJump(line.time)}
                    className={`group flex w-full items-start gap-4 rounded-lg px-4 py-3 text-left transition duration-200 ease-out hover:bg-caramel/12 ${
                      isActive ? 'bg-caramel/18 text-glow' : 'text-text-secondary'
                    }`}
                  >
                    <span className="mt-1 w-12 shrink-0 font-mono text-xs text-text-muted">
                      {formatLyricTime(line.time)}
                    </span>
                    <span className={`text-base leading-snug sm:text-2xl ${isActive ? 'font-semibold' : ''}`}>
                      {line.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid h-[42dvh] max-w-4xl grid-rows-[3.5rem_1fr_4rem] gap-3 overflow-hidden sm:h-[31rem] sm:grid-rows-[5rem_18rem_5rem] sm:gap-4">
            <div className="flex min-h-0 items-end overflow-hidden">
              <p className="line-clamp-2 text-lg leading-snug text-text-muted/50 sm:text-3xl">
                {previousLine?.text || ''}
              </p>
            </div>
            <div className="flex min-h-0 items-center overflow-hidden">
              <p
                key={`${visibleActiveLine?.time}-${visibleActiveLine?.text}`}
                className="lyric-hero line-clamp-4 max-w-[9ch] text-[clamp(3.25rem,17vw,5.6rem)] font-semibold leading-[1.03] tracking-normal text-glow sm:line-clamp-3 sm:max-w-[11ch] sm:text-7xl lg:text-8xl"
              >
                {visibleActiveLine?.text}
              </p>
            </div>
            <div className="flex min-h-0 items-start overflow-hidden">
              <p className="line-clamp-2 text-xl leading-snug text-text-secondary/76 sm:text-4xl">
                {nextLine?.text || ''}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative hidden aspect-square w-full max-w-[28rem] justify-self-center lg:block">
        <div className="absolute -inset-8 rounded-lg bg-caramel/12 blur-3xl" />
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/12 bg-bg-primary/46 shadow-[0_32px_90px_oklch(8%_0.01_58_/_0.42),inset_0_1px_0_oklch(95%_0.024_76_/_0.1)]">
          {player.currentSong?.cover ? (
            <img
              src={player.currentSong.cover}
              alt={player.currentSong.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music2 size={88} strokeWidth={1.4} className="text-caramel/45" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/46 via-transparent to-white/5" />
        </div>
      </div>
    </div>
  );
}

function formatLyricTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
