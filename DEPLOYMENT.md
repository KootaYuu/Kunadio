# Kunadio Deployment

Kunadio can be deployed in two ways:

1. One Node service that serves both the frontend and `/api/*`.
2. Netlify for the frontend plus Render/Railway/Fly.io for the backend.

The recommended public setup is Netlify frontend + Render backend. Static-only hosting is not enough by itself because Kunadio needs server-side API proxies for GPT, Fish Audio, NetEase, and audio streaming.

## Recommended: Netlify Frontend + Render Backend

### 1. Deploy Backend On Render

Connect the GitHub repository to Render and use the included `render.yaml`.

Render build command:

```bash
npm run build:render
```

Render start command:

```bash
npm start
```

Render health check:

```text
/api/health
```

Set these Render environment variables:

```bash
GPT_API_KEY=your-gpt-compatible-key
GPT_API_URL=https://api.openai.com
GPT_MODEL=gpt-5.5
FISH_AUDIO_KEY=your-fish-audio-key
FISH_AUDIO_REFERENCE_ID=optional-voice-reference-id
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

If using Moonshot/Kimi instead:

```bash
KIMI_API_KEY=your-kimi-key
KIMI_API_URL=https://api.moonshot.cn
KIMI_MODEL=moonshot-v1-8k
```

After Render deploys, verify:

```text
https://your-render-service.onrender.com/api/health
```

Expected: `gptConfigured` and `fishAudioConfigured` are `true`.

### 2. Deploy Frontend On Netlify

Connect the same GitHub repository to Netlify. The included `netlify.toml` sets:

```bash
npm run build:netlify
```

Publish directory:

```text
dist
```

Set this Netlify environment variable:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

After Netlify deploys, update Render:

```bash
CORS_ORIGIN=https://your-final-netlify-domain.netlify.app
```

Redeploy Render after changing `CORS_ORIGIN`.

## Alternative: Single Node Service

```bash
npm install
npm run build
npm start
```

The server listens on `PORT` or `3001`, provides `/api/*`, and serves the built Vite frontend from `dist/`.

## Environment Variables

Common backend variables:

```bash
GPT_API_KEY=your-gpt-compatible-key
GPT_API_URL=https://api.openai.com
FISH_AUDIO_KEY=your-fish-audio-key
FISH_AUDIO_REFERENCE_ID=optional-voice-reference-id
```

If using Moonshot/Kimi instead:

```bash
KIMI_API_KEY=your-kimi-key
KIMI_API_URL=https://api.moonshot.cn
```

Optional backend variables:

```bash
GPT_MODEL=gpt-5.5
CORS_ORIGIN=https://your-domain.example
HTTP_PROXY=
HTTPS_PROXY=
```

If the frontend and backend are deployed separately, build the frontend with:

```bash
VITE_API_BASE_URL=https://your-api-domain.example/api npm run build
```

For same-domain deployment, leave `VITE_API_BASE_URL` unset.

## NetEase Login Notes

NetEase QR login state is stored in the running server process. On a public deployment, users share the same process-level NetEase session unless the server is later changed to store per-user sessions. For a small private deployment this is acceptable; for public multi-user usage, implement per-browser session cookies before sharing widely.

Music availability still depends on NetEase permissions, account membership, and regional restrictions.

## Health Check

After deployment, open:

```text
https://your-domain.example/api/health
```

Expected response:

```json
{
  "status": "ok",
  "gptConfigured": true,
  "fishAudioConfigured": true
}
```
