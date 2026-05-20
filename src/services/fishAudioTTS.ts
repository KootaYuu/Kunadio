import axios from 'axios';
import { API_BASE } from './apiConfig';

export const ttsAPI = {
  synthesize: async (text: string, referenceId?: string, format = 'mp3'): Promise<string> => {
    const response = await axios.post(
      `${API_BASE}/tts/synthesize`,
      { text, reference_id: referenceId, format },
      { responseType: 'blob' }
    );
    return URL.createObjectURL(response.data);
  },
};

const fishControlPattern = /\[(?:[^\]]{1,80})\]|\((?:break|long-break|breath|laugh|cough|lip-smacking|sigh)\)/gi;

export const stripTTSMarkup = (text: string): string =>
  text
    .replace(fishControlPattern, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。！？；：])/g, '$1')
    .trim();

export const prepareKunaTTS = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const hasFishControls = fishControlPattern.test(trimmed);
  fishControlPattern.lastIndex = 0;

  if (hasFishControls) {
    return trimmed;
  }

  return `[warm late-night radio tone] ${trimmed
    .replace(/([。！？])\s*/g, '$1 (break) ')
    .replace(/(，|；)\s*/g, '$1 ')
    .replace(/\(break\)\s*$/g, '')
    .trim()}`;
};

// Preload TTS audio
const audioCache = new Map<string, string>();

export const preloadTTS = async (text: string, referenceId?: string): Promise<string> => {
  const cacheKey = `${referenceId || 'default'}_${text}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }
  const url = await ttsAPI.synthesize(text, referenceId);
  audioCache.set(cacheKey, url);
  return url;
};

export const clearTTSCache = () => {
  audioCache.forEach((url) => URL.revokeObjectURL(url));
  audioCache.clear();
};
