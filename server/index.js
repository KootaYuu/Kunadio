const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const ncm = require('NeteaseCloudMusicApi');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { withTimeout } = require('./musicSearchUtils');
const { createRequestQueue } = require('./neteaseRateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultAllowedOriginHosts = [
  'kunadio.netlify.app',
  'kunadio-1.onrender.com',
  'kunadio.onrender.com',
];
let neteaseCookie = '';
const neteaseQueue = createRequestQueue({
  minIntervalMs: Number(process.env.NETEASE_MIN_INTERVAL_MS || 350),
});
const callNetease = (operation) => neteaseQueue.schedule(operation);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return defaultAllowedOriginHosts.includes(hostname) ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ Netease Cloud Music API ============
const endpointMap = {
  'login/cellphone': 'login_cellphone',
  'login': 'login',
  'login/status': 'login_status',
  'login/refresh': 'login_refresh',
  'login/qr/key': 'login_qr_key',
  'login/qr/create': 'login_qr_create',
  'login/qr/check': 'login_qr_check',
  'user/playlist': 'user_playlist',
  'playlist/detail': 'playlist_detail',
  'playlist/track/all': 'playlist_track_all',
  'likelist': 'likelist',
  'song/url': 'song_url',
  'song/url/v1': 'song_url_v1',
  'song/detail': 'song_detail',
  'recommend/songs': 'recommend_songs',
  'search': 'search',
  'lyric': 'lyric',
  'comment/music': 'comment_music',
  'user/detail': 'user_detail',
};

app.post('/api/netease/session/logout', (req, res) => {
  neteaseCookie = '';
  res.json({ code: 200, message: 'Netease session cleared' });
});

app.get('/api/netease/session/status', (req, res) => {
  res.json({ code: 200, loggedIn: Boolean(neteaseCookie) });
});

app.use('/api/netease', async (req, res) => {
  try {
    const endpoint = req.path.slice(1);
    const moduleName = endpointMap[endpoint] || endpoint.replace(/\//g, '_');
    const moduleFunc = ncm[moduleName];
    
    if (!moduleFunc) {
      console.error(`Netease API not found: ${moduleName} (endpoint: ${endpoint})`);
      return res.status(404).json({ code: 404, message: `API not found: ${endpoint}` });
    }

    const data = req.method === 'GET' ? { ...req.query } : { ...req.body, ...req.query };
    if (neteaseCookie && !data.cookie) {
      data.cookie = neteaseCookie;
    }
    const result = await callNetease(() => moduleFunc(data, req));
    const body = result.body || result;

    if (endpoint === 'login/qr/check' && body.cookie) {
      neteaseCookie = body.cookie;
    }

    res.json(body);
  } catch (error) {
    console.error('Netease API error:', error.message);
    res.status(500).json({ code: 500, message: error.message });
  }
});

const songInsightCache = new Map();
const musicSearchCache = new Map();
const songCommentsCache = new Map();

const trimText = (text = '', maxLength = 260) =>
  text
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const extractReleaseYear = (publishTime) => {
  if (!publishTime) return undefined;
  const date = new Date(Number(publishTime));
  const year = date.getFullYear();
  return Number.isFinite(year) && year > 1900 ? year : undefined;
};

const inferMoodTags = (text = '') => {
  const tags = [];
  const rules = [
    ['温柔', /温柔|轻|慢|风|夜|月|海|想你|陪/i],
    ['怀旧', /从前|回忆|旧|那年|曾经|再见|离开/i],
    ['孤独', /孤独|一个人|寂寞|沉默|空|冷/i],
    ['明亮', /太阳|晴|笑|光|春|自由|奔跑/i],
    ['伤感', /眼泪|哭|痛|遗憾|失去|难过/i],
  ];

  for (const [tag, pattern] of rules) {
    if (pattern.test(text)) tags.push(tag);
  }

  return tags.slice(0, 3);
};

const sanitizeSearchText = (text = '', maxLength = 260) =>
  String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const buildMusicSearchQuery = ({ query, artist, song }) =>
  [query, artist, song, 'music']
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(' ');

const searchWikipedia = async (query) => {
  const { data } = await axios.get('https://en.wikipedia.org/w/rest.php/v1/search/page', {
    params: { q: query, limit: 5 },
    headers: {
      'User-Agent': 'Kunadio/1.0 (music search; contact: no-reply@kunadio.local)',
    },
    proxy: false,
    httpsAgent,
    timeout: 10000,
  });

  return (data.pages || []).map((page) => ({
    title: sanitizeSearchText(page.title, 120),
    snippet: sanitizeSearchText(page.excerpt || page.description || '', 320),
    url: page.key ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}` : undefined,
    source: 'wikipedia',
  }));
};

const searchNeteaseMusic = async (query) => {
  const result = await callNetease(() => ncm.search({ keywords: query, limit: 5, type: 1 }));
  const songs = result.body?.result?.songs || [];

  return songs.map((song) => {
    const artists = (song.artists || song.ar || [])
      .map((artist) => artist.name)
      .filter(Boolean)
      .join(', ');
    const album = song.album?.name || song.al?.name || '';
    return {
      title: sanitizeSearchText(song.name, 120),
      snippet: sanitizeSearchText([artists && `Artist: ${artists}`, album && `Album: ${album}`].filter(Boolean).join('. '), 260),
      url: song.id ? `https://music.163.com/#/song?id=${song.id}` : undefined,
      source: 'netease',
    };
  });
};

const searchPublicMusicInfo = async ({ query, artist, song }) => {
  const searchQuery = buildMusicSearchQuery({ query, artist, song });
  if (!searchQuery) {
    return {
      query: '',
      summary: 'No search query was provided.',
      results: [],
    };
  }

  const cacheKey = searchQuery.toLowerCase();
  if (musicSearchCache.has(cacheKey)) {
    return musicSearchCache.get(cacheKey);
  }

  const [wikiResult, neteaseResult] = await Promise.allSettled([
    withTimeout(searchWikipedia(searchQuery), 8000, 'Wikipedia search'),
    withTimeout(searchNeteaseMusic(searchQuery), 8000, 'Netease search'),
  ]);

  const results = [
    ...(wikiResult.status === 'fulfilled' ? wikiResult.value : []),
    ...(neteaseResult.status === 'fulfilled' ? neteaseResult.value : []),
  ].filter((result) => result.title || result.snippet).slice(0, 8);

  const failedSources = [
    wikiResult.status === 'rejected' ? 'Wikipedia' : '',
    neteaseResult.status === 'rejected' ? 'Netease' : '',
  ].filter(Boolean);

  const response = {
    query: searchQuery,
    summary: results.length > 0
      ? `Found ${results.length} public music result${results.length === 1 ? '' : 's'} for "${searchQuery}".`
      : `No useful public results found for "${searchQuery}"${failedSources.length ? `; failed sources: ${failedSources.join(', ')}` : ''}.`,
    results,
  };

  musicSearchCache.set(cacheKey, response);
  return response;
};

const sanitizeCommentText = (text = '', maxLength = 140) =>
  String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const getSongComments = async (id) => {
  if (songCommentsCache.has(id)) {
    return songCommentsCache.get(id);
  }

  const result = await callNetease(() => ncm.comment_music({ id, limit: 30 }));
  const body = result.body || result;
  const rawComments = [
    ...(body.hotComments || []),
    ...(body.comments || []),
  ];

  const comments = rawComments
    .map((comment) => ({
      id: comment.commentId || comment.commentIdStr || comment.time || `${id}-${comment.content}`,
      content: sanitizeCommentText(comment.content || ''),
      likedCount: comment.likedCount || 0,
      nickname: sanitizeSearchText(comment.user?.nickname || '', 40),
    }))
    .filter((comment) => comment.content);

  const response = {
    songId: id,
    comments,
    source: 'netease',
  };

  songCommentsCache.set(id, response);
  return response;
};

// ============ Song insight aggregation ============
app.get('/api/song-insight/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid song id' });
    }

    if (songInsightCache.has(id)) {
      return res.json(songInsightCache.get(id));
    }

    const [detailResult, lyricResult] = await Promise.allSettled([
      callNetease(() => ncm.song_detail({ ids: String(id) })),
      callNetease(() => ncm.lyric({ id })),
    ]);

    const song = detailResult.status === 'fulfilled'
      ? detailResult.value.body?.songs?.[0]
      : null;
    const lyric = lyricResult.status === 'fulfilled'
      ? lyricResult.value.body?.lrc?.lyric || ''
      : '';
    const translatedLyric = lyricResult.status === 'fulfilled'
      ? lyricResult.value.body?.tlyric?.lyric || ''
      : '';
    const primaryArtistId = song?.ar?.[0]?.id;
    const artistResult = primaryArtistId
      ? await Promise.allSettled([callNetease(() => ncm.artist_desc({ id: primaryArtistId }))])
      : [];
    const artistBody = artistResult[0]?.status === 'fulfilled'
      ? artistResult[0].value.body
      : null;
    const artistBrief = trimText(
      artistBody?.briefDesc || artistBody?.introduction?.[0]?.txt || '',
      90
    );
    const lyricExcerpt = trimText(lyric, 220);
    const translatedLyricExcerpt = trimText(translatedLyric, 180);

    const insight = {
      id,
      name: song?.name || '',
      artists: song?.ar?.map((artist) => artist.name).filter(Boolean) || [],
      album: song?.al?.name || '',
      aliases: song?.alia || [],
      duration: song?.dt || 0,
      lyricExcerpt,
      translatedLyricExcerpt,
      artistBrief,
      releaseYear: extractReleaseYear(song?.publishTime),
      moodTags: inferMoodTags(`${song?.name || ''} ${song?.al?.name || ''} ${lyricExcerpt} ${translatedLyricExcerpt}`),
      source: 'netease',
    };

    songInsightCache.set(id, insight);
    res.json(insight);
  } catch (error) {
    console.error('Song insight error:', error.message);
    res.status(500).json({
      error: 'Song insight failed',
      details: error.message,
    });
  }
});

// ============ Public music search for Kuna tools ============
app.post('/api/music-search', async (req, res) => {
  try {
    const result = await searchPublicMusicInfo(req.body || {});
    res.json(result);
  } catch (error) {
    console.error('Music search error:', error.message);
    res.status(500).json({
      error: 'Music search failed',
      details: error.message,
    });
  }
});

app.get('/api/song-comments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid song id' });
    }

    const result = await getSongComments(id);
    res.json(result);
  } catch (error) {
    console.error('Song comments error:', error.message);
    res.status(500).json({
      error: 'Song comments failed',
      details: error.message,
    });
  }
});

// ============ GPT API Proxy ============
app.post('/api/gpt/chat', async (req, res) => {
  try {
    const { messages, tools, tool_choice } = req.body;
    const apiKey = process.env.GPT_API_KEY || process.env.KIMI_API_KEY;
    const apiUrl = process.env.GPT_API_URL || process.env.KIMI_API_URL || 'https://api.openai.com';
    
    if (!apiKey) {
      return res.status(500).json({ error: 'KIMI_API_KEY not configured. Please check your .env file.' });
    }

    const requestBody = {
      model: process.env.GPT_MODEL || process.env.KIMI_MODEL || 'gpt-5.5',
      messages,
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      (requestBody).tools = tools;
      (requestBody).tool_choice = tool_choice || 'auto';
    }

    const response = await axios.post(
      `${apiUrl}/v1/chat/completions`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        proxy: false,
        httpsAgent,
        timeout: 30000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('GPT API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'GPT API request failed',
      details: error.response?.data || error.message 
    });
  }
});

// ============ Fish Audio TTS Proxy ============
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text, reference_id, format = 'mp3' } = req.body;
    const apiKey = process.env.FISH_AUDIO_KEY;
    const defaultReferenceId = process.env.FISH_AUDIO_REFERENCE_ID;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'FISH_AUDIO_KEY not configured. Please check your .env file.' });
    }

    const response = await axios.post(
      'https://api.fish.audio/v1/tts',
      {
        text,
        reference_id: reference_id || defaultReferenceId || undefined,
        format,
        normalize: true,
        latency: 'normal',
        mp3_bitrate: 128,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'model': 's2-pro',
        },
        proxy: false,
        httpsAgent,
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );

    res.set('Content-Type', `audio/${format}`);
    res.send(Buffer.from(response.data));
  } catch (error) {
    const errorDetails = Buffer.isBuffer(error.response?.data)
      ? error.response.data.toString('utf8')
      : error.response?.data || error.message || error.code || 'Unknown TTS error';
    console.error('Fish Audio TTS error:', errorDetails);
    res.status(500).json({ 
      error: 'TTS synthesis failed',
      details: errorDetails,
    });
  }
});

// ============ Audio stream proxy ============
app.get('/api/audio/proxy', async (req, res) => {
  try {
    const audioUrl = req.query.url;

    if (!audioUrl || typeof audioUrl !== 'string') {
      return res.status(400).json({ error: 'Missing audio url' });
    }

    const parsedUrl = new URL(audioUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Unsupported audio url protocol' });
    }

    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://music.163.com/',
    };

    if (req.headers.range) {
      requestHeaders.Range = req.headers.range;
    }

    const response = await axios.get(audioUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: requestHeaders,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.status(response.status);
    if (response.headers['content-length']) {
      res.set('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.set('Content-Range', response.headers['content-range']);
    }
    if (response.headers['accept-ranges']) {
      res.set('Accept-Ranges', response.headers['accept-ranges']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('Audio proxy error:', error.response?.data || error.message);
    res.status(502).json({
      error: 'Audio proxy failed',
      details: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gptConfigured: !!(process.env.GPT_API_KEY || process.env.KIMI_API_KEY),
    fishAudioConfigured: !!process.env.FISH_AUDIO_KEY,
  });
});

const clientDistPath = path.join(__dirname, '..', 'dist');
app.use(express.static(clientDistPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎵 Kunadio server running on port ${PORT}`);
  console.log(`📡 Netease API proxy: http://localhost:${PORT}/api/netease`);
  console.log(`🤖 Chat API proxy: http://localhost:${PORT}/api/gpt/chat`);
  console.log(`🔊 Fish Audio TTS proxy: http://localhost:${PORT}/api/tts/synthesize`);
  console.log(`🎧 Audio proxy: http://localhost:${PORT}/api/audio/proxy`);
  console.log('');
  console.log('API Key status:');
  console.log(`  GPT API: ${process.env.GPT_API_KEY || process.env.KIMI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Fish Audio: ${process.env.FISH_AUDIO_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Proxy: ${proxyUrl ? proxyUrl : 'Not configured'}`);
});
