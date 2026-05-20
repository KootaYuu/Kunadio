import assert from 'node:assert/strict';
import { buildKunaChatMessages } from './kunaPromptContext';
import { KUNA_SYSTEM_PROMPT } from './gpt';
import type { Message, Song } from '../types';

const song: Song = {
  id: 1,
  name: 'Night Song',
  artists: [{ id: 2, name: 'Kuna Band' }],
  album: { id: 3, name: 'Radio Room' },
  duration: 180000,
};

const history: Message[] = [
  { id: '1', role: 'user', content: '刚才那首不错', timestamp: 1 },
  { id: '2', role: 'kuna', content: '嗯，我也喜欢那段鼓。', timestamp: 2 },
];

const messages = buildKunaChatMessages({
  player: {
    isPlaying: true,
    currentSong: song,
    currentTime: 42,
    volume: 70,
  },
  lyricContext: '正在唱到副歌前',
  songInsightText: '发行年份：2001',
  history,
  userMessage: '介绍一下现在这首',
});

assert.equal(messages[0].role, 'system');
assert.equal(messages[0].content, KUNA_SYSTEM_PROMPT);
assert.equal(messages[1].role, 'system');
assert.match(messages[1].content, /当前播放状态：播放中/);
assert.match(messages[1].content, /歌曲：Night Song/);
assert.match(messages[1].content, /歌手：Kuna Band/);
assert.match(messages[1].content, /当前歌词上下文：正在唱到副歌前/);
assert.match(messages[1].content, /当前歌曲资料卡：发行年份：2001/);
assert.equal(messages[2].role, 'user');
assert.equal(messages[2].content, '刚才那首不错');
assert.equal(messages[3].role, 'assistant');
assert.equal(messages[3].content, '嗯，我也喜欢那段鼓。');
assert.equal(messages.at(-1)?.role, 'user');
assert.equal(messages.at(-1)?.content, '介绍一下现在这首');

const allContent = messages.map((message) => message.content).join('\n');
assert.equal(allContent.includes('当前模式'), false);
assert.equal(allContent.includes('Quiet'), false);
assert.equal(allContent.includes('Companion'), false);
assert.equal(allContent.includes('模式要求'), false);
