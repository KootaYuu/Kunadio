import assert from 'node:assert/strict';
import { fetchSongUrlsInBatches, mergeTracksWithSongUrls } from './songLoader';
import type { NeteaseSongUrl, NeteaseTrack } from '../types';

const tracks: NeteaseTrack[] = [
  { id: 1, name: 'One', ar: [{ id: 1, name: 'Artist 1' }], al: { id: 1, name: 'Album 1' }, dt: 180000 },
  { id: 2, name: 'Two', ar: [{ id: 2, name: 'Artist 2' }], al: { id: 2, name: 'Album 2' }, dt: 180000 },
  { id: 3, name: 'Three', ar: [{ id: 3, name: 'Artist 3' }], al: { id: 3, name: 'Album 3' }, dt: 180000 },
];

const urls: NeteaseSongUrl[] = [
  { id: 1, url: 'https://music.example/1.mp3', time: 180000 },
  { id: 2, url: null, time: 180000 },
  { id: 3, url: 'https://music.example/3.mp3', time: 30000 },
];

const playable = mergeTracksWithSongUrls(tracks, urls);

assert.deepEqual(playable.map((song) => song.id), [1]);
assert.equal(playable[0].url, '/api/audio/proxy?url=https%3A%2F%2Fmusic.example%2F1.mp3');

let callIndex = 0;
const originalWarn = console.warn;
console.warn = () => undefined;

const fetchedUrls = await fetchSongUrlsInBatches([1, 2, 3, 4], 2, async (ids) => {
  callIndex += 1;
  if (callIndex === 2) {
    throw new Error('network edge');
  }
  return ids.map((id) => ({ id, url: `https://music.example/${id}.mp3`, time: 180000 }));
});

console.warn = originalWarn;

assert.deepEqual(fetchedUrls.map((url) => url.id), [1, 2]);
