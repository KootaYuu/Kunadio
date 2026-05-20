import { Loader2, Quote } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { findActiveLyricIndex, parseLrc } from '../../services/lyrics';
import { neteaseAPI } from '../../services/netease';

const TEXT = {
  title: '\u6b4c\u8bcd',
  loading: '\u6b63\u5728\u8bfb\u53d6\u6b4c\u8bcd...',
  empty: '\u8fd9\u9996\u6b4c\u6682\u65f6\u6ca1\u6709\u6b4c\u8bcd',
  waiting: '\u64ad\u653e\u4e00\u9996\u6b4c\uff0c\u6b4c\u8bcd\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc',
};

export default function LyricsPanel() {
  const {
    player,
    ui,
    setLyrics,
    setLyricsLoading,
    setLyricsError,
  } = useStore();

  const songId = player.currentSong?.id;
  const activeIndex = useMemo(
    () => findActiveLyricIndex(ui.lyrics, player.currentTime),
    [player.currentTime, ui.lyrics],
  );
  const previousLine = activeIndex > 0 ? ui.lyrics[activeIndex - 1] : null;
  const activeLine = activeIndex >= 0 ? ui.lyrics[activeIndex] : ui.lyrics[0] || null;
  const nextLine = activeIndex >= 0 ? ui.lyrics[activeIndex + 1] || null : ui.lyrics[1] || null;

  useEffect(() => {
    let isCancelled = false;

    async function loadLyrics() {
      if (!songId) {
        setLyrics([]);
        setLyricsError(null);
        setLyricsLoading(false);
        return;
      }

      setLyrics([]);
      setLyricsError(null);
      setLyricsLoading(true);

      try {
        const result = await neteaseAPI.getLyrics(songId);
        const rawLyric = result?.lrc?.lyric || '';
        const parsed = parseLrc(rawLyric);

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

  return (
    <section className="relative flex min-h-0 w-full max-w-[560px] flex-col overflow-hidden rounded-lg border border-white/8 bg-bg-primary/58 px-6 py-6 shadow-[inset_0_1px_0_oklch(95%_0.024_76_/_0.08)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-caramel/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-primary/70 to-transparent" />
      {ui.lyricsLoading ? (
        <div className="relative flex flex-1 items-center justify-center gap-2 text-sm text-text-muted">
          <Loader2 size={16} className="animate-spin text-caramel" />
          {TEXT.loading}
        </div>
      ) : ui.lyricsError || !activeLine ? (
        <div className="relative flex flex-1 flex-col items-center justify-center text-center text-base leading-relaxed text-text-secondary">
          <Quote size={24} strokeWidth={1.5} className="mb-3 text-caramel/60" />
          {songId ? ui.lyricsError || TEXT.empty : TEXT.waiting}
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col justify-center gap-5 overflow-hidden">
          <p className="min-h-7 text-lg leading-relaxed text-text-muted/55 transition duration-500 ease-out">
            {previousLine?.text || ''}
          </p>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.34em] text-caramel/80">{TEXT.title}</p>
            <p
              key={`${activeLine.time}-${activeLine.text}`}
              className="lyric-current line-clamp-3 max-w-[18ch] text-4xl font-semibold leading-tight tracking-normal text-glow lg:text-5xl"
            >
              {activeLine.text}
            </p>
          </div>
          <p className="min-h-7 text-xl leading-relaxed text-text-secondary/72 transition duration-500 ease-out">
            {nextLine?.text || ''}
          </p>
        </div>
      )}
    </section>
  );
}
