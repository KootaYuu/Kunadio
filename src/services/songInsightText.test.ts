import assert from 'node:assert/strict';
import { formatSongInsightForKuna } from './songInsightText';
import type { SongInsight } from '../types';

const insight: SongInsight = {
  id: 1,
  name: '海与你',
  artists: ['马也_Crabbit'],
  album: '海与你',
  aliases: ['Sea and You'],
  duration: 295000,
  lyricExcerpt: '我穿过人群和夜色，想把海风留给你。',
  translatedLyricExcerpt: '',
  artistBrief: '独立音乐人，作品常带有民谣和流行质感。',
  releaseYear: 2021,
  moodTags: ['温柔', '怀旧'],
  source: 'netease',
};

const text = formatSongInsightForKuna(insight);

assert.match(text, /歌名：《海与你》/);
assert.match(text, /歌手：马也_Crabbit/);
assert.match(text, /发行年份：2021/);
assert.match(text, /情绪线索：温柔、怀旧/);
assert.match(text, /歌手资料：独立音乐人/);
assert.ok(text.length < 260);
