# Immersive Album Radio UI Design

## Goal

Improve Kunadio's main playback UI so it feels visually full, readable, and closer to an immersive private radio experience. The current interface is too close to a pure black background with small text and sparse controls, making it hard to read and visually underfilled.

## Chosen Direction

Use the current song's album cover as the visual source for the whole screen. The design should balance atmosphere and readability:

- Album art fills the background as a large blurred ambient layer.
- A dark translucent overlay keeps text and controls readable.
- Main playback information becomes larger and easier to scan.
- Controls and progress affordances become larger and more obvious.
- Playlist browsing remains separate from playback changes.

## Scope

This phase changes only the main playback experience:

- Main dashboard layout.
- Album cover presentation.
- Song title, artist text, progress bar, and controls sizing.
- Playlist drawer readability and current-song highlighting.
- Kuna visible status/avatar placement if needed for balance.
- Existing mojibake Chinese text in touched UI files.

This phase does not change:

- NetEase login flow.
- TTS provider or ducking logic.
- Backend API behavior.
- Playlist data loading semantics.
- Kuna personality behavior.

## Main Screen Layout

The dashboard should become a full-screen album-radio stage:

- Background: current album image, enlarged and blurred, covering the viewport.
- Overlay: layered dark translucent wash, strong enough to keep text readable.
- Center stage: larger album cover, larger song title, larger artist line, thicker progress control, and larger playback buttons.
- Top bar: keep return, brand, playlist toggle, and clock, but make buttons easier to read and fix corrupted Chinese labels.
- Kuna area: keep visible but secondary, preferably near the bottom center or bottom-left depending on layout balance.
- Playlist drawer: remains a right-side drawer with improved type size, spacing, and high-contrast active song state.

If a song has no album cover, the screen should fall back to a richer dark radio background instead of flat black.

## Readability Rules

- Avoid tiny body text in the main playback surface.
- Use larger minimum sizes for frequently read labels.
- Increase touch/click target sizes for controls.
- Keep contrast high over album-art backgrounds.
- Do not rely only on color to mark the active song; use border, background, and visual emphasis.
- Keep the UI usable on desktop and smaller widths without text overlap.

## Visual Tone

The UI should feel warm, immersive, and musical, not like a marketing page. It should remain a functional app:

- Album art provides color and atmosphere.
- The caramel/warm radio accent can stay, but should no longer be the only visual energy.
- Avoid decorative gradient blobs or unrelated ornaments.
- Keep panels restrained and purposeful.

## Component Boundaries

Likely touched components:

- `src/components/Dashboard/Dashboard.tsx`
- `src/components/Dashboard/AlbumCover.tsx`
- `src/components/Dashboard/SpectrumVisualizer.tsx`
- `src/components/Player/PlayerControls.tsx`
- `src/components/Player/PlaylistPanel.tsx`
- `src/index.css`

Implementation should stay within existing React/Tailwind patterns and avoid unrelated refactors.

## Verification

After implementation:

- Run lint.
- Run production build.
- Check the local app visually at the existing frontend URL.
- Confirm the UI remains readable with and without album cover art.
- Confirm playlist browsing still does not auto-switch songs.
- Confirm playback controls and progress dragging remain functional.
