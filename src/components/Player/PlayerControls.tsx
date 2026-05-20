import { Focus, PanelRightOpen, Play, Pause, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../../stores/useStore';

const TEXT = {
  shuffle: '\u968f\u673a\u64ad\u653e',
  repeatOne: '\u5355\u66f2\u5faa\u73af',
  sequential: '\u987a\u5e8f\u64ad\u653e',
  previous: '\u4e0a\u4e00\u9996',
  next: '\u4e0b\u4e00\u9996',
  pause: '\u6682\u505c',
  play: '\u64ad\u653e',
  restoreVolume: '\u6062\u590d\u97f3\u91cf',
  mute: '\u9759\u97f3',
  volume: '\u8c03\u6574\u97f3\u91cf',
  immersive: '\u6c89\u6d78',
  restorePanels: '\u6062\u590d',
  immersiveTitle: '\u6536\u8d77\u64ad\u653e\u5217\u8868\u548c Kuna',
  restorePanelsTitle: '\u6253\u5f00\u64ad\u653e\u5217\u8868\u548c Kuna',
};

interface PlayerControlsProps {
  isImmersiveActive: boolean;
  onToggleImmersive: () => void;
}

export default function PlayerControls({ isImmersiveActive, onToggleImmersive }: PlayerControlsProps) {
  const { player, setVolume, nextSong, previousSong, togglePlaying, cyclePlaybackMode } = useStore();
  const ModeIcon = player.playbackMode === 'shuffle'
    ? Shuffle
    : player.playbackMode === 'repeat-one'
      ? Repeat1
      : Repeat;
  const modeLabel = player.playbackMode === 'shuffle'
    ? TEXT.shuffle
    : player.playbackMode === 'repeat-one'
      ? TEXT.repeatOne
      : TEXT.sequential;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:gap-6">
      <button
        onClick={cyclePlaybackMode}
        className="rounded-full p-3 text-text-secondary transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-caramel/14 hover:text-glow active:translate-y-0 sm:p-4"
        title={modeLabel}
        aria-label={modeLabel}
      >
        <ModeIcon size={22} strokeWidth={1.8} className="sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={previousSong}
        className="rounded-full p-3 text-text-secondary transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-caramel/14 hover:text-glow active:translate-y-0 sm:p-4"
        aria-label={TEXT.previous}
      >
        <SkipBack size={24} strokeWidth={1.8} className="sm:h-7 sm:w-7" />
      </button>

      <button
        onClick={togglePlaying}
        className="kunadio-button rounded-full border border-caramel/45 bg-caramel/24 p-4 text-glow transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-caramel/32 active:translate-y-0 sm:p-5"
        aria-label={player.isPlaying ? TEXT.pause : TEXT.play}
      >
        {player.isPlaying ? <Pause size={30} strokeWidth={1.8} className="sm:h-[34px] sm:w-[34px]" /> : <Play size={30} strokeWidth={1.8} className="ml-1 sm:h-[34px] sm:w-[34px]" />}
      </button>

      <button
        onClick={onToggleImmersive}
        className={`kunadio-button order-last flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 sm:order-none sm:h-14 sm:w-auto sm:text-base ${
          isImmersiveActive
            ? 'border-caramel/55 bg-caramel/22 text-glow hover:bg-caramel/28'
            : 'border-white/10 bg-bg-primary/36 text-text-secondary hover:border-caramel/45 hover:bg-caramel/14 hover:text-glow'
        }`}
        title={isImmersiveActive ? TEXT.restorePanelsTitle : TEXT.immersiveTitle}
        aria-label={isImmersiveActive ? TEXT.restorePanelsTitle : TEXT.immersiveTitle}
        aria-pressed={isImmersiveActive}
      >
        {isImmersiveActive ? <PanelRightOpen size={19} strokeWidth={1.8} /> : <Focus size={19} strokeWidth={1.8} />}
        <span>{isImmersiveActive ? TEXT.restorePanels : TEXT.immersive}</span>
      </button>

      <button
        onClick={nextSong}
        className="rounded-full p-3 text-text-secondary transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-caramel/14 hover:text-glow active:translate-y-0 sm:p-4"
        aria-label={TEXT.next}
      >
        <SkipForward size={24} strokeWidth={1.8} className="sm:h-7 sm:w-7" />
      </button>

      <div className="kunadio-button ml-1 hidden items-center gap-3 rounded-lg border border-white/10 bg-bg-primary/36 px-3 py-2 backdrop-blur-sm sm:flex">
        <button
          onClick={() => setVolume(player.volume === 0 ? 70 : 0)}
          className="text-text-secondary transition-colors hover:text-glow"
          title={player.volume === 0 ? TEXT.restoreVolume : TEXT.mute}
          aria-label={player.volume === 0 ? TEXT.restoreVolume : TEXT.mute}
        >
          {player.volume === 0 ? <VolumeX size={22} strokeWidth={1.8} /> : <Volume2 size={22} strokeWidth={1.8} />}
        </button>
        <div className="relative h-8 w-36">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-bg-panel/80">
            <div
              className="h-full rounded-full bg-caramel transition-[width] duration-150"
              style={{ width: `${player.volume}%` }}
            />
          </div>
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-glow bg-caramel shadow-[0_8px_24px_oklch(70%_0.095_62_/_0.24)]"
            style={{ left: `${player.volume}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={player.volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="absolute inset-0 h-8 w-full cursor-pointer opacity-0"
            aria-label={TEXT.volume}
          />
        </div>
        <span className="w-9 text-right text-sm tabular-nums text-text-secondary">{player.volume}</span>
      </div>
    </div>
  );
}
