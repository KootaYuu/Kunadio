import { useEffect } from 'react';
import { useStore } from './stores/useStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Dashboard from './components/Dashboard/Dashboard';
import KunaChatPanel from './components/Kuna/KunaChatPanel';
import LoginModal from './components/LoginModal';
import { shouldPreventSpaceScroll } from './utils/keyboard';

function App() {
  const { kuna, user, ui } = useStore();
  useAudioPlayer();
  useKeyboardShortcuts();

  useEffect(() => {
    // Prevent spacebar from scrolling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldPreventSpaceScroll(e)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full bg-bg-primary overflow-hidden">
      {/* Loading overlay */}
      {ui.isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-caramel/30 border-t-caramel rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">加载中...</p>
          </div>
        </div>
      )}

      {/* Login modal - shown when not logged in and hasn't skipped */}
      {!user.isLoggedIn && !user.hasSkippedLogin && (
        <LoginModal />
      )}

      {/* Ambient background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-caramel/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber/5 rounded-full blur-3xl" />
      </div>

      {/* Main dashboard */}
      <Dashboard />

      {/* Kuna chat panel */}
      {kuna.isChatOpen && <KunaChatPanel />}
    </div>
  );
}

export default App;
