import { useEffect, useRef, useState } from 'react';
import { Send, Volume2, X } from 'lucide-react';
import { parseVolumeInput, useStore } from '../../stores/useStore';
import { gptAPI, KUNA_TOOLS } from '../../services/gpt';
import { prepareKunaTTS, stripTTSMarkup, ttsAPI } from '../../services/fishAudioTTS';
import { ttsManager } from '../../services/ttsManager';
import { summarizeForVoice } from '../../services/kunaVoice';
import { buildKunaChatMessages } from '../../services/kunaPromptContext';
import { getLyricContextForKuna } from '../../services/lyrics';
import { getSongInsight } from '../../services/netease';
import { formatSongInsightForKuna } from '../../services/songInsightText';
import { formatMusicSearchForKuna, musicSearchAPI, parseToolArguments } from '../../services/musicSearch';
import type { PlayerToolCall } from '../../types';
import { shouldSendKunaMessageFromKey } from '../../utils/keyboard';

const TEXT = {
  speaking: '正在说话...',
  preparingVoice: '正在准备声音...',
  companion: '音乐陪伴中',
  close: '关闭 Kuna',
  voiceVolume: 'Kuna voice volume',
  emptyTitle: '你好，我是 Kuna。',
  emptyBody: '我会在右侧陪你听歌。想聊音乐、换歌、调音量，直接告诉我。',
  preparingToSpeak: '准备说话...',
  thinking: '思考中...',
  inputPlaceholder: '和 Kuna 说点什么...',
  send: '发送',
  ttsError: '语音合成暂时失败了，我先用文字回复你。',
  chatError: '抱歉，我好像有点卡住了。能再说一遍吗？',
  emptyPlaylist: '播放列表为空，请先加载歌曲。',
  actionDone: '操作完成。',
};

export default function KunaChatPanel() {
  const {
    kuna,
    setKunaChatOpen,
    addMessage,
    setKunaSpeaking,
    player,
    setCurrentSong,
    setVolume,
    nextSong,
    previousSong,
    setPlaying,
    setKunaVoiceVolume,
  } = useStore();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparingVoice, setIsPreparingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kuna.messages, isPreparingVoice]);

  useEffect(() => {
    if (!kuna.isChatOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [kuna.isChatOpen]);

  useEffect(() => {
    ttsManager.setVolume(kuna.voiceVolume / 100);
  }, [kuna.voiceVolume]);

  const playTTS = async (text: string) => {
    try {
      ttsManager.stop();
      setIsPreparingVoice(true);

      const cleanText = stripTTSMarkup(text);
      const voiceText = summarizeForVoice(cleanText);
      const audioUrl = await ttsAPI.synthesize(prepareKunaTTS(voiceText));

      setIsPreparingVoice(false);
      setKunaSpeaking(true);
      ttsManager.play(audioUrl, useStore.getState().kuna.voiceVolume / 100);
      ttsManager.setOnEnded(() => {
        setKunaSpeaking(false);
      });
    } catch (error) {
      console.error('TTS error:', error);
      setIsPreparingVoice(false);
      setKunaSpeaking(false);
      addMessage({
        id: `tts_error_${Date.now()}`,
        role: 'kuna',
        content: TEXT.ttsError,
        timestamp: Date.now(),
      });
    }
  };

  const executeToolCall = async (toolCall: PlayerToolCall) => {
    const { name } = toolCall.function;
    const args = parseToolArguments(toolCall.function.arguments);

    switch (name) {
      case 'searchMusicInfo': {
        const query = args.query || [args.song, args.artist, 'music'].filter(Boolean).join(' ');
        if (!query.trim()) return 'Search failed: missing query.';
        const result = await musicSearchAPI.search(query, args.artist, args.song);
        return formatMusicSearchForKuna(result);
      }
      case 'play':
        if (player.currentSong) {
          setPlaying(true);
          return `已开始播放《${player.currentSong.name}》。`;
        }
        if (player.playlist.length > 0) {
          setCurrentSong(player.playlist[0]);
          setPlaying(true);
          return `开始播放《${player.playlist[0].name}》。`;
        }
        return TEXT.emptyPlaylist;
      case 'pause':
        setPlaying(false);
        return '已暂停。';
      case 'next':
        nextSong();
        return '已切换到下一首。';
      case 'previous':
        previousSong();
        return '已切换到上一首。';
      case 'setVolume':
        setVolume(args.volume ?? player.volume);
        return `音量已调至 ${args.volume}%`;
      default:
        return TEXT.actionDone;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    setIsLoading(true);

    try {
      const songInsight = player.currentSong ? await getSongInsight(player.currentSong.id) : null;
      const songInsightText = formatSongInsightForKuna(songInsight);
      const lyricContext = getLyricContextForKuna(useStore.getState().ui.lyrics, player.currentTime);
      const messages = buildKunaChatMessages({
        player,
        lyricContext,
        songInsightText,
        history: kuna.messages,
        userMessage,
      });

      const response = await gptAPI.chat(messages, KUNA_TOOLS, 'auto');
      const choice = response.choices[0];

      let reply = choice.message.content;
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          const result = await executeToolCall(toolCall);
          messages.push({
            role: 'assistant',
            content: choice.message.content || '',
            tool_calls: [toolCall],
          });
          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
          });
        }

        const finalResponse = await gptAPI.chat(messages, KUNA_TOOLS, 'auto');
        reply = finalResponse.choices[0].message.content;
      }

      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'kuna',
        content: stripTTSMarkup(reply),
        timestamp: Date.now(),
      });

      await playTTS(reply);
    } catch (error) {
      console.error('Kuna chat error:', error);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'kuna',
        content: TEXT.chatError,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (shouldSendKunaMessageFromKey(event)) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <aside className="fixed inset-x-3 bottom-[11.25rem] top-auto z-40 h-[min(70dvh,38rem)] sm:bottom-6 sm:left-auto sm:right-6 sm:top-6 sm:h-auto sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="glass-panel flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-white/10 bg-bg-primary/22 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 overflow-hidden rounded-full border ${kuna.isSpeaking ? 'border-amber' : 'border-caramel/50'}`}>
              <img src="/kuna-avatar.png" alt="Kuna" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-glow">Kuna</h2>
              <p className="text-sm text-text-muted">
                {kuna.isSpeaking ? TEXT.speaking : isPreparingVoice ? TEXT.preparingVoice : TEXT.companion}
              </p>
            </div>
          </div>
          <button
            onClick={() => setKunaChatOpen(false)}
            className="rounded-md p-2 text-text-muted transition-colors hover:bg-white/8 hover:text-glow"
            aria-label={TEXT.close}
          >
            <X size={18} />
          </button>
        </header>

        <div className="border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-bg-primary/35 px-3 py-2.5">
            <Volume2 size={16} className="shrink-0 text-caramel" />
            <input
              type="range"
              min={0}
              max={100}
              value={kuna.voiceVolume}
              onInput={(event) => setKunaVoiceVolume(parseVolumeInput(event.currentTarget.value))}
              className="h-2 min-w-0 flex-1 cursor-pointer accent-caramel"
              aria-label={TEXT.voiceVolume}
            />
            <span className="w-10 text-right font-mono text-xs text-text-secondary">{kuna.voiceVolume}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {kuna.messages.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-bg-primary/35 px-4 py-3 text-sm text-text-secondary">
              <p>{TEXT.emptyTitle}</p>
              <p className="mt-1">{TEXT.emptyBody}</p>
            </div>
          )}

          {kuna.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[84%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-caramel/22 text-glow'
                    : 'rounded-bl-md border border-white/10 bg-bg-panel/92 text-text-primary'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {(isLoading || isPreparingVoice) && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-white/10 bg-bg-panel px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-caramel" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-text-muted">{isPreparingVoice ? TEXT.preparingToSpeak : TEXT.thinking}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 bg-bg-primary/18 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-bg-primary/55 px-4 py-3.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={TEXT.inputPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="rounded-full bg-caramel/24 p-2.5 text-caramel transition-all hover:bg-caramel/34 disabled:opacity-30"
              aria-label={TEXT.send}
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
