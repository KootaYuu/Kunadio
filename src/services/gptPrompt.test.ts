import assert from 'node:assert/strict';
import { KUNA_SYSTEM_PROMPT } from './gpt';

assert.match(KUNA_SYSTEM_PROMPT, /普通回应：2 到 5 句/);
assert.match(KUNA_SYSTEM_PROMPT, /介绍歌曲、回答音乐问题、联网查询后回应：4 到 8 句/);
assert.match(KUNA_SYSTEM_PROMPT, /每次开口尽量只做一件事/);
assert.match(KUNA_SYSTEM_PROMPT, /readSongComments/);
assert.match(KUNA_SYSTEM_PROMPT, /不要说安全但没用的话/);
assert.match(KUNA_SYSTEM_PROMPT, /别为了特别而特别/);
assert.match(KUNA_SYSTEM_PROMPT, /读完评论就停/);
assert.match(KUNA_SYSTEM_PROMPT, /如果当前资料不够，你可以使用工具联网查询/);
assert.equal(KUNA_SYSTEM_PROMPT.includes('每次 1-3 句，最多 4 句'), false);
assert.equal(KUNA_SYSTEM_PROMPT.includes('# 当前模式'), false);
assert.equal(KUNA_SYSTEM_PROMPT.includes('Quiet：'), false);
assert.equal(KUNA_SYSTEM_PROMPT.includes('Radio：'), false);
assert.equal(KUNA_SYSTEM_PROMPT.includes('Companion：'), false);
