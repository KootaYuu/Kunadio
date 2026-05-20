import assert from 'node:assert/strict';
import { KUNA_TTS_CHUNK_MAX_CHARS, prepareKunaTTS, splitKunaTTSText, stripTTSMarkup } from './fishAudioTTS';

const markedText = '[soft smile] 又是这首啊。(break) 你最近老在放。(long-break) 嗯……(breath) 我也听听看。';

assert.equal(
  stripTTSMarkup(markedText),
  '又是这首啊。 你最近老在放。 嗯…… 我也听听看。',
);

const prepared = prepareKunaTTS(markedText);
assert.equal(prepared.includes('(break)'), false);
assert.equal(prepared.includes('(long-break)'), false);
assert.equal(prepared.includes('(breath)'), false);
assert.equal(prepared.includes('[soft smile]'), false);
assert.equal(prepared, '又是这首啊。 你最近老在放。 嗯……， 我也听听看。');

assert.equal(
  prepareKunaTTS('[warm late-night tone] 嗯……(break)你听这里。'),
  '嗯……， 你听这里。',
);

assert.equal(KUNA_TTS_CHUNK_MAX_CHARS, 140);

const longText = Array.from({ length: 12 }, (_, index) => `第${index + 1}句是一段给Kuna朗读的完整电台口播内容，不能在长文本里被Fish只读前半段。`).join('');
const chunks = splitKunaTTSText(longText);

assert.equal(chunks.length > 1, true);
assert.equal(chunks.every((chunk) => chunk.length <= KUNA_TTS_CHUNK_MAX_CHARS), true);
assert.equal(chunks.join(''), longText);
