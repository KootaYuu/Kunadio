import assert from 'node:assert/strict';
import {
  findActiveLyricIndex,
  getImmersiveLyricsDisplayState,
  getLyricContextForKuna,
  getLyricWindow,
  parseLrc,
} from './lyrics';

assert.deepEqual(
  getImmersiveLyricsDisplayState({
    hasCurrentSong: true,
    hasCover: true,
    isLoading: false,
    lyricsError: 'no lyrics',
    activeLine: null,
  }),
  {
    mode: 'empty',
    showArtwork: true,
  },
);

const raw = [
  '[00:01.00]第一句',
  '[00:04.50]第二句',
  '[00:08.00]第三句',
  '[00:11.20]第四句',
  '[ar:Kuna]',
  '[00:14.00]',
].join('\n');

const lines = parseLrc(raw);

assert.deepEqual(lines, [
  { time: 1, text: '第一句' },
  { time: 4.5, text: '第二句' },
  { time: 8, text: '第三句' },
  { time: 11.2, text: '第四句' },
]);

assert.equal(findActiveLyricIndex(lines, 0.5), -1);
assert.equal(findActiveLyricIndex(lines, 1.1), 0);
assert.equal(findActiveLyricIndex(lines, 8.2), 2);
assert.equal(findActiveLyricIndex(lines, 30), 3);

assert.equal(
  getLyricContextForKuna(lines, 8.2),
  '当前歌词：第三句；上一句：第二句；下一句：第四句',
);

assert.deepEqual(parseLrc('[00:01.00][00:03.00]重复时间'), [
  { time: 1, text: '重复时间' },
  { time: 3, text: '重复时间' },
]);

assert.deepEqual(
  getLyricWindow(lines, 2).map((item) => item?.text || ''),
  ['第二句', '第三句', '第四句'],
);

assert.deepEqual(
  getLyricWindow(lines, -1).map((item) => item?.text || ''),
  ['', '第一句', '第二句'],
);
