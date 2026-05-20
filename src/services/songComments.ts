import axios from 'axios';
import { API_BASE } from './apiConfig';
import type { SongComment, SongCommentsResponse } from '../types';

const MIN_COMMENT_CHARS = 12;
const MAX_COMMENT_CHARS = 70;
const COMMENT_SPAM_PATTERN = /广告|福利|加微信|vx|qq|代刷|群|http|www\.|关注|私信/i;

export function filterSongComments(comments: SongComment[], maxCount = 2): SongComment[] {
  const seen = new Set<string>();
  return comments
    .filter((comment) => {
      const content = normalizeComment(comment.content);
      if (content.length < MIN_COMMENT_CHARS || content.length > MAX_COMMENT_CHARS) return false;
      if (COMMENT_SPAM_PATTERN.test(content)) return false;
      if (seen.has(content)) return false;
      seen.add(content);
      return true;
    })
    .slice(0, maxCount);
}

export function formatSongCommentsForKuna(response: SongCommentsResponse): string {
  const comments = filterSongComments(response.comments);
  if (comments.length === 0) {
    return `Song ID: ${response.songId}\nComments: No suitable public comments found. Do not pretend you read one.`;
  }

  return [
    `Song ID: ${response.songId}`,
    '这些是网易云评论区里的公开评论。Kuna 可以直接读“评论原句”，但必须明确说这是评论里的人说的，不要冒充自己的话。不要评论这条评论，不要补自己的听感，读完就把歌还给用户。',
    comments.map((comment, index) => `${index + 1}. 评论原句：“${normalizeComment(comment.content)}”`).join('\n'),
  ].join('\n');
}

export function shouldTriggerLoginCommentReadout(options: {
  isLoggedIn: boolean;
  hasTriggeredLoginComment: boolean;
  isPlaying: boolean;
  currentTime: number;
  songId?: number | null;
}): boolean {
  return Boolean(
    options.isLoggedIn &&
    !options.hasTriggeredLoginComment &&
    options.isPlaying &&
    options.songId &&
    options.currentTime >= 8,
  );
}

export const songCommentsAPI = {
  get: async (songId: number): Promise<SongCommentsResponse> => {
    const response = await axios.get(`${API_BASE}/song-comments/${songId}`);
    return response.data;
  },
};

function normalizeComment(content: string): string {
  return String(content).replace(/\s+/g, ' ').trim();
}
