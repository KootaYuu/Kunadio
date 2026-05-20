import assert from 'node:assert/strict';
import {
  getKunaModeProfile,
  shouldAutoAnnounce,
  summarizeForVoice,
} from './kunaModes';

const quiet = getKunaModeProfile('quiet');
assert.equal(quiet.maxAutoSpeakPer15Min, 1);
assert.equal(quiet.maxAutoChars, 18);
assert.equal(quiet.allowSongStory, false);

const companion = getKunaModeProfile('companion');
assert.ok(companion.maxAutoSpeakPer15Min >= 8);
assert.ok(companion.minSecondsBetweenAutoSpeak <= 45);
assert.ok(companion.maxDialogVoiceChars >= 180);
assert.equal(companion.allowSongStory, true);
assert.equal(companion.promptHint.includes('更主动'), true);

assert.equal(
  shouldAutoAnnounce({
    persona: 'radio',
    event: 'song_story',
    recentAutoSpeakCount: 1,
    msSinceLastSpeak: 90_000,
  }),
  true,
);

assert.equal(
  shouldAutoAnnounce({
    persona: 'quiet',
    event: 'song_story',
    recentAutoSpeakCount: 0,
    msSinceLastSpeak: 600_000,
  }),
  false,
);

assert.equal(
  summarizeForVoice('第一句很适合说出来。第二句可以显示在文字里。第三句也留给文字区。', 18),
  '第一句很适合说出来。',
);

assert.equal(
  summarizeForVoice('这一段话没有明显停顿但是音乐伙伴模式应该尽量保留更多可以朗读的内容', 24),
  '这一段话没有明显停顿但是音乐伙伴模式应该尽...',
);
