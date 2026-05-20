const DEFAULT_DIALOG_VOICE_CHARS = 180;
export const KUNA_DIALOG_VOICE_MAX_CHARS = 720;

export const KUNA_AUTO_ANNOUNCE = {
  maxSpeakPer15Min: 4,
  minSecondsBetweenSpeak: 75,
  maxAutoChars: 54,
  maxNextPreviewChars: 32,
};

export function shouldAutoAnnounce(options: {
  recentAutoSpeakCount: number;
  msSinceLastSpeak: number;
}): boolean {
  if (options.recentAutoSpeakCount >= KUNA_AUTO_ANNOUNCE.maxSpeakPer15Min) return false;
  if (options.msSinceLastSpeak < KUNA_AUTO_ANNOUNCE.minSecondsBetweenSpeak * 1000) return false;
  return true;
}

export function shouldStartAutoAnnouncement(options: {
  kunaIsSpeaking: boolean;
  ttsIsPlaying: boolean;
}): boolean {
  return !options.kunaIsSpeaking && !options.ttsIsPlaying;
}

export function summarizeForVoice(text: string, maxChars = DEFAULT_DIALOG_VOICE_CHARS): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const punctuationPattern = /[。！？?；，、]/g;
  let match: RegExpExecArray | null;
  let bestCut = 0;

  while ((match = punctuationPattern.exec(clean))) {
    const cut = match.index + 1;
    if (cut <= maxChars) bestCut = cut;
  }

  if (bestCut > 0) {
    return clean.slice(0, bestCut).trim();
  }

  return `${clean.slice(0, Math.max(1, maxChars - 3)).trim()}...`;
}
