# Kunadio

Kunadio is a local AI music companion built with Vite, React, TypeScript, Zustand, and an Express proxy server. It plays NetEase Cloud Music playlists, supports QR login and guest/user-id modes, and lets Kuna speak through Fish Audio TTS.

## Local Development

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Start the backend:

```bash
npm run server
```

Start the frontend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://localhost:3001/api/health`

## Scripts

```bash
npm test
npm run lint
npm run build
npm start
```

`npm test` runs the focused TypeScript behavior tests for store logic, library source mapping, NetEase session parsing, Kuna mode behavior, and song insight formatting.

## Server Configuration

The backend reads environment variables from `server/.env`.

Common keys:

- `GPT_API_KEY` or `KIMI_API_KEY`
- `GPT_API_URL`
- `GPT_MODEL`
- `FISH_AUDIO_KEY`
- `FISH_AUDIO_REFERENCE_ID`
- `HTTP_PROXY` / `HTTPS_PROXY` if NetEase, GPT, or Fish Audio need a local proxy

## Notes

- The app intentionally uses Fish Audio for TTS and does not fall back to Web Speech.
- Kuna opens as a right-side chat panel, not a fullscreen overlay.
- NetEase QR login state is held in the local backend process.
- Public deployment needs a Node host, not static-only hosting. See `DEPLOYMENT.md`.
