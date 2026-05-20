import type { LibraryBrowsePage, LibrarySource, NeteaseSongUrl, NeteaseTrack, Song } from '../types';
import { neteaseAPI, proxyAudioUrl } from './netease';

const URL_BATCH_SIZE = 40;

export async function buildPlayableSongs(tracks: NeteaseTrack[]): Promise<Array<Song & { url: string }>> {
  if (tracks.length === 0) return [];
  const urls = await fetchSongUrlsInBatches(
    tracks.map((track) => track.id),
    URL_BATCH_SIZE,
    async (songIds) => {
      const urlResult = await neteaseAPI.getSongUrls(songIds);
      return urlResult.data || [];
    },
  );

  return mergeTracksWithSongUrls(tracks, urls);
}

export async function fetchSongUrlsInBatches(
  ids: number[],
  batchSize: number,
  fetcher: (ids: number[]) => Promise<NeteaseSongUrl[]>,
): Promise<NeteaseSongUrl[]> {
  const urls: NeteaseSongUrl[] = [];

  for (let index = 0; index < ids.length; index += batchSize) {
    const songIds = ids.slice(index, index + batchSize);
    try {
      urls.push(...await fetcher(songIds));
    } catch (error) {
      console.warn('Failed to load song URLs for batch:', songIds, error);
    }
  }

  return urls;
}

export function mergeTracksWithSongUrls(
  tracks: NeteaseTrack[],
  urls: NeteaseSongUrl[],
): Array<Song & { url: string }> {
  const urlById = new Map(urls.map((url) => [url.id, url]));

  return tracks
    .map((track): Song => {
      const urlData = urlById.get(track.id);
      const trackDuration = track.dt || track.duration || 0;
      const isTrial =
        Boolean(urlData?.freeTrialInfo) ||
        Boolean(urlData?.freeTrialPrivilege?.resConsumable) ||
        Boolean(urlData?.freeTrialPrivilege?.userConsumable) ||
        Boolean(urlData?.time && trackDuration && urlData.time < trackDuration * 0.75);

      return {
        id: track.id,
        name: track.name,
        artists: track.ar || track.artists || [],
        album: track.al || track.album || { id: 0, name: '' },
        duration: trackDuration,
        cover: track.al?.picUrl || track.album?.picUrl || '',
        url: urlData?.url && !isTrial ? proxyAudioUrl(urlData.url) : '',
      };
    })
    .filter((song): song is Song & { url: string } => Boolean(song.url));
}

export async function loadLibrarySourcePage(
  source: LibrarySource,
  uid: string,
  offset = 0,
  limit = 80,
): Promise<LibraryBrowsePage> {
  if (source.kind === 'daily') {
    const recommendResult = await neteaseAPI.getDailyRecommend();
    const tracks: NeteaseTrack[] = recommendResult.data?.dailySongs || recommendResult.recommend || [];
    const slice = tracks.slice(offset, offset + limit);
    return {
      songs: await buildPlayableSongs(slice),
      rawCount: tracks.length,
      hasMore: offset + limit < tracks.length,
      nextOffset: offset + limit,
    };
  }

  if (source.kind === 'liked') {
    const likedResult = await neteaseAPI.getLikedSongIds(uid);
    const ids: number[] = likedResult.ids || [];
    if (ids.length > 0) {
      const rawIds = ids.slice(offset, offset + limit);
      const detailResult = await neteaseAPI.getSongDetail(rawIds);
      const tracks: NeteaseTrack[] = detailResult.songs || [];
      return {
        songs: await buildPlayableSongs(tracks),
        rawCount: ids.length,
        hasMore: offset + limit < ids.length,
        nextOffset: offset + limit,
      };
    }

    if (!source.playlistId) return emptyPage(offset);
  }

  if (!source.playlistId) return emptyPage(offset);

  const tracksResult = await neteaseAPI.getPlaylistTracks(source.playlistId, limit, offset);
  const tracks: NeteaseTrack[] = tracksResult.songs || [];
  const rawCount = tracksResult.total || source.trackCount || offset + tracks.length;
  return {
    songs: await buildPlayableSongs(tracks),
    rawCount,
    hasMore: offset + limit < rawCount,
    nextOffset: offset + limit,
  };
}

export async function loadSongsForLibrarySource(
  source: LibrarySource,
  uid: string,
): Promise<Array<Song & { url: string }>> {
  return (await loadLibrarySourcePage(source, uid, 0, 120)).songs;
}

function emptyPage(offset: number): LibraryBrowsePage {
  return {
    songs: [],
    rawCount: 0,
    hasMore: false,
    nextOffset: offset,
  };
}
