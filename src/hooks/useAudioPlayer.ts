import { useRef, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { useKunaAnnouncements } from './useKunaAnnouncements';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const { player, kuna, setPlaying, setCurrentTime, setDuration, setSeekHandler, nextSong, setFrequencyData } = useStore();
  const currentSongUrl = player.currentSong?.url;
  const isPlaying = player.isPlaying;
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Initialize Web Audio API
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const gain = audioContext.createGain();
    gain.gain.value = 0.7;
    gainRef.current = gain;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(audioContext.destination);
    sourceRef.current = source;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      nextSong();
      setPlaying(true);
    };
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      cancelAnimationFrame(rafRef.current);
      audio.pause();
      audioContext.close();
      setSeekHandler(null);
    };
  }, [setCurrentTime, setDuration, nextSong, setPlaying, setSeekHandler]);

  useEffect(() => {
    setSeekHandler((time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setCurrentTime(time);
    });

    return () => setSeekHandler(null);
  }, [setCurrentTime, setSeekHandler]);

  // Update audio source when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (shouldLoadAudioSource(audio.getAttribute('src'), currentSongUrl)) {
      audio.src = currentSongUrl;
      audio.load();
      if (isPlayingRef.current) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSongUrl]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle volume changes + Kuna speaking ducking
  useEffect(() => {
    const audio = audioRef.current;
    const audioContext = audioContextRef.current;
    const gain = gainRef.current;
    if (!audio || !audioContext || !gain) return;

    const baseVolume = player.volume / 100;
    const targetVolume = kuna.isSpeaking ? baseVolume * 0.15 : baseVolume;
    const duration = kuna.isSpeaking ? 220 : 0;
    const now = audioContext.currentTime;

    audio.volume = 1;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    if (duration > 0) {
      gain.gain.linearRampToValueAtTime(targetVolume, now + duration / 1000);
    } else {
      gain.gain.setValueAtTime(targetVolume, now);
    }
  }, [player.volume, kuna.isSpeaking]);

  // Analyser data loop
  useEffect(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateFrequencyData = () => {
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        setFrequencyData(new Uint8Array(dataArray));
      } else {
        setFrequencyData(null);
      }
      rafRef.current = requestAnimationFrame(updateFrequencyData);
    };

    rafRef.current = requestAnimationFrame(updateFrequencyData);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, setFrequencyData]);

  // Kuna announcements
  useKunaAnnouncements(audioRef);

  return {
    audioRef,
    analyserRef,
  };
}

export function shouldLoadAudioSource(currentSource: string | null, nextSource: string | null | undefined): boolean {
  if (!nextSource) return false;
  return currentSource !== nextSource;
}
