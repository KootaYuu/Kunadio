import assert from 'node:assert/strict';
import { KUNA_TOOLS } from './gpt';
import { formatMusicSearchForKuna, parseToolArguments } from './musicSearch';
import type { MusicSearchResponse } from '../types';

const searchTool = KUNA_TOOLS.find((tool) => tool.function.name === 'searchMusicInfo');

assert.ok(searchTool, 'searchMusicInfo tool should be exposed to GPT');
assert.equal(searchTool?.function.parameters.required?.includes('query'), true);
assert.match(searchTool?.function.description || '', /music/i);

const response: MusicSearchResponse = {
  query: '坂本龍一 other works',
  summary: 'Found 2 reliable music references for "坂本龍一 other works".',
  results: [
    {
      title: 'Ryuichi Sakamoto',
      snippet: 'Japanese composer known for Merry Christmas, Mr. Lawrence and Energy Flow.',
      url: 'https://en.wikipedia.org/wiki/Ryuichi_Sakamoto',
      source: 'wikipedia',
    },
    {
      title: 'Merry Christmas Mr. Lawrence',
      snippet: 'A well-known composition by Ryuichi Sakamoto.',
      url: 'https://music.163.com/#/song?id=123',
      source: 'netease',
    },
  ],
};

const text = formatMusicSearchForKuna(response);

assert.match(text, /Search query: 坂本龍一 other works/);
assert.match(text, /Source: wikipedia/);
assert.match(text, /Ryuichi Sakamoto/);
assert.match(text, /https:\/\/en\.wikipedia\.org/);
assert.ok(text.length < 1200);

const emptyText = formatMusicSearchForKuna({
  query: 'unknown bedroom musician',
  summary: 'No useful public results found.',
  results: [],
});

assert.match(emptyText, /No useful public results found/);

assert.deepEqual(parseToolArguments('{"query":"李宗盛 写过的歌","artist":"李宗盛"}'), {
  query: '李宗盛 写过的歌',
  artist: '李宗盛',
});
assert.deepEqual(parseToolArguments('{bad json'), {});
