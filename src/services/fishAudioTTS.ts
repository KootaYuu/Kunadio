import axios from 'axios';
import { API_BASE } from './apiConfig';

export const ttsAPI = {
  synthesize: async (text: string, referenceId?: string, format = 'mp3'): Promise<string> => {
    const response = await axios.post(
      `${API_BASE}/tts/synthesize`,
      { text, reference_id: referenceId, format },
      { responseType: 'blob' },
    );
    return URL.createObjectURL(response.data);
  },
};

const fishTonePattern = /\[(?:[^\]]{1,80})\]/g;
const ttsMarkupPattern = /\[(?:[^\]]{1,80})\]|\((?:break|long-break|breath|laugh|cough|lip-smacking|sigh)\)/gi;
const pauseAfterPunctuationPattern = /([。！？!?])\s*[，,。]?\s*/g;

export const stripTTSMarkup = (text: string): string =>
  text
    .replace(ttsMarkupPattern, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。！？；：])/g, '$1')
    .trim();

export const prepareKunaTTS = (text: string): string =>
  text
    .replace(fishTonePattern, '')
    .replace(/\(long-break\)/gi, '。 ')
    .replace(/\((?:break|breath)\)/gi, '， ')
    .replace(/\((?:laugh|cough|lip-smacking|sigh)\)/gi, '')
    .replace(pauseAfterPunctuationPattern, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();

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
