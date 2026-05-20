/**
 * Global TTS manager - ensures only one TTS audio plays at a time
 * Prevents multiple Kuna voices from overlapping
 */

let currentTTSAudio: HTMLAudioElement | null = null;
let onEndedCallback: (() => void) | null = null;

const finishPlayback = () => {
  currentTTSAudio = null;
  if (onEndedCallback) {
    const callback = onEndedCallback;
    onEndedCallback = null;
    callback();
  }
};

export const ttsManager = {
  /**
   * Play a TTS audio URL. Stops any currently playing TTS first.
   */
  play: (audioUrl: string, volume = 1): HTMLAudioElement => {
    // Stop any existing TTS immediately
    ttsManager.stop();

    const audio = new Audio(audioUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    currentTTSAudio = audio;

    audio.addEventListener('ended', finishPlayback, { once: true });
    audio.addEventListener('error', finishPlayback, { once: true });

    audio.play().catch((err) => {
      console.error('TTS play error:', err);
      finishPlayback();
    });

    return audio;
  },

  /**
   * Stop the current TTS audio
   */
  stop: () => {
    if (currentTTSAudio) {
      currentTTSAudio.pause();
      currentTTSAudio.currentTime = 0;
      currentTTSAudio = null;
    }
    if (onEndedCallback) {
      onEndedCallback();
      onEndedCallback = null;
    }
  },

  /**
   * Check if TTS is currently playing
   */
  isPlaying: (): boolean => {
    return currentTTSAudio !== null && !currentTTSAudio.paused && !currentTTSAudio.ended;
  },

  /**
   * Set a callback for when TTS ends
   */
  setOnEnded: (callback: () => void) => {
    onEndedCallback = callback;
  },
};
