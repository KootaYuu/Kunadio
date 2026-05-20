import { Music2 } from 'lucide-react';
import { useStore } from '../../stores/useStore';

export default function AlbumCover() {
  const { player } = useStore();

  return (
    <div className="relative float-animation">
      <div className="absolute inset-5 rounded-lg bg-caramel/18 blur-2xl" />

      <div className="relative h-72 w-72 overflow-hidden rounded-lg border border-white/15 bg-bg-panel shadow-2xl shadow-black/40 sm:h-80 sm:w-80 lg:h-[22rem] lg:w-[22rem]">
        {player.currentSong?.cover ? (
          <img
            src={player.currentSong.cover}
            alt={player.currentSong.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-panel">
            <Music2 size={76} strokeWidth={1.5} className="text-caramel/42" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/58 via-transparent to-white/4" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/18" />
      </div>
    </div>
  );
}
