import assert from 'node:assert/strict';
import { fetchSongUrlsInBatches, loadLibrarySourcePage, mergeTracksWithSongUrls } from './songLoader';
import { neteaseAPI } from './netease';
import type { LibrarySource, NeteaseSongUrl, NeteaseTrack } from '../types';

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

const originalGetLikedSongIds = neteaseAPI.getLikedSongIds;
const originalGetPlaylistTracks = neteaseAPI.getPlaylistTracks;
const originalGetSongUrls = neteaseAPI.getSongUrls;
const originalGetSongDetail = neteaseAPI.getSongDetail;

let playlistTrackRequest: { id: number; limit: number; offset: number } | null = null;
let likedIdsRequested = false;

neteaseAPI.getLikedSongIds = async () => {
  likedIdsRequested = true;
  return { ids: Array.from({ length: 5000 }, (_, index) => index + 1) };
};
neteaseAPI.getPlaylistTracks = async (id, limit, offset) => {
  playlistTrackRequest = { id, limit, offset };
  return {
    songs: [
      { id: 101, name: 'Paged One', ar: [{ id: 1, name: 'Artist 1' }], al: { id: 1, name: 'Album 1' }, dt: 180000 },
      { id: 102, name: 'Paged Two', ar: [{ id: 2, name: 'Artist 2' }], al: { id: 2, name: 'Album 2' }, dt: 180000 },
    ],
    total: 5000,
  };
};
neteaseAPI.getSongUrls = async (ids) => ({
  data: ids.map((id) => ({ id, url: `https://music.example/${id}.mp3`, time: 180000 })),
});
neteaseAPI.getSongDetail = async () => ({ songs: [] });

const largeLikedSource: LibrarySource = {
  id: 'liked',
  kind: 'liked',
  name: 'Liked Songs',
  playlistId: 42,
  trackCount: 5000,
};

const likedPage = await loadLibrarySourcePage(largeLikedSource, 'user-1', 160, 80);

assert.equal(likedIdsRequested, false);
assert.deepEqual(playlistTrackRequest, { id: 42, limit: 80, offset: 160 });
assert.deepEqual(likedPage.songs.map((song) => song.id), [101, 102]);
assert.equal(likedPage.rawCount, 5000);
assert.equal(likedPage.hasMore, true);
assert.equal(likedPage.nextOffset, 240);

neteaseAPI.getLikedSongIds = originalGetLikedSongIds;
neteaseAPI.getPlaylistTracks = originalGetPlaylistTracks;
neteaseAPI.getSongUrls = originalGetSongUrls;
neteaseAPI.getSongDetail = originalGetSongDetail;
