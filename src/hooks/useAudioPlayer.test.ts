import assert from 'node:assert/strict';
import { shouldLoadAudioSource } from './useAudioPlayer';

assert.equal(shouldLoadAudioSource(null, '/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F1.mp3'), true);
assert.equal(shouldLoadAudioSource('/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F1.mp3', null), false);
assert.equal(
  shouldLoadAudioSource(
    '/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F1.mp3',
    '/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F1.mp3',
  ),
  false,
);
assert.equal(
  shouldLoadAudioSource(
    '/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F1.mp3',
    '/api/audio/proxy?url=https%3A%2F%2Fexample.test%2F2.mp3',
  ),
  true,
);
