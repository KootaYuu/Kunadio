import axios from 'axios';
import type { NeteaseTrack, Song, SongInsight } from '../types';
import { API_BASE, NETEASE_API_BASE } from './apiConfig';

const neteaseRequest = async (endpoint: string, params: Record<string, unknown> = {}) => {
  const response = await axios.get(`${NETEASE_API_BASE}/${endpoint}`, { params });
  return response.data;
};

export const neteaseAPI = {
  // Login
  login: (phone: string, password: string) =>
    neteaseRequest('login/cellphone', { phone, password }),

  getQrKey: () =>
    neteaseRequest('login/qr/key', { timestamp: Date.now() }),

  createQr: (key: string) =>
    neteaseRequest('login/qr/create', { key, qrimg: true, timestamp: Date.now() }),

  checkQr: (key: string) =>
    neteaseRequest('login/qr/check', { key, timestamp: Date.now() }),

  getLoginStatus: () =>
    neteaseRequest('login/status', { timestamp: Date.now() }),

  logoutSession: async () => {
    await axios.post(`${API_BASE}/netease/session/logout`);
  },

  // Get user playlists
  getUserPlaylists: (uid: string) =>
    neteaseRequest('user/playlist', { uid, limit: 100 }),

  // Get playlist detail
  getPlaylistDetail: (id: number) =>
    neteaseRequest('playlist/detail', { id }),

  getPlaylistTracks: (id: number, limit = 1000, offset = 0) =>
    neteaseRequest('playlist/track/all', { id, limit, offset }),

  getLikedSongIds: (uid: string) =>
    neteaseRequest('likelist', { uid }),

  // Get song URLs
  getSongUrls: (ids: number[]) =>
    neteaseRequest('song/url/v1', { id: ids.join(','), level: 'exhigh' }),

  // Get song detail
  getSongDetail: (ids: number[]) =>
    neteaseRequest('song/detail', { ids: ids.join(',') }),

  // Get daily recommendations
  getDailyRecommend: () =>
    neteaseRequest('recommend/songs', {}),

  // Search
  search: (keywords: string, limit = 20) =>
    neteaseRequest('search', { keywords, limit, type: 1 }),

  // Get lyrics
  getLyrics: (id: number) =>
    neteaseRequest('lyric', { id }),

  // Get user detail
  getUserDetail: (uid: string) =>
    neteaseRequest('user/detail', { uid }),
};

// Helper to transform Netease response to our Song type
export const transformSong = (track: NeteaseTrack): Song => ({
  id: track.id,
  name: track.name,
  artists: track.ar || track.artists || [],
  album: track.al || track.album || { id: 0, name: '' },
  duration: track.dt || track.duration || 0,
  cover: track.al?.picUrl || track.album?.picUrl || '',
});

export const proxyAudioUrl = (url: string): string =>
  `${API_BASE}/audio/proxy?url=${encodeURIComponent(url)}`;

const songInsightCache = new Map<number, SongInsight>();

export const getSongInsight = async (id: number): Promise<SongInsight | null> => {
  if (songInsightCache.has(id)) {
    return songInsightCache.get(id)!;
  }

  try {
    const response = await axios.get(`${API_BASE}/song-insight/${id}`);
    songInsightCache.set(id, response.data);
    return response.data;
  } catch (error) {
    console.warn('Failed to load song insight:', error);
    return null;
  }
};
