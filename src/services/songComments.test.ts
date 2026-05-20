import assert from 'node:assert/strict';
import { KUNA_TOOLS } from './gpt';
import { filterSongComments, formatSongCommentsForKuna, shouldTriggerLoginCommentReadout } from './songComments';
import type { SongComment } from '../types';

const commentsTool = KUNA_TOOLS.find((tool) => tool.function.name === 'readSongComments');

assert.ok(commentsTool, 'readSongComments tool should be exposed to GPT');
assert.equal(commentsTool?.function.parameters.required?.includes('songId'), true);
assert.match(commentsTool?.function.description || '', /comments/i);

const comments: SongComment[] = [
  { id: 1, content: '太短', likedCount: 100 },
  { id: 2, content: '这首歌像一个人走到半路，突然不想回家了。', likedCount: 50 },
  { id: 3, content: '加微信领取福利广告广告广告广告广告广告广告广告', likedCount: 999 },
  { id: 4, content: '这是一个比较长但仍然适合Kuna读出来的评论，它没有攻击性，也不会泄露隐私。', likedCount: 20 },
  { id: 5, content: '这首歌像一个人走到半路，突然不想回家了。', likedCount: 5 },
];

assert.deepEqual(filterSongComments(comments).map((comment) => comment.id), [2, 4]);

const formatted = formatSongCommentsForKuna({
  songId: 123,
  comments: filterSongComments(comments),
});

assert.match(formatted, /Song ID: 123/);
assert.match(formatted, /评论原句/);
assert.match(formatted, /这首歌像一个人走到半路/);
assert.match(formatted, /不要评论这条评论/);
assert.ok(formatted.length < 700);

assert.equal(shouldTriggerLoginCommentReadout({
  isLoggedIn: true,
  hasTriggeredLoginComment: false,
  isPlaying: true,
  currentTime: 9,
  songId: 123,
}), true);

assert.equal(shouldTriggerLoginCommentReadout({
  isLoggedIn: true,
  hasTriggeredLoginComment: false,
  isPlaying: false,
  currentTime: 9,
  songId: 123,
}), false);

assert.equal(shouldTriggerLoginCommentReadout({
  isLoggedIn: true,
  hasTriggeredLoginComment: false,
  isPlaying: true,
  currentTime: 3,
  songId: 123,
}), false);
