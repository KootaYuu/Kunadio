import type { SongInsight } from '../types';

export function formatSongInsightForKuna(insight: SongInsight | null): string {
  if (!insight) return '';

  return [
    insight.name ? `歌名：《${insight.name}》` : '',
    insight.artists.length ? `歌手：${insight.artists.join('、')}` : '',
    insight.album ? `专辑：《${insight.album}》` : '',
    insight.releaseYear ? `发行年份：${insight.releaseYear}` : '',
    insight.aliases.length ? `别名：${insight.aliases.join('、')}` : '',
    insight.moodTags?.length ? `情绪线索：${insight.moodTags.join('、')}` : '',
    insight.artistBrief ? `歌手资料：${insight.artistBrief}` : '',
    insight.lyricExcerpt ? `歌词片段：${insight.lyricExcerpt}` : '',
    insight.translatedLyricExcerpt ? `歌词翻译：${insight.translatedLyricExcerpt}` : '',
  ]
    .filter(Boolean)
    .join('；')
    .slice(0, 260);
}
