import assert from 'node:assert/strict';
import { ttsManager } from './ttsManager';

type Listener = () => void;

const createdAudio: MockAudio[] = [];

class MockAudio {
  src: string;
  volume = 1;
  paused = true;
  ended = false;
  currentTime = 0;
  private listeners = new Map<string, Listener>();

  constructor(src: string) {
    this.src = src;
    createdAudio.push(this);
  }

  addEventListener(event: string, listener: Listener): void {
    this.listeners.set(event, listener);
  }

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  finish(event = 'ended'): void {
    this.ended = event === 'ended';
    this.paused = true;
    this.listeners.get(event)?.();
  }
}

globalThis.Audio = MockAudio as unknown as typeof Audio;

let endedCount = 0;
const first = ttsManager.playSequence(['one.mp3', 'two.mp3'], 0.4);
ttsManager.setOnEnded(() => {
  endedCount += 1;
});

assert.equal(first?.src, 'one.mp3');
assert.equal(createdAudio[0].volume, 0.4);
assert.equal(createdAudio.length, 1);

createdAudio[0].finish();

assert.equal(createdAudio.length, 2);
assert.equal(createdAudio[1].src, 'two.mp3');
assert.equal(endedCount, 0);

createdAudio[1].finish();

assert.equal(endedCount, 1);
