import assert from 'node:assert/strict';
import { KUNA_SYSTEM_PROMPT } from './gpt';

assert.match(KUNA_SYSTEM_PROMPT, /普通回应：2 到 5 句/);
assert.match(KUNA_SYSTEM_PROMPT, /介绍歌曲或回答音乐问题：4 到 8 句/);
assert.match(KUNA_SYSTEM_PROMPT, /先接住当前音乐或用户的问题/);
assert.match(KUNA_SYSTEM_PROMPT, /把注意力带回正在播放的歌/);
assert.match(KUNA_SYSTEM_PROMPT, /readSongComments/);
assert.match(KUNA_SYSTEM_PROMPT, /不要说安全的话/);
assert.match(KUNA_SYSTEM_PROMPT, /对但没用/);
assert.equal(KUNA_SYSTEM_PROMPT.includes('每次 1-3 句，最多 4 句'), false);
