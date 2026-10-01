# Zero Data Retention — vertical 4K advert with dancing Luca

Date: 2026-09-30
Status: approved in conversation, pending written-spec review

## Goal

A phone-first 9:16 advert cut of the existing "Zero Data Retention" song for Bitdeer AI Model Studio. Luca, Bitdeer's deer mascot, dances below the lyrics with moves that fit each section and lip-syncs the vocals. The Bitdeer AI logo is prominent. Output is a 4K master for TikTok, Instagram Reels and YouTube Shorts.

Success means: the first second hooks, Luca reads as the official character, the dancing sits on the beat, the mouth follows the singing, every word on screen matches what is sung, and nothing important sits under platform UI.

## Decisions

| Topic | Decision |
|---|---|
| Soundtrack | Existing `public/audio.mp3`, unchanged. |
| Lyrics | On-screen words stay exactly as sung. Line breaks are re-flowed for the narrow frame. Ad-libs become sticker bursts. |
| Extra copy | Ad callouts in instrumental gaps plus an end-card tagline. Copy only repeats claims the song already makes. All copy lives in `src/data/callouts.json` for claims review. |
| Platforms | TikTok, Reels and Shorts. Design to the strictest combined safe zone. |
| Luca | New vector puppet, redrawn from the "Welcome" art (`画板 11.png`, `组 1.png`). No library PNGs in the video. Official PNG cameos are deferred. |
| Outfit | White Bitdeer hoodie with the green deer mark (after `贴纸4.png`). Orange legs and feet. |
| Logo | Vector lockup: existing `public/bitdeer-logo.svg` plus a rebuilt gradient "AI" pill matching `Bitdeer AI Logo-1200_300.png`. |
| Intro | No pre-roll. The first 2.4 s of the song is the intro. |
| End card | About 3 s after the song ends. Logo, "AI Model Studio" and tagline. No URL, no button. |
| Format | Designed at 1080×1920 and rendered at `--scale=2`, giving 2160×3840 at 60 fps, H.264, CRF 16. |
| Existing video | The `ZeroDataRetention` composition and its files are left untouched. |

## Layout (design pixels, 1080×1920)

- **Reserved for platform UI:**
  - Top band: y 0–220.
  - Bottom band: y 1500–1920.
  - Right button column: x 940–1080 from y 880 down.
  - Nothing essential goes in these areas.
- **Header:** the Bitdeer AI lockup, centred at about y 290 (roughly 560 × 110 px, so it clears the top band), with "AI MODEL STUDIO" in small tracked caps at about y 375. The lockup pulses on brand lines.
- **Lyric zone:** y 420–880, x 60–1020, centred text in a 3-line stack.
  - The current line is Rubik ExtraBold, auto-fit up to 96 px, and wraps to at most 2 rows.
  - The previous and next lines are about 56 px, dimmed.
  - The current word fills amber (`#FFC66A`) and pops by 1.06 as it is sung.
  - "ZERO" always uses the green brand gradient.
  - Callouts reuse this zone during instrumentals.
- **Luca zone:** y 880–1560, horizontally within x 180–860. His face stays at or above y 1450.
- **Stage floor:** about y 1560, decorative. Platform captions may cover it.

## Visual style

- **Background:** dark "night stage" base (`#050606` to deep navy) with slow glows in the brand gradients: teal→green `#36D0AC→#60F770`, orange→gold `#F76B1C→#FBD16A`.
- **Stage elements:** spotlight cone on Luca, a floor ring that pulses on every beat, and floating token-coin particles.
- **Chorus energy:**
  - light flashes synced to the beat
  - a camera punch-in of about 3% on downbeats
  - a hotter palette
- **Type:** Rubik (OFL licence), downloaded once into `public/fonts/`. Fallback: Arial Rounded MT Bold.

## Timeline

Times come from `src/scroll-lyrics.json`. Frames = ms × 0.06.

| Time (s) | Section | Visuals and choreography |
|---|---|---|
| 0–2.4 | Cold open | Luca drops in with a squash landing on the first beat. "TOKENS IN" slams in. The lockup snaps into the header on "Hey!" (2.06). |
| 2.5–6.2 | Verse | Groove. Luca points at camera on "You know I am the right one!". "Uh!" sticker. |
| 6.3–7.9 | Brand line | Ta-da presenter move toward the logo, which scales up and glows. |
| 8.2–8.8 | "Call me now" | Phone hand at ear, wink. |
| 9.1–10.5 | "love spark" | Heart hands and a spark burst. |
| 10.7–12.2 | "Output done!" ×2 | Double fist pump. |
| 12.2–13.9 | "Clear the cache…" | Wax-on wipe. |
| 14.5–21.2 | Pre-chorus 1 | Wave-off on "I will not remember you". Z / D / R hit poses with giant letter stamps. |
| 21.2–24.2 | "GPU memory… wiped so clean" | Wipe. |
| 24.4–27.8 | "API key was never seen" | Peekaboo. |
| 27.8–29.4 | Build | Groove. Callout **ZDR MODE: ON**. |
| 29.4–36.9 | Chorus A | Signature "Zero, zero" jump-and-pump. "Forgetting you!" and "We are through!" get a wave-off. |
| 36.9–43.8 | Chorus B | Robot pop-lock. Scissor-snip on "cutting the cord". |
| 43.8–51.5 | Chorus C | Signature move. Head tilt and "?" on "Who are you?". Big bye-bye wave. |
| 51.5–56.9 | Instrumental | Freestyle spin and running man. Beat-timed callouts **PROMPT IN → ANSWER OUT → NOTHING KEPT**. |
| 56.9–59.2 | Chorus tag | Signature move. |
| 59.2–63.5 | Instrumental | Groove. Callouts **YOUR PROMPTS: NEVER STORED** / **ZERO DATA RETENTION**. |
| 63.5–65.5 | Brand line | Presenter move. |
| 65.5–70.1 | Instrumental | Freestyle. Callout **NOTHING SAVED. NOTHING STORED.** |
| 70.1–72.5 | Brand line | Presenter move, variant. |
| 72.5–75.0 | Instrumental | Groove. Callout **SESSION ENDED · MEMORY CLEARED**. |
| 75.0–77.2 | "Status: Task completed." | Salute and ✓ stamp. |
| 77.2–78.9 | Gap | Idle breathing, looking around. |
| 78.9–80.9 | Punchline | Confused head-scratch, floating "?" marks, confused eyes. |
| 80.9–~84.0 | End card | Luca waves once and settles smaller below the lockup, face still above y 1450. Lockup moves to centre, then "AI Model Studio", "Zero Data Retention. Nothing saved. Nothing stored." |

Composition length is the measured audio duration plus 3.0 s, about 5040 frames. It is measured, not hard-coded from this table.

All callout text is a first draft. Final wording is edited in `callouts.json`.

## Luca puppet

- **Hierarchy:**
  - root (x, y, squash/stretch, lean) → hips → torso → neck → head
  - head children: antlers L/R, ears L/R, brows, eyes, muzzle, mouth
  - arms: shoulder → elbow → wrist, with swappable hands (fist, open, point, thumbs-up, peace)
  - legs: hip → knee → ankle, with foot
- **Limbs:** drawn as round-capped stroked paths, a dark outline stroke under a fill stroke, so bends stay seamless.
- **Proportions:** head is about 55% of total height. Antlers use the green gradient `#36D0AC→#60F770`. Fur is about `#FDBB57`, inner ears orange-red, outlines dark brown about `#4A2208`.
- **Face states:**
  - eyes: open (two highlights, lash flicks), blink, happy "^ ^", wink, confused, look direction
  - brows: neutral, raised, worried
- **Mouth shapes:** smile (closed), AH (open, pink tongue), EE, OO, small O, SHOUT.
- **Secondary motion:**
  - spring follow-through on antlers and ears
  - hoodie hem squash
  - shadow scales with jump height
  - seeded random blinks every 2–5 s

## Singing (lip-sync)

- Each word in `scroll-lyrics.json` is split into syllables by vowel groups. Each syllable opens the mouth in its vowel's shape: a → AH, e/i → EE, o/u → OO, short or unstressed → small O.
- Openness is the syllable envelope multiplied by the pre-computed vocal-band loudness (300–3400 Hz) from `vocal-envelope.json`, so the mouth closes during pauses inside words.
- Ad-libs (Hey!, Uh!, Z! D! R!) use SHOUT.
- Brows lift on loudness peaks during held notes.

## Dancing

- `scripts/analyze-audio.mjs` decodes the audio with Remotion's bundled ffmpeg and writes:
  - `beats.json`: BPM, first-beat ms, downbeat offset, beat list, plus manual override fields
  - `vocal-envelope.json`: one value per video frame
- A **move** is a pure function from (beat position, parameters) to a partial pose. Moves:
  - bounce-groove, two-step, point, presenter, call-me, heart-hands, fist-pump, wipe, wave-off
  - zdr-hits, peekaboo, signature-chorus, robot, bye-bye, freestyle (spin, running man)
  - salute, confused, idle, end-wave
- `choreography.ts` maps lyric lines and instrumental ranges to moves. Adjacent moves blend over half a beat.

## Code structure

```
src/index.tsx                 registers ZeroDataRetention (unchanged) + ZDRVertical
src/vertical/VerticalAd.tsx   top-level scene: audio, layers, end card
src/vertical/layout.ts        safe-zone and stage constants
src/vertical/Stage.tsx        background, spotlight, floor ring, particles
src/vertical/BrandLockup.tsx  vector BITDEER + AI pill
src/vertical/Lyrics.tsx       3-line karaoke stack
src/vertical/AdLibs.tsx       sticker bursts and Z/D/R stamps
src/vertical/Callouts.tsx     instrumental ad copy
src/vertical/EndCard.tsx
src/luca/Luca.tsx             renders puppet from a Pose
src/luca/parts/*              head, face, mouths, limbs, hands, hoodie
src/luca/pose.ts              Pose type, blending
src/luca/moves.ts             move library
src/luca/choreography.ts      timeline of moves
src/luca/lipsync.ts           mouth shape and openness per frame
src/data/beats.json, vocal-envelope.json, callouts.json
scripts/analyze-audio.mjs
```

## Testing

- **Vitest unit tests** (dev dependency):
  - lip-sync syllable and vowel mapping
  - choreography covers every frame with no gaps
  - pose blending has no jump above a threshold at move boundaries
  - every lyric line and callout, wrapped with a conservative character-width estimate, fits inside the safe zone
- **Visual checks:** `remotion still` renders at key moments, reviewed before each checkpoint.

## Review checkpoints

1. **Luca model sheet (still):** front pose, 4 dance poses, 6 mouth shapes. Character sign-off happens here.
2. **Dance test (about 10 s, 1080p):** the chorus "Zero, zero data retention!" with signature move and lip-sync.
3. **Full draft (1080p).**
4. **Final 4K master:** `npx remotion render src/index.tsx ZDRVertical out/zdr-vertical-4k.mp4 --codec=h264 --crf=16 --scale=2`, rendered in the background. Expect an hour or more.

A README section "Revision 16 — vertical 4K ad" covers edit and render commands and where to change copy, choreography and timings.

## Risks

- **Off-model redraw.** Caught at checkpoint 1.
- **Word timings are estimates** (per README rev 13). The loudness gate hides small errors; worse ones are tuned at checkpoint 3.
- **Beat detection error.** Cross-checked against lyric onsets, with manual override in `beats.json`.
- **Font download needs network.** Fallback is the system rounded font.
- **4K render time.** The render runs in the background, and the 1080p drafts come first.

## Out of scope

- Changing the audio or the sung lyrics
- Official PNG cameos
- Changes to the horizontal video
- Shorter 15 s or 30 s cut-downs (possible follow-up)
