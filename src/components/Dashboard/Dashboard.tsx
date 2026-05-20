import { useStore } from '../../stores/useStore';
import PlayerControls from '../Player/PlayerControls';
import PlaylistPanel from '../Player/PlaylistPanel';
import LyricsImmersiveView from './LyricsImmersiveView';
import { ttsManager } from '../../services/ttsManager';
import { ArrowLeft, Clock, ListMusic, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const TEXT = {
  backTitle: '\u8fd4\u56de\u5165\u53e3',
  back: '\u8fd4\u56de',
  playlist: '\u64ad\u653e\u5217\u8868',
  kuna: 'Kuna',
  waiting: '\u7b49\u5f85\u64ad\u653e...',
  seek: '\u8c03\u6574\u64ad\u653e\u8fdb\u5ea6',
  hint: '\u53cc\u51fb\u7a7a\u683c\u5524\u9192 Kuna',
};

export default function Dashboard() {
  const { player, user, kuna, returnToEntry, seekTo, setKunaChatOpen } = useStore();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 767px)').matches;
  });
  const hasAutoOpenedKunaRef = useRef(false);
  const coverUrl = player.currentSong?.cover;

  const handleReturnToEntry = () => {
    ttsManager.stop();
    setIsPlaylistOpen(false);
    returnToEntry();
  };

  const isImmersiveActive = !isPlaylistOpen && !kuna.isChatOpen;

  const handleToggleImmersive = () => {
    if (isImmersiveActive) {
      if (isMobile) {
        setIsPlaylistOpen(true);
        setKunaChatOpen(false);
      } else {
        setIsPlaylistOpen(true);
        setKunaChatOpen(true);
      }
      return;
    }

    setIsPlaylistOpen(false);
    setKunaChatOpen(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hasEnteredApp = user.isLoggedIn || user.hasSkippedLogin;
    if (!isMobile && hasEnteredApp && !hasAutoOpenedKunaRef.current && !kuna.isChatOpen) {
      hasAutoOpenedKunaRef.current = true;
      setKunaChatOpen(true);
    }

    if (!hasEnteredApp) {
      hasAutoOpenedKunaRef.current = false;
    }
  }, [isMobile, kuna.isChatOpen, setKunaChatOpen, user.hasSkippedLogin, user.isLoggedIn]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const progressPercent = player.duration > 0
    ? (player.currentTime / player.duration) * 100
    : 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg-primary px-4 py-4 text-text-primary sm:px-8 sm:py-6">
      <div className="absolute inset-0 overflow-hidden">
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-3xl"
              aria-hidden="true"
            />
            <img
              src={coverUrl}
              alt=""
              className="absolute right-[-10vw] top-[-16vh] h-[78vh] w-[78vh] rotate-6 rounded-lg object-cover opacity-18 blur-sm"
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_18%_20%,oklch(70%_0.095_62_/_0.18),transparent_32%),radial-gradient(circle_at_88%_10%,oklch(78%_0.11_76_/_0.12),transparent_28%),linear-gradient(135deg,oklch(18%_0.018_58),oklch(12%_0.014_58)_55%,oklch(17%_0.025_42))]" />
        )}
        <div className="absolute inset-0 bg-bg-primary/58" />
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary/80 via-bg-primary/24 to-bg-primary/88" />
      </div>

      <div className="relative z-20 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {(user.isLoggedIn || user.hasSkippedLogin) && (
              <button
                onClick={handleReturnToEntry}
                className="kunadio-button mr-1 flex items-center gap-2 rounded-lg border border-white/10 bg-bg-primary/45 px-3 py-2 text-sm text-text-secondary backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 hover:border-caramel/45 hover:bg-caramel/14 hover:text-glow active:translate-y-0 sm:px-4 sm:py-2.5 sm:text-base"
                title={TEXT.backTitle}
                aria-label={TEXT.backTitle}
              >
                <ArrowLeft size={17} />
                <span className="hidden sm:inline">{TEXT.back}</span>
              </button>
            )}
            <div className="h-2.5 w-2.5 rounded-full bg-caramel shadow-[0_0_18px_oklch(70%_0.095_62_/_0.36)]" />
            <span className="truncate text-base font-semibold tracking-[0.28em] text-glow sm:text-xl">
              KUNADIO
            </span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setIsPlaylistOpen((open) => !open)}
              className={`kunadio-button flex items-center gap-2 rounded-lg border px-4 py-2.5 text-base backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
                isPlaylistOpen
                  ? 'border-caramel/60 bg-caramel/22 text-glow'
                  : 'border-white/10 bg-bg-primary/45 hover:border-caramel/45 hover:bg-caramel/14 hover:text-glow'
              }`}
            >
              <ListMusic size={19} />
              <span>{TEXT.playlist}</span>
              <span className="rounded-full bg-caramel/18 px-2 py-0.5 font-mono text-sm text-glow">{player.playlist.length}</span>
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-text-secondary">
          <div className="kunadio-button hidden items-center gap-3 rounded-lg border border-white/10 bg-bg-primary/38 px-5 py-3 text-text-secondary backdrop-blur-md sm:flex">
            <Clock size={24} />
            <span className="font-mono text-2xl leading-none tracking-wide text-glow">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col justify-center pb-40 pt-2 sm:pb-0 sm:pt-4">
        <LyricsImmersiveView />

        <section className="kunadio-surface fixed bottom-3 left-3 right-3 z-30 mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-lg border border-white/8 bg-bg-primary/76 px-4 py-4 backdrop-blur-xl sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:mb-8 sm:w-full sm:gap-5 sm:bg-bg-primary/34 sm:px-7 sm:py-5 sm:backdrop-blur-lg">
          <div className="w-full max-w-2xl space-y-3.5">
            <div className="relative h-8">
              <div className="absolute left-0 right-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-bg-panel/90">
                <div
                  className="h-full rounded-full bg-caramel transition-[width] duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div
                className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-glow bg-caramel shadow-[0_8px_24px_oklch(70%_0.095_62_/_0.28)]"
                style={{ left: `${progressPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={player.duration || 0}
                step={0.1}
                value={Math.min(player.currentTime, player.duration || player.currentTime)}
                disabled={!player.duration}
                onChange={(event) => seekTo(Number(event.target.value))}
                className="absolute inset-0 h-8 w-full cursor-pointer opacity-0 disabled:cursor-default"
                aria-label={TEXT.seek}
              />
            </div>
            <div className="flex justify-between font-mono text-xs text-text-secondary sm:text-sm">
              <span>{formatDuration(player.currentTime)}</span>
              <span>{formatDuration(player.duration)}</span>
            </div>
          </div>

          <div className="flex w-full max-w-2xl items-center justify-center gap-2 sm:hidden">
            <button
              onClick={() => setIsPlaylistOpen((open) => !open)}
              className={`kunadio-button flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm backdrop-blur-md transition duration-300 ease-out active:scale-[0.98] ${
                isPlaylistOpen
                  ? 'border-caramel/60 bg-caramel/22 text-glow'
                  : 'border-white/10 bg-bg-primary/45 text-text-secondary'
              }`}
            >
              <ListMusic size={18} />
              <span>{TEXT.playlist}</span>
              <span className="font-mono text-xs">{player.playlist.length}</span>
            </button>
            <button
              onClick={() => setKunaChatOpen(!kuna.isChatOpen)}
              className={`kunadio-button flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm backdrop-blur-md transition duration-300 ease-out active:scale-[0.98] ${
                kuna.isChatOpen
                  ? 'border-caramel/60 bg-caramel/22 text-glow'
                  : 'border-white/10 bg-bg-primary/45 text-text-secondary'
              }`}
            >
              <MessageCircle size={18} />
              <span>{TEXT.kuna}</span>
            </button>
          </div>

          <PlayerControls
            isImmersiveActive={isImmersiveActive}
            onToggleImmersive={handleToggleImmersive}
          />
        </section>
      </main>

      <PlaylistPanel isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />

      <div className="absolute bottom-4 right-6 z-20 hidden text-xs text-text-muted opacity-70 sm:block">
        {TEXT.hint}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
