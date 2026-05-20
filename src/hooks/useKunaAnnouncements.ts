import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { gptAPI, KUNA_SYSTEM_PROMPT } from '../services/gpt';
import { prepareKunaTTS, splitKunaTTSText, stripTTSMarkup, ttsAPI } from '../services/fishAudioTTS';
import { ttsManager } from '../services/ttsManager';
import { getSongInsight } from '../services/netease';
import { KUNA_AUTO_ANNOUNCE, shouldAutoAnnounce, shouldStartAutoAnnouncement } from '../services/kunaVoice';
import { formatSongInsightForKuna } from '../services/songInsightText';
import { formatSongCommentsForKuna, shouldTriggerLoginCommentReadout, songCommentsAPI } from '../services/songComments';

type AnnouncementType = 'song_story' | 'next_preview' | 'comment_readout';

export function useKunaAnnouncements(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const { player, kuna, setKunaSpeaking, addMessage, setLastSpeakTime } = useStore();
  const announcedSongs = useRef<Set<string | number>>(new Set());
  const lastAnnouncementTime = useRef(0);
  const autoSpeakTimes = useRef<number[]>([]);
  const loginCommentReadoutDone = useRef(false);
  const kunaRef = useRef(kuna);

  useEffect(() => {
    kunaRef.current = kuna;
  }, [kuna]);

  const announce = useCallback(async (type: AnnouncementType) => {
    const latestKuna = kunaRef.current;
    if (!shouldStartAutoAnnouncement({
      kunaIsSpeaking: latestKuna.isSpeaking,
      ttsIsPlaying: ttsManager.isPlaying(),
    })) return;

    const song = player.currentSong;
    if (!song) return;

    const now = Date.now();
    autoSpeakTimes.current = autoSpeakTimes.current.filter((time) => now - time < 15 * 60 * 1000);

    const bypassCadence = type === 'comment_readout';
    if (!bypassCadence && !shouldAutoAnnounce({
      recentAutoSpeakCount: autoSpeakTimes.current.length,
      msSinceLastSpeak: now - lastAnnouncementTime.current,
    })) {
      return;
    }

    lastAnnouncementTime.current = now;
    autoSpeakTimes.current.push(now);

    try {
      const artistNames = song.artists.map((artist) => artist.name).filter(Boolean).join(', ') || '未知歌手';
      const albumName = song.album?.name || '未知专辑';
      const prompt = type === 'comment_readout'
        ? await buildCommentReadoutPrompt(song.id)
        : type === 'song_story'
          ? [
            `当前播放：《${song.name}》，歌手：${artistNames}，专辑：《${albumName}》。`,
            await buildSongInsightPrompt(song.id),
            `只说 1 到 2 句，不超过 ${KUNA_AUTO_ANNOUNCE.maxAutoChars} 个中文字符。优先使用资料卡里的真实信息；资料不足时只聊听感。不要说“没有信息”，不要编造事实。`,
          ].filter(Boolean).join('\n')
          : buildNextPreviewPrompt(player.currentIndex, player.playlist);

      if (!prompt) return;

      const response = await gptAPI.chat([
        { role: 'system', content: KUNA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
      const content = response.choices[0].message.content;
      const displayContent = stripTTSMarkup(content);

      addMessage({
        id: `announce_${Date.now()}`,
        role: 'kuna',
        content: displayContent,
        timestamp: Date.now(),
      });

      const ttsChunks = splitKunaTTSText(prepareKunaTTS(content));
      const audioUrls = await Promise.all(ttsChunks.map((chunk) => ttsAPI.synthesize(chunk)));
      setKunaSpeaking(true);
      ttsManager.playSequence(audioUrls, latestKuna.voiceVolume / 100);
      ttsManager.setOnEnded(() => {
        setKunaSpeaking(false);
      });

      setLastSpeakTime(Date.now());
    } catch (error) {
      console.error('Announcement error:', error);
      setKunaSpeaking(false);
      setLastSpeakTime(Date.now());
    }
  }, [addMessage, player.currentIndex, player.currentSong, player.playlist, setKunaSpeaking, setLastSpeakTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 1;
      const progress = currentTime / duration;
      const songId = player.currentSong?.id;

      if (!songId || !player.isPlaying) return;
      if (kunaRef.current.isSpeaking) return;

      if (shouldTriggerLoginCommentReadout({
        isLoggedIn: useStore.getState().user.isLoggedIn,
        hasTriggeredLoginComment: loginCommentReadoutDone.current,
        isPlaying: player.isPlaying,
        currentTime,
        songId,
      })) {
        loginCommentReadoutDone.current = true;
        announcedSongs.current.add(`${songId}_comment_readout`);
        void announce('comment_readout');
        return;
      }

      if (progress > 0.22 && progress < 0.28) {
        const key = `${songId}_story`;
        if (!announcedSongs.current.has(key)) {
          announcedSongs.current.add(key);
          void announce('song_story');
        }
      }

      if (progress > 0.68 && progress < 0.74) {
        const key = `${songId}_preview`;
        if (!announcedSongs.current.has(key)) {
          announcedSongs.current.add(key);
          void announce('next_preview');
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [announce, audioRef, player.currentSong, player.isPlaying]);

  useEffect(() => {
    if (player.playlist.length > 0 && player.currentIndex === 0) {
      announcedSongs.current.clear();
    }
  }, [player.playlist, player.currentIndex]);
}

async function buildSongInsightPrompt(songId: number): Promise<string> {
  const insight = await getSongInsight(songId);
  const insightText = formatSongInsightForKuna(insight);
  return insightText ? `当前歌曲资料卡：${insightText}` : '';
}

async function buildCommentReadoutPrompt(songId: number): Promise<string> {
  const comments = await songCommentsAPI.get(songId);
  const commentText = formatSongCommentsForKuna(comments);
  if (/No suitable public comments found/.test(commentText)) return '';
  return [
    commentText,
    '做一段私人电台口播：先说“评论里有人说”或类似表达，然后直接读一条评论原句。不要评论这条评论，不要补自己的听感。读完停住，把注意力交还给当前歌曲。不要说你无法读取评论。',
  ].join('\n');
}

function buildNextPreviewPrompt(
  currentIndex: number,
  playlist: Array<{ name: string; artists: Array<{ name: string }> }>,
): string {
  const nextIndex = (currentIndex + 1) % playlist.length;
  const nextSong = playlist[nextIndex];
  if (!nextSong) {
    return `这首歌快要结束了。只说 1 句自然收尾，不超过 ${KUNA_AUTO_ANNOUNCE.maxNextPreviewChars} 个中文字符。`;
  }

  const nextArtists = nextSong.artists.map((artist) => artist.name).filter(Boolean).join(', ') || '未知歌手';
  return [
    `下一首是《${nextSong.name}》，歌手是 ${nextArtists}。`,
    `只说 1 句自然预告，不超过 ${KUNA_AUTO_ANNOUNCE.maxNextPreviewChars} 个中文字符。不要说“没有信息”。`,
  ].join('\n');
}
