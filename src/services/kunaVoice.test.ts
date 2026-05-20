import assert from 'node:assert/strict';
import { KUNA_AUTO_ANNOUNCE, KUNA_DIALOG_VOICE_MAX_CHARS, shouldAutoAnnounce, summarizeForVoice } from './kunaVoice';

assert.equal(KUNA_AUTO_ANNOUNCE.maxSpeakPer15Min, 4);
assert.equal(KUNA_AUTO_ANNOUNCE.minSecondsBetweenSpeak, 75);

assert.equal(
  shouldAutoAnnounce({
    recentAutoSpeakCount: 1,
    msSinceLastSpeak: 90_000,
  }),
  true,
);

assert.equal(KUNA_DIALOG_VOICE_MAX_CHARS, 720);

const longDjReply = Array.from({ length: 12 }, (_, index) => `Kuna sentence ${index + 1} with enough room to sound complete.`).join(' ');
assert.equal(summarizeForVoice(longDjReply, KUNA_DIALOG_VOICE_MAX_CHARS), longDjReply);

assert.equal(
  shouldAutoAnnounce({
    recentAutoSpeakCount: 4,
    msSinceLastSpeak: 600_000,
  }),
  false,
);

assert.equal(
  summarizeForVoice('第一句很适合说出来。第二句可以显示在文字里。第三句也留给文字区。', 18),
  '第一句很适合说出来。',
);

assert.equal(
  summarizeForVoice('这一段话没有明显停顿但是语音回复应该尽量保留更多可以朗读的内容', 24),
  '这一段话没有明显停顿但是语音回复应该尽量保...',
);
