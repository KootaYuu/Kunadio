export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number;
  url?: string;
  cover?: string;
}

export interface Artist {
  id: number;
  name: string;
}

export interface Album {
  id: number;
  name: string;
  picUrl?: string;
  picId?: number;
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl?: string;
  trackCount: number;
  description?: string;
}

export interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'kuna';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface NeteaseTrack {
  id: number;
  name: string;
  ar?: Artist[];
  artists?: Artist[];
  al?: Album;
  album?: Album;
  dt?: number;
  duration?: number;
}

export interface NeteaseSongUrl {
  id: number;
  url: string | null;
  time?: number;
  freeTrialInfo?: unknown;
  freeTrialPrivilege?: {
    resConsumable?: boolean;
    userConsumable?: boolean;
  };
}

export interface NeteasePlaylistSummary {
  id: number;
  name: string;
  coverImgUrl?: string;
  trackCount?: number;
  creator?: {
    userId?: number;
    nickname?: string;
  };
}

export type LibrarySourceKind = 'daily' | 'liked' | 'created' | 'collected' | 'guest';

export interface LibrarySource {
  id: string;
  kind: LibrarySourceKind;
  name: string;
  description?: string;
  playlistId?: number;
  trackCount?: number;
  coverImgUrl?: string;
  isLoaded?: boolean;
  isLoading?: boolean;
  songCount?: number;
}

export interface LibraryBrowsePage {
  songs: Array<Song & { url: string }>;
  rawCount: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface PlayerToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | {
      volume?: number;
      songId?: string;
      position?: number;
      query?: string;
      artist?: string;
      song?: string;
    };
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: PlayerToolCall[];
  tool_call_id?: string;
}

export interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: PlayerToolCall[];
    };
  }>;
}

export interface SongInsight {
  id: number;
  name: string;
  artists: string[];
  album: string;
  aliases: string[];
  duration: number;
  lyricExcerpt: string;
  translatedLyricExcerpt?: string;
  artistBrief?: string;
  releaseYear?: number;
  moodTags?: string[];
  source: string;
}

export interface MusicSearchResult {
  title: string;
  snippet: string;
  url?: string;
  source: 'wikipedia' | 'netease';
}

export interface MusicSearchResponse {
  query: string;
  summary: string;
  results: MusicSearchResult[];
}

export type VisualizerMode = 'spectrum' | 'wave' | 'circle';
export type PlaybackMode = 'sequential' | 'shuffle' | 'repeat-one';
