import assert from 'node:assert/strict';
import { parseVolumeInput, useStore } from './useStore';
import type { Song } from '../types';

const song = (id: number, name: string): Song & { url: string } => ({
  id,
  name,
  artists: [{ id, name: `Artist ${id}` }],
  album: { id, name: `Album ${id}` },
  duration: 180000,
  url: `http://example.test/${id}.mp3`,
});

useStore.getState().returnToEntry();

const playingSong = song(1, 'Playing');
const browsedSongs = [song(2, 'Browse A'), song(3, 'Browse B')];

useStore.getState().setPlaylist([playingSong]);
useStore.getState().setCurrentSong(playingSong);
useStore.getState().setPlaying(true);

useStore.getState().setBrowseSongs('playlist-2', browsedSongs, false);

assert.equal(useStore.getState().player.currentSong?.id, 1);
assert.deepEqual(useStore.getState().player.playlist.map((item) => item.id), [1]);
assert.deepEqual(useStore.getState().library.browseSongs.map((item) => item.id), [2, 3]);

useStore.getState().playBrowseSongAt(1);

assert.equal(useStore.getState().player.currentSong?.id, 3);
assert.deepEqual(useStore.getState().player.playlist.map((item) => item.id), [2, 3]);
assert.equal(useStore.getState().player.currentIndex, 1);

useStore.getState().setBrowseSongs('playlist-large', [song(20, 'Page A'), song(21, 'Page B')], true, 80);
assert.equal(useStore.getState().library.browseHasMore, true);
assert.equal(useStore.getState().library.browseNextOffset, 80);

useStore.getState().appendBrowseSongs([song(21, 'Page B Duplicate'), song(22, 'Page C')], true, 160);
assert.deepEqual(useStore.getState().library.browseSongs.map((item) => item.id), [20, 21, 22]);
assert.equal(useStore.getState().library.browseHasMore, true);
assert.equal(useStore.getState().library.browseNextOffset, 160);

useStore.getState().setKunaChatOpen(true);
assert.equal(useStore.getState().kuna.isChatOpen, true);
useStore.getState().setKunaChatOpen(false);
assert.equal(useStore.getState().kuna.isChatOpen, false);

useStore.getState().setVolume(140);
assert.equal(useStore.getState().player.volume, 100);
useStore.getState().setVolume(-20);
assert.equal(useStore.getState().player.volume, 0);
useStore.getState().setVolume(58);
assert.equal(useStore.getState().player.volume, 58);

useStore.getState().setKunaVoiceVolume(120);
assert.equal(useStore.getState().kuna.voiceVolume, 100);
useStore.getState().setKunaVoiceVolume(-10);
assert.equal(useStore.getState().kuna.voiceVolume, 0);
useStore.getState().setKunaVoiceVolume(64);
assert.equal(useStore.getState().kuna.voiceVolume, 64);

assert.equal(parseVolumeInput('150'), 100);
assert.equal(parseVolumeInput('-1'), 0);
assert.equal(parseVolumeInput('42'), 42);

useStore.getState().setShowLyrics(true);
assert.equal(useStore.getState().ui.showLyrics, true);
useStore.getState().setLyrics([
  { time: 1, text: '第一句' },
  { time: 3.5, text: '第二句' },
]);
assert.deepEqual(useStore.getState().ui.lyrics.map((line) => line.text), ['第一句', '第二句']);
useStore.getState().setLyricsLoading(true);
assert.equal(useStore.getState().ui.lyricsLoading, true);
useStore.getState().setLyricsError('没有歌词');
assert.equal(useStore.getState().ui.lyricsError, '没有歌词');

const queueSongs = [song(10, 'One'), song(11, 'Two'), song(12, 'Three')];
useStore.getState().setPlaylist(queueSongs);
useStore.getState().playSongAt(0);
useStore.getState().setPlaybackMode('repeat-one');
useStore.getState().nextSong();
assert.equal(useStore.getState().player.currentSong?.id, 10);

useStore.getState().setPlaybackMode('sequential');
useStore.getState().addToPlayNext(song(99, 'Later'));
useStore.getState().nextSong();
assert.equal(useStore.getState().player.currentSong?.id, 99);
assert.deepEqual(useStore.getState().player.playNextQueue.map((item) => item.id), []);

useStore.getState().setPlaybackMode('shuffle');
useStore.getState().nextSong();
assert.notEqual(useStore.getState().player.currentIndex, -1);
