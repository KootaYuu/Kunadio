import type { KunaPersona } from '../types';

export type KunaAutoEvent = 'song_story' | 'next_preview' | 'long_silence';

export interface KunaModeProfile {
  maxAutoSpeakPer15Min: number;
  minSecondsBetweenAutoSpeak: number;
  maxAutoChars: number;
  maxDialogVoiceChars: number;
  allowSongStory: boolean;
  allowNextPreview: boolean;
  promptHint: string;
  ttsTone: string;
}

const personaProfiles: Record<KunaPersona, KunaModeProfile> = {
  quiet: {
    maxAutoSpeakPer15Min: 1,
    minSecondsBetweenAutoSpeak: 420,
    maxAutoChars: 18,
    maxDialogVoiceChars: 90,
    allowSongStory: false,
    allowNextPreview: true,
    promptHint: 'Kuna 的性格是安静陪伴。默认少说话，说的时候短、轻、柔和；适合工作、阅读或睡前。',
    ttsTone: '[soft low voice]',
  },
  radio: {
    maxAutoSpeakPer15Min: 4,
    minSecondsBetweenAutoSpeak: 75,
    maxAutoChars: 46,
    maxDialogVoiceChars: 140,
    allowSongStory: true,
    allowNextPreview: true,
    promptHint: 'Kuna 的性格是私人电台。保持主持感，可以做简短开场、过渡和歌曲短评，但不要每首歌都说。',
    ttsTone: '[warm late-night radio tone]',
  },
  companion: {
    maxAutoSpeakPer15Min: 9,
    minSecondsBetweenAutoSpeak: 40,
    maxAutoChars: 72,
    maxDialogVoiceChars: 220,
    allowSongStory: true,
    allowNextPreview: true,
    promptHint: 'Kuna 的性格是 AI 音乐伙伴。可以更主动地评论、陪伴、接住用户的话题和回应听歌习惯；比电台模式更像身边一起听歌的人，但仍然给音乐留空间。',
    ttsTone: '[warm companion tone]',
  },
};

export function getKunaModeProfile(persona: KunaPersona): KunaModeProfile {
  return personaProfiles[persona];
}

interface AutoAnnounceOptions {
  persona: KunaPersona;
  event: KunaAutoEvent;
  recentAutoSpeakCount: number;
  msSinceLastSpeak: number;
}

export function shouldAutoAnnounce(options: AutoAnnounceOptions): boolean {
  const profile = getKunaModeProfile(options.persona);
  if (options.recentAutoSpeakCount >= profile.maxAutoSpeakPer15Min) return false;
  if (options.msSinceLastSpeak < profile.minSecondsBetweenAutoSpeak * 1000) return false;
  if (options.event === 'song_story' && !profile.allowSongStory) return false;
  if (options.event === 'next_preview' && !profile.allowNextPreview) return false;
  return true;
}

export function summarizeForVoice(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const punctuationPattern = /[。！？!?；;，,、]/g;
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
