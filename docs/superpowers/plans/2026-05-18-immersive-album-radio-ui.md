# Immersive Album Radio UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Kunadio's playback screen feel visually full, album-driven, and easier to read while preserving existing playback, playlist, and TTS behavior.

**Architecture:** Keep the existing React component structure and Tailwind utility style. Add an album-art ambient background in `Dashboard`, enlarge the central playback stage, polish component sizing in `AlbumCover` and `PlayerControls`, and improve playlist drawer readability without changing store semantics.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, lucide-react.

---

## File Structure

- Modify `src/components/Dashboard/Dashboard.tsx`: add album-art background layer, restructure main playback stage, enlarge text/progress controls, fix corrupted Chinese labels.
- Modify `src/components/Dashboard/AlbumCover.tsx`: support larger responsive cover sizing and fix fallback symbol.
- Modify `src/components/Dashboard/SpectrumVisualizer.tsx`: adjust height/opacity so the visualizer supports the larger stage.
- Modify `src/components/Player/PlayerControls.tsx`: enlarge controls, fix corrupted labels, keep existing store calls.
- Modify `src/components/Player/PlaylistPanel.tsx`: improve drawer size, typography, active-song highlighting, and fix corrupted Chinese labels in touched UI.
- Modify `src/index.css`: add reusable range-slider and ambient background helper styles if needed.

## Task 1: Dashboard Ambient Stage

**Files:**
- Modify: `src/components/Dashboard/Dashboard.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add ambient album background in `Dashboard.tsx`**

Use `player.currentSong?.cover` to render a full-screen absolutely positioned background before the top bar:

```tsx
const coverUrl = player.currentSong?.cover;
```

Inside the root `<div>`, before the top bar, add:

```tsx
<div className="absolute inset-0 overflow-hidden">
  {coverUrl ? (
    <img
      src={coverUrl}
      alt=""
      className="h-full w-full scale-110 object-cover opacity-45 blur-3xl"
      aria-hidden="true"
    />
  ) : (
    <div className="h-full w-full bg-[radial-gradient(circle_at_50%_25%,rgba(196,149,106,0.24),transparent_34%),linear-gradient(135deg,#171720_0%,#0b0b10_52%,#1b1512_100%)]" />
  )}
  <div className="absolute inset-0 bg-bg-primary/55" />
  <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/45 via-bg-primary/20 to-bg-primary/75" />
</div>
```

- [ ] **Step 2: Make the dashboard content sit above the ambient layer**

Change the root class from:

```tsx
className="relative w-full h-full flex flex-col items-center justify-center p-8"
```

to:

```tsx
className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-7 text-text-primary sm:px-8"
```

Ensure the top bar, main content, Kuna avatar, playlist panel, and keyboard hint all have `z-10` or higher where needed.

- [ ] **Step 3: Enlarge and rebalance main stage**

Replace the main content wrapper:

```tsx
<div className="flex flex-col items-center gap-8 max-w-2xl w-full">
```

with:

```tsx
<main className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-7 rounded-lg border border-white/10 bg-bg-primary/30 px-6 py-7 shadow-2xl shadow-black/35 backdrop-blur-md sm:px-10">
```

Close it with `</main>` instead of `</div>`.

- [ ] **Step 4: Enlarge song text**

Change song info classes to:

```tsx
<div className="w-full max-w-3xl text-center">
  <h2 className="truncate text-3xl font-semibold text-glow glow-text sm:text-5xl">
    {player.currentSong?.name || 'Kunadio'}
  </h2>
  <p className="mt-3 truncate text-base text-text-secondary sm:text-xl">
    {player.currentSong?.artists?.map((a) => a.name).join(', ') || '等待播放...'}
  </p>
</div>
```

- [ ] **Step 5: Enlarge progress bar**

Change the progress container to:

```tsx
<div className="w-full max-w-2xl space-y-3">
  <div className="relative h-8">
```

Change the visual track height from `h-1` to `h-2`, and the thumb from `h-3 w-3` to `h-5 w-5`.

Update the range input class to:

```tsx
className="absolute inset-0 h-8 w-full cursor-pointer opacity-0 disabled:cursor-default"
```

Change the time row to:

```tsx
<div className="flex justify-between font-mono text-sm text-text-secondary">
```

- [ ] **Step 6: Fix corrupted Chinese labels in `Dashboard.tsx`**

Use these exact replacements:

```tsx
title="返回入口"
aria-label="返回入口"
<span>返回</span>
<span>播放列表</span>
aria-label="调整播放进度"
等待播放...
双击空格唤醒 Kuna
```

- [ ] **Step 7: Run syntax check**

Run:

```bash
npm run lint
```

Expected: no TypeScript/ESLint errors from `Dashboard.tsx`.

## Task 2: Album Cover and Visualizer Scale

**Files:**
- Modify: `src/components/Dashboard/AlbumCover.tsx`
- Modify: `src/components/Dashboard/SpectrumVisualizer.tsx`

- [ ] **Step 1: Enlarge album cover**

In `AlbumCover.tsx`, change the cover frame class from:

```tsx
className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border border-border"
```

to:

```tsx
className="relative h-72 w-72 overflow-hidden rounded-lg border border-white/15 shadow-2xl shadow-black/40 sm:h-80 sm:w-80"
```

- [ ] **Step 2: Strengthen cover glow without using decorative blobs**

Change the glow ring class from:

```tsx
className="absolute inset-0 rounded-full bg-caramel/20 blur-2xl scale-110"
```

to:

```tsx
className="absolute inset-4 rounded-lg bg-caramel/20 blur-2xl"
```

- [ ] **Step 3: Fix fallback cover symbol**

Replace the corrupted fallback text with:

```tsx
<div className="text-7xl font-light text-caramel/40">♪</div>
```

- [ ] **Step 4: Adjust visualizer scale**

In `SpectrumVisualizer.tsx`, change:

```tsx
className="w-full h-24 opacity-80"
style={{ width: '100%', height: '96px' }}
```

to:

```tsx
className="h-28 w-full max-w-3xl opacity-85"
style={{ width: '100%', height: '112px' }}
```

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint
```

Expected: no lint errors from dashboard visual components.

## Task 3: Playback Controls Readability

**Files:**
- Modify: `src/components/Player/PlayerControls.tsx`

- [ ] **Step 1: Fix playback mode labels**

Set `modeLabel` to:

```tsx
const modeLabel = player.playbackMode === 'shuffle'
  ? '随机播放'
  : player.playbackMode === 'repeat-one'
    ? '单曲循环'
    : '顺序播放';
```

- [ ] **Step 2: Enlarge control button row**

Change the outer wrapper from:

```tsx
<div className="flex items-center gap-6">
```

to:

```tsx
<div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7">
```

- [ ] **Step 3: Enlarge secondary controls**

Change secondary button classes from:

```tsx
className="p-3 rounded-full text-text-secondary hover:text-glow hover:bg-caramel/10 transition-all duration-300"
```

to:

```tsx
className="rounded-full p-4 text-text-secondary transition-all duration-300 hover:bg-caramel/15 hover:text-glow"
```

Use icon size `24` for mode and `28` for skip buttons.

- [ ] **Step 4: Enlarge main play button**

Change main play button class to:

```tsx
className="rounded-full border border-caramel/40 bg-caramel/25 p-5 text-glow shadow-xl shadow-caramel/20 transition-all duration-300 hover:scale-105 hover:bg-caramel/35"
```

Use icon size `34` for play and pause.

- [ ] **Step 5: Make volume control easier to drag**

Change the volume wrapper from:

```tsx
<div className="flex items-center gap-2 ml-4">
```

to:

```tsx
<div className="ml-2 flex items-center gap-3 rounded-lg border border-white/10 bg-bg-primary/35 px-3 py-2 backdrop-blur-sm">
```

Change slider width from `w-28` to `w-36`, track height from `h-1` to `h-2`, thumb from `h-3 w-3` to `h-5 w-5`, and input height from `h-5` to `h-8`.

- [ ] **Step 6: Fix corrupted labels**

Use these exact labels:

```tsx
aria-label="上一首"
aria-label="下一首"
aria-label={player.isPlaying ? '暂停' : '播放'}
title={player.volume === 0 ? '恢复音量' : '静音'}
aria-label={player.volume === 0 ? '恢复音量' : '静音'}
aria-label="调整音量"
```

- [ ] **Step 7: Run lint**

Run:

```bash
npm run lint
```

Expected: no syntax errors in `PlayerControls.tsx`.

## Task 4: Playlist Drawer Readability

**Files:**
- Modify: `src/components/Player/PlaylistPanel.tsx`

- [ ] **Step 1: Enlarge drawer width and placement**

Change aside class from:

```tsx
className={`absolute top-20 right-6 bottom-24 z-30 w-96 max-w-[calc(100vw-3rem)] transition-all duration-300 ${
```

to:

```tsx
className={`absolute right-5 top-20 bottom-20 z-30 w-[28rem] max-w-[calc(100vw-2.5rem)] transition-all duration-300 ${
```

- [ ] **Step 2: Increase header readability**

Change header title from `text-base` to `text-lg`, and header meta from `text-xs` to `text-sm`.

Use these exact strings:

```tsx
{isBrowsing ? '浏览歌单' : '播放列表'}
{isBrowsing ? `${library.browseSongs.length} 首已载入` : `${player.playlist.length} 首歌曲`}
```

- [ ] **Step 3: Fix source section labels**

Use these exact strings:

```tsx
音乐库
网易云账号
正在加载...
```

- [ ] **Step 4: Improve active song row**

Change current row class branch to:

```tsx
? 'border-caramel/70 bg-caramel/30 text-glow shadow-lg shadow-caramel/15'
```

Change non-current hover branch to:

```tsx
: 'border-transparent text-text-primary hover:border-white/10 hover:bg-white/8'
```

Change row padding from `py-2.5` to `py-3`.

- [ ] **Step 5: Increase song row text size**

Change song title from:

```tsx
<p className="truncate text-base">{song.name}</p>
```

to:

```tsx
<p className="truncate text-[17px] leading-6">{song.name}</p>
```

Change artist text from `text-xs` to `text-sm`.

- [ ] **Step 6: Fix all corrupted playlist labels**

Use these exact replacements:

```tsx
下一首
稍后播放
移除
播放列表为空
正在加载...
加载更多
暂停
播放
```

For `getSourceMeta`, use:

```tsx
if (source.kind === 'daily') return count ? `${count} 首推荐` : '每日更新';
if (source.kind === 'liked') return count ? `${count} 首喜欢` : '个人收藏';
if (source.kind === 'created') return count ? `${count} 首歌曲` : '创建的歌单';
if (source.kind === 'collected') return count ? `${count} 首歌曲` : '收藏的歌单';
return count ? `${count} 首歌曲` : '推荐歌曲';
```

For `formatArtists`, return:

```tsx
return song.artists.map((artist) => artist.name).join(', ') || '未知歌手';
```

- [ ] **Step 7: Run lint**

Run:

```bash
npm run lint
```

Expected: no syntax errors from `PlaylistPanel.tsx`.

## Task 5: Final Verification

**Files:**
- No new source files.

- [ ] **Step 1: Run full lint**

Run:

```bash
npm run lint
```

Expected: exits with code 0.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript compiles and Vite build completes.

- [ ] **Step 3: Start or confirm local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves the frontend at `http://127.0.0.1:5173` or another printed available port.

- [ ] **Step 4: Manual UI checks**

Open the frontend and verify:

- The screen is filled by album-art ambience when a song with cover art plays.
- Fallback background is richer than flat black when no cover is present.
- Song title, artist, progress, controls, and volume are easier to read.
- Playlist drawer text is larger and the current song is clearly highlighted.
- Browsing playlists does not change the current song until a song row is clicked.
- Return button, playlist toggle, progress dragging, and volume dragging still work.
