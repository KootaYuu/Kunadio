import axios from 'axios';
import { API_BASE } from './apiConfig';
import type { MusicSearchResponse, PlayerToolCall } from '../types';

type ToolArguments = Exclude<PlayerToolCall['function']['arguments'], string>;

export function parseToolArguments(args: PlayerToolCall['function']['arguments']): ToolArguments {
  if (typeof args !== 'string') return args;
  try {
    const parsed = JSON.parse(args);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function formatMusicSearchForKuna(response: MusicSearchResponse): string {
  const results = response.results
    .slice(0, 5)
    .map((result, index) => {
      const url = result.url ? `\n   URL: ${result.url}` : '';
      return `${index + 1}. ${result.title}\n   Source: ${result.source}\n   ${result.snippet}${url}`;
    })
    .join('\n');

  return [
    `Search query: ${response.query}`,
    `Summary: ${response.summary}`,
    results ? `Results:\n${results}` : 'Results: No useful public results found.',
  ].join('\n');
}

export const musicSearchAPI = {
  search: async (query: string, artist?: string, song?: string): Promise<MusicSearchResponse> => {
    const response = await axios.post(`${API_BASE}/music-search`, {
      query,
      artist,
      song,
    });
    return response.data;
  },
};
