import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { shouldToggleKunaChatFromSpace } from '../utils/keyboard';

export function useKeyboardShortcuts() {
  const { setKunaChatOpen, kuna } = useStore();
  const lastSpaceTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Double-tap space to toggle Kuna chat
      if (shouldToggleKunaChatFromSpace(e)) {
        const now = Date.now();
        const timeSinceLastSpace = now - lastSpaceTime.current;

        if (timeSinceLastSpace < 400) {
          // Double tap detected
          e.preventDefault();
          setKunaChatOpen(!kuna.isChatOpen);
        }

        lastSpaceTime.current = now;
      }

      // ESC to close Kuna chat
      if (e.code === 'Escape' && kuna.isChatOpen) {
        setKunaChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setKunaChatOpen, kuna.isChatOpen]);
}
