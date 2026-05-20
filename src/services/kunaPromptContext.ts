import type { ChatMessage, Message, Song } from '../types';
import { KUNA_SYSTEM_PROMPT } from './gpt';

interface BuildKunaChatMessagesOptions {
  player: {
    isPlaying: boolean;
    currentSong: Song | null;
    volume: number;
    currentTime: number;
  };
  lyricContext: string;
  songInsightText: string;
  history: Message[];
  userMessage: string;
}

export function buildKunaChatMessages({
  player,
  lyricContext,
  songInsightText,
  history,
  userMessage,
}: BuildKunaChatMessagesOptions): ChatMessage[] {
  return [
    { role: 'system', content: KUNA_SYSTEM_PROMPT },
    {
      role: 'system',
      content: [
        `当前播放状态：${player.isPlaying ? '播放中' : '已暂停'}`,
        `歌曲：${player.currentSong?.name || '无'}`,
        `歌手：${player.currentSong?.artists?.map((artist) => artist.name).join(', ') || '无'}`,
        `播放进度：${Math.round(player.currentTime)} 秒`,
        `音量：${player.volume}%`,
        lyricContext ? `当前歌词上下文：${lyricContext}` : '',
        songInsightText ? `当前歌曲资料卡：${songInsightText}` : '',
        '文字回复可以完整一些；语音回复会尽量保留重点，不要为了很短而截断情绪。',
      ].filter(Boolean).join('；'),
    },
    ...history.slice(-10).map((message): ChatMessage => ({
      role: message.role === 'kuna' ? 'assistant' : 'user',
      content: message.content,
    })),
    { role: 'user', content: userMessage },
  ];
}
