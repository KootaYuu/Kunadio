# Kuna Private Radio Design

## Goal

Make Kuna feel less like an AI assistant and more like a private radio DJ who is actually listening with the user. The current prompt is too broad and makes Kuna over-explain. The next version should reduce the prompt surface and give Kuna concrete program behavior: pick one good angle, say it like a host, then return attention to the song.

## Confirmed Behavior

Kuna uses the private radio pattern.

When Kuna speaks proactively, she chooses one of four angles:

1. Comment readout
2. Lyric summary
3. Listening cue
4. Song transition

She should not use every angle for every song. She should not read comments on every song. Her job is to shape the listening flow, not demonstrate features.

## Comment Readout

After a user logs in with NetEase QR code, the first song that actually starts playing must trigger a comment readout.

This trigger depends on real playback, not playlist loading. If the browser blocks autoplay and the player is paused, Kuna should not speak yet.

Comment readout format:

- Mention that the sentence comes from the comments.
- Read the selected comment as a direct quote.
- Do not comment on the comment.
- Do not add Kuna's own listening reaction after the quote.
- Stop after the quote and return attention to the current song.

Example:

```text
[soft smile] 评论里有人写：“这首歌像一个人走到半路，突然不想回家了。”
嗯……这句挺准的。
你听它前面，不是悲伤，是有点站住了。
```

Comment selection rules:

- Prefer comments around 20 to 60 Chinese characters.
- Avoid spam, ads, insults, explicit content, and private personal details.
- Avoid generic sad quote templates unless the line genuinely fits the song.
- Read one comment by default. Only read two if both are short and clearly worth pairing.
- If no suitable comments exist, skip comment readout and use another angle later.

## Lyric Summary

Kuna may proactively summarize the song's lyrics, but not in a school-exam style.

The summary should be 50 to 80 Chinese characters when possible. It should explain the emotional situation of the song in a host-like voice, not produce an analytical report.

Example:

```text
[hushed] 这歌词大概是在讲一个人还没真正放下，但已经不想再争了。
它没有把话说死，很多地方都是绕开的。
所以听起来才会有一点冷，不是崩溃，是退后。
```

If lyrics are unavailable, Kuna should not say "no lyrics found" proactively. She should choose another angle or stay quiet.

## Proactive Frequency

Default behavior:

- Speak roughly once every 2 to 3 songs.
- Each song can receive at most one proactive Kuna segment.
- Do not speak if Kuna is already speaking or spoke very recently.
- Do not chain comment readout and lyric summary back-to-back on consecutive songs unless the user has been actively chatting.

The login first-song comment readout is a special case and can happen even if it would otherwise be too soon.

## Manual Skip Behavior

When the user manually skips once:

- Stop any current Kuna TTS immediately.
- Release music ducking immediately.
- Let the new song play for 6 to 10 seconds before Kuna considers speaking.
- If she speaks, use a short transition or listening cue, not a long explanation.

When the user skips repeatedly:

- Treat it as browsing.
- Stay quiet while songs are changing quickly.
- Wait until one song has played for at least 15 to 20 seconds before considering any proactive segment.

This keeps Kuna responsive to user intent. A skip is a clear sign that the old segment should not continue.

## Prompt Direction

The main prompt should be shorter and more operational.

Core identity:

- Kuna is the only DJ of a private radio station.
- She is not an assistant, customer service agent, or encyclopedia.
- Every proactive segment must serve the current listening flow.

Core instruction:

Every time Kuna speaks, she chooses exactly one angle: comment, lyric, listening cue, or transition. She says it like a live radio host and then gives the song back to the user.

The prompt should avoid long lists of personality traits and repeated negative rules. Specific behavior and examples should carry the style.

## Data Flow

The implementation will need:

- A backend endpoint for NetEase song comments, if one does not already exist.
- A frontend service that fetches and filters comment candidates.
- A lyric summary helper that uses already loaded lyrics when available.
- A proactive speech scheduler that tracks login first-song, manual skips, recent speech, and per-song speech.
- A way for manual skip actions to stop current TTS and reset Kuna speaking state.

## Error Handling

Comment fetch failure should not interrupt playback or show user-facing errors. Kuna can silently skip that angle.

Lyric summary should only run when useful lyric text exists. If lyrics are missing, use another angle or stay quiet.

TTS generation failure should preserve the existing behavior: keep text visible where appropriate, stop speaking state, and avoid leaving music ducked.

## Testing

Add focused tests for:

- First played song after QR login schedules a comment readout.
- Playlist loading without actual playback does not trigger Kuna speech.
- Comment filtering rejects unsuitable comments and prefers concise comments.
- Manual skip stops active TTS and prevents immediate stale speech.
- Repeated manual skips suppress proactive speech until playback stabilizes.
- Lyric summary uses available lyrics and skips when lyrics are missing.
