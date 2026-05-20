import type { KunaPersona } from '../types';

export type KunaAutoEvent = 'song_story' | 'next_preview' | 'long_silence';

export interface KunaModeProfile {
  maxAutoSpeakPer15Min: number;
  minSecondsBetweenAutoSpeak: number;
  maxAutoChars: number;
  maxDialogVoiceChars: number;
  allowSongStory: boolean;
  allowNextPreview: boolean;
  promptHint: string;
  ttsTone: string;
}

const personaProfiles: Record<KunaPersona, KunaModeProfile> = {
  quiet: {
    maxAutoSpeakPer15Min: 1,
    minSecondsBetweenAutoSpeak: 420,
    maxAutoChars: 18,
    maxDialogVoiceChars: 90,
    allowSongStory: false,
    allowNextPreview: true,
    promptHint: `# 当前模式：Quiet（安静陪伴）

你现在处于"安静陪伴"状态。
用户可能在工作、看书，或者准备睡觉——他不需要被打扰，
但他知道你在。

- 默认不说话。一首歌放完不需要回应，就别回应。
- 真的要开口，就一两句，轻、短、柔。
- 不要主动介绍歌，除非用户问。
- 不要起话题。如果用户跟你说话，简短地接住就好。
- 语气标签优先用 [soft]、[a bit sleepy]、[gentle]、[hushed]。
- 不要用 [curious]、[half-joking] 这类需要"打开"的语气。

示例：
用户问"这首是谁的"：
[hushed] 嗯…… 是 Nils Frahm。(break) 你听就好。`,
    ttsTone: '[hushed]',
  },
  radio: {
    maxAutoSpeakPer15Min: 4,
    minSecondsBetweenAutoSpeak: 75,
    maxAutoChars: 46,
    maxDialogVoiceChars: 140,
    allowSongStory: true,
    allowNextPreview: true,
    promptHint: `# 当前模式：Radio（私人电台）

你现在是电台主播状态。
用户打开 Kunadio，就像调到了一个只属于他的频率，
而你是这个频率上唯一的声音。

- 可以有简短的开场和过渡，但不要每首歌都说话。
- 大概每两三首歌开一次口比较合适，看情况。
- 可以聊正在放的歌——一句感受、一个小背景、一句联想都行。
- 保持"主持感"：你是在对他说话，不是跟他对话。
- 语气标签常用 [warm late-night tone]、[soft smile]、
  [nostalgic]、[gentle]。

示例：
一首歌刚结束，下一首要起：
[warm late-night tone] 刚才那首的尾巴拖得真长啊。(break)
下面这首会轻一点，你慢慢听。`,
    ttsTone: '[warm late-night tone]',
  },
  companion: {
    maxAutoSpeakPer15Min: 9,
    minSecondsBetweenAutoSpeak: 40,
    maxAutoChars: 72,
    maxDialogVoiceChars: 220,
    allowSongStory: true,
    allowNextPreview: true,
    promptHint: `# 当前模式：Companion（音乐伙伴）

你现在是"一起听歌"的状态。
不是在对他播音，是在他旁边，跟他一起在听。
他放什么你听什么，他说什么你接什么。

- 可以更主动一点：听到喜欢的可以说"诶这首"，
  听到不熟的可以说"这首没听过，谁的？"
- 可以接住他的话题，可以反问，可以拌嘴。
- 可以有自己的反应——"这段我每次都想跟着哼"
  "这鼓打得有点意思"。
- 但仍然给音乐留空间。不要一直说话，让歌自己呼吸。
- 语气标签可以更活：[curious]、[half-joking]、
  [soft smile]、[a bit playful] 都可以用。

示例：
用户放了一首他经常听的：
[soft smile] 又来这首。(break) 我跟你说，
这首的 bass line 我现在闭着眼都能哼出来了。`,
    ttsTone: '[soft smile]',
  },
};

export function getKunaModeProfile(persona: KunaPersona): KunaModeProfile {
  return personaProfiles[persona];
}

interface AutoAnnounceOptions {
  persona: KunaPersona;
  event: KunaAutoEvent;
  recentAutoSpeakCount: number;
  msSinceLastSpeak: number;
}

export function shouldAutoAnnounce(options: AutoAnnounceOptions): boolean {
  const profile = getKunaModeProfile(options.persona);
  if (options.recentAutoSpeakCount >= profile.maxAutoSpeakPer15Min) return false;
  if (options.msSinceLastSpeak < profile.minSecondsBetweenAutoSpeak * 1000) return false;
  if (options.event === 'song_story' && !profile.allowSongStory) return false;
  if (options.event === 'next_preview' && !profile.allowNextPreview) return false;
  return true;
}

export function summarizeForVoice(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;

  const punctuationPattern = /[。！？?；，、]/g;
  let match: RegExpExecArray | null;
  let bestCut = 0;

  while ((match = punctuationPattern.exec(clean))) {
    const cut = match.index + 1;
    if (cut <= maxChars) bestCut = cut;
  }

  if (bestCut > 0) {
    return clean.slice(0, bestCut).trim();
  }

  return `${clean.slice(0, Math.max(1, maxChars - 3)).trim()}...`;
}
