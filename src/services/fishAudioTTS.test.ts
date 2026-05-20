import assert from 'node:assert/strict';
import { prepareKunaTTS, stripTTSMarkup } from './fishAudioTTS';

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
