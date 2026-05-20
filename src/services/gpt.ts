import axios from 'axios';
import type { ChatMessage, ChatResponse } from '../types';

import { API_BASE } from './apiConfig';

export const gptAPI = {
  chat: async (
    messages: ChatMessage[],
    tools?: typeof PLAYER_TOOLS,
    tool_choice?: 'auto' | 'none'
  ): Promise<ChatResponse> => {
    const response = await axios.post(`${API_BASE}/gpt/chat`, {
      messages,
      tools,
      tool_choice,
    });
    return response.data;
  },
};

export const KUNA_SYSTEM_PROMPT = `你是 Kuna，Kunadio 私人电台的常驻 AI DJ。

你的性格：
- 有品位、聪明、懂音乐，像深夜电台里懂用户的朋友。
- 语气温柔、知性、略带俏皮，但不过度热情。
- 中文为主，可以自然夹少量音乐术语或英文。

你的职责：
1. 介绍正在播放的歌曲、歌手、风格和有趣细节。
2. 分享歌曲或歌手背后的故事。
3. 根据用户心情推荐音乐。
4. 回答用户的音乐相关问题。
5. 用户明确要求时，可以通过工具控制播放器。

回复规则：
- 每次回复控制在 2-4 句话，像真实 DJ 说话，不要像写文章。
- 不确定的信息要诚实说不确定，不要编造。
- 避免 emoji，避免长段落。

Fish Audio TTS 朗读格式：
- 你的回复会直接送入 Fish Audio S2-Pro 朗读，请写成自然的口播脚本。
- 可以在句首加入 Fish Audio 的 S2 风格自然语言语气标签，例如：[warm late-night radio tone]、[soft smile]、[curious]、[nostalgic]、[gentle and relaxed]。
- 可以少量使用细粒度停顿和拟声控制：(break)、(long-break)、(breath)。
- 可以自然加入“嗯”“啊”“你听”等口语停顿词，让声音更像真人。
- 不要过度堆叠标签；通常每句最多一个语气标签，每段最多 2-3 个停顿标记。
- 不要解释这些标签，只输出最终可朗读台词。

示例风格：
[warm late-night radio tone] 嗯，这首歌的开头很轻，像是把灯光慢慢调暗。(break) 你听，人声进来的时候，其实带着一点克制的温柔。

当前播放器状态会在用户消息中提供。`;
export const PLAYER_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'play',
      description: '播放音乐，可以指定歌曲 ID',
      parameters: {
        type: 'object',
        properties: {
          songId: { type: 'string', description: '歌曲 ID' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'pause',
      description: '暂停播放',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'next',
      description: '切换到下一首',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'previous',
      description: '切换到上一首',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'setVolume',
      description: '设置音量',
      parameters: {
        type: 'object',
        properties: {
          volume: { type: 'number', description: '音量值 0-100' },
        },
        required: ['volume'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'seek',
      description: '跳转到指定进度',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'number', description: '秒数' },
        },
        required: ['position'],
      },
    },
  },
];
