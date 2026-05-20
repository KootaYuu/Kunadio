import assert from 'node:assert/strict';
import { buildLibrarySources } from './librarySources';
import type { NeteasePlaylistSummary } from '../types';

const playlists: NeteasePlaylistSummary[] = [
  { id: 10, name: '我喜欢的音乐', trackCount: 128, creator: { userId: 42 } },
  { id: 11, name: '夜晚工作', trackCount: 80, creator: { userId: 42 } },
  { id: 12, name: '收藏的爵士', trackCount: 64, creator: { userId: 99 } },
];

const sources = buildLibrarySources({ userId: '42', playlists });

assert.deepEqual(
  sources.map((source) => ({ id: source.id, kind: source.kind, name: source.name })),
  [
    { id: 'daily', kind: 'daily', name: '每日推荐' },
    { id: 'liked', kind: 'liked', name: '我喜欢的音乐' },
    { id: 'playlist-11', kind: 'created', name: '夜晚工作' },
    { id: 'playlist-12', kind: 'collected', name: '收藏的爵士' },
  ],
);

assert.equal(sources[1].playlistId, 10);
assert.equal(sources[1].trackCount, 128);
