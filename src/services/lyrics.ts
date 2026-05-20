import type { LyricLine } from '../types';

const TIME_TAG_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

export function parseLrc(raw: string): LyricLine[] {
  return raw
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(TIME_TAG_PATTERN)];
      if (matches.length === 0) return [];

      const text = line.replace(TIME_TAG_PATTERN, '').trim();
      if (!text) return [];

      return matches.map((match) => ({
        time: toSeconds(match[1], match[2], match[3]),
        text,
      }));
    })
    .sort((a, b) => a.time - b.time);
}

export function findActiveLyricIndex(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0 || currentTime < lines[0].time) return -1;

  let low = 0;
  let high = lines.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].time <= currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high;
}

export function getLyricContextForKuna(lines: LyricLine[], currentTime: number): string {
  const activeIndex = findActiveLyricIndex(lines, currentTime);
  if (activeIndex < 0) return '';

  const active = lines[activeIndex];
  const previous = lines[activeIndex - 1];
  const next = lines[activeIndex + 1];

  return [
    `当前歌词：${active.text}`,
    previous ? `上一句：${previous.text}` : '',
    next ? `下一句：${next.text}` : '',
  ].filter(Boolean).join('；');
}

export function getLyricWindow(lines: LyricLine[], activeIndex: number): [
  LyricLine | null,
  LyricLine | null,
  LyricLine | null,
] {
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  return [
    lines[currentIndex - 1] || null,
    lines[currentIndex] || null,
    lines[currentIndex + 1] || null,
  ];
}

function toSeconds(minutes: string, seconds: string, fraction = '0'): number {
  const normalizedFraction = fraction.padEnd(3, '0').slice(0, 3);
  return Number(minutes) * 60 + Number(seconds) + Number(normalizedFraction) / 1000;
}
