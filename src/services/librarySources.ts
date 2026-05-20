import type { LibrarySource, NeteasePlaylistSummary } from '../types';

interface BuildLibrarySourcesOptions {
  userId: string;
  playlists: NeteasePlaylistSummary[];
}

export function buildLibrarySources({ userId, playlists }: BuildLibrarySourcesOptions): LibrarySource[] {
  const ownerId = Number(userId);
  const likedPlaylist = playlists.find((playlist) => playlist.name.includes('喜欢'));
  const likedPlaylistId = likedPlaylist?.id;

  const sources: LibrarySource[] = [
    {
      id: 'daily',
      kind: 'daily',
      name: '每日推荐',
      description: '网易云根据当前账号生成',
    },
  ];

  if (likedPlaylist) {
    sources.push({
      id: 'liked',
      kind: 'liked',
      name: '我喜欢的音乐',
      playlistId: likedPlaylist.id,
      trackCount: likedPlaylist.trackCount,
      coverImgUrl: likedPlaylist.coverImgUrl,
    });
  }

  playlists
    .filter((playlist) => playlist.id !== likedPlaylistId)
    .forEach((playlist) => {
      const creatorId = playlist.creator?.userId;
      sources.push({
        id: `playlist-${playlist.id}`,
        kind: Number.isFinite(ownerId) && creatorId === ownerId ? 'created' : 'collected',
        name: playlist.name,
        playlistId: playlist.id,
        trackCount: playlist.trackCount,
        coverImgUrl: playlist.coverImgUrl,
      });
    });

  return sources;
}
