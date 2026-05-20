import { useStore } from '../../stores/useStore';

export default function KunaAvatar() {
  const { setKunaChatOpen, kuna } = useStore();

  return (
    <button
      onClick={() => setKunaChatOpen(!kuna.isChatOpen)}
      className="group relative"
      aria-label={kuna.isChatOpen ? '关闭 Kuna 对话' : '打开 Kuna 对话'}
    >
      {kuna.isSpeaking && (
        <div className="absolute inset-0 animate-ping rounded-full bg-caramel/30" />
      )}

      <div
        className={`relative h-16 w-16 overflow-hidden rounded-full border-2 transition-all duration-500 ${
          kuna.isSpeaking
            ? 'scale-110 border-amber shadow-lg shadow-amber/40'
            : kuna.isChatOpen
              ? 'border-caramel shadow-lg shadow-caramel/25'
              : 'border-caramel/50 hover:scale-105 hover:border-caramel'
        }`}
      >
        <img
          src="/kuna-avatar.png"
          alt="Kuna"
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<div class="w-full h-full bg-caramel/20 flex items-center justify-center text-caramel text-xl">K</div>';
            }
          }}
        />
      </div>

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs transition-all duration-300 ${
          kuna.isSpeaking ? 'text-amber glow-text' : 'text-text-muted group-hover:text-caramel'
        }`}>
          {kuna.isSpeaking ? 'Kuna 正在说话...' : kuna.isChatOpen ? '点击收起 Kuna' : '点击打开 Kuna'}
        </span>
      </div>
    </button>
  );
}
