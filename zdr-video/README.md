# Zero Data Retention — lyric video

Revision 7: fixed pre-cue glyph leakage with explicit visibility gating and fixed clipping bounds; text and strike-through now share a single transform and measured inline width; removed duplicate chorus Z/D/R and the TRANSMISSION label. Added a refined packet rail, gradient capsule progress, circular compute meter, memory cells, buffer scanner, connection-path animation, completed-document icon, and heavier circular confirmation mark.

1920 × 1080, 60 fps. Timing retains revision 6 audio-derived phrase and word-group offsets. Difficult sung proper nouns remain estimated rather than manually verified karaoke alignment.

## Edit

Install Node.js, then run `npm install` and `npx remotion studio src/index.tsx`.
Render with `npx remotion render src/index.tsx ZeroDataRetention output.mp4 --codec=h264 --crf=20`.

`src/captions.json` holds phrase timings in milliseconds and the text, separated into display lines with `|`. Timings were estimated using two automatic transcription passes and reconciled with the supplied lyrics. They are phrase timings, not a verified karaoke alignment. The low-confidence branded outro was positioned manually.

`src/scenes/TechGraphics.tsx` contains the animated SVG motifs. Each cue may specify `lineOffsetsMs`, `dataOffsetMs`, and an instrumental `stage`. `src/Backdrop.tsx` defines the sectional palette and is shared by all foreground graphics. `src/scenes/LyricScene.tsx` controls lyric styling and movement. `BreakScene.tsx` controls the instrumental typography montage.

The supplied local reference was inspected for layered composition, sequencing, and movement. No reference footage is included.

`local-network.cjs` supplies a loopback address only when network interface enumeration fails in the rendering environment. On a normal computer it is unnecessary. In that environment prefix commands with `NODE_OPTIONS='--require ./local-network.cjs'`.


Technique reference: Adobe, Animate text letter by letter — https://www.adobe.com/learn/after-effects/web/animate-letter-by-letter. Independent staged position/reveal animation was applied to words and phrases here; no reference graphics or footage were copied.

## Revision 8
Raised REMEMBER YOU strike to the capital-letter optical center and removed the EVERYTHING strike. Added explicit second-hit ZERO animations throughout chorus cues, with restrained scale/rotation and fading outline echoes. Replaced recurring progress displays with multicolor orbital, circuit-node, and dissolving-pixel graphics. Only the initial brand cue retains a conventional loading bar. Second-hit offsets are editorial timing estimates, editable as zeroHitMs in captions.json.

## Revision 9
API-key deletion cursor now derives its position from the same remaining-character count and explicit text width as the key, following backspacing to the left.

## Contextual graphic refinement
Removed decorative confetti and atom-like orbits. Processing now uses a chip with input/output paths. Chorus graphics use erased documents, clearing memory, and buffer wipes. File deletion colors identify content and deletion states; colorful network nodes remain in routing and brand scenes.

## Revision 10
51.5–56.9 s instrumental replaced by an accelerating typography/tech collage. Cut accents follow measured audio-envelope attacks, with added half-beat changes near the end. Motifs build from tokens/prompt/compute/output/cache/forget, then collapse to CLEARED before the returning chorus.

Graphic assignment pass: distinct gate, expiry, shred, disconnect and release motifs for the five chorus returns; document purge reserved for nothing saved, disk graphic for nothing stored, GPU grid for GPU memory, wipe for wiped clean. Later interludes use address release and session reset. Build scene ends exactly at the returning chorus to avoid an overlapping cleared stamp.

## Revision 11
Continuous falling gold token coins replace the opening rails/arrows. Rebuilt the broken heart as a recognizable paired silhouette. Removed supplemental graphics from all repeated ZERO DATA RETENTION titles. File contents finish erasing before crosses appear. Routing advances through queued, routed and delivered with endpoint completion. Removed triangle decoration; added user-supplied transparent Bitdeer logo as a restrained header and prominent closing brand reprise.

## Revision 12 — 4K master
All logo placements use the official Bitdeer horizontal SVG from https://file.bitdeer.com/bd-public-prod/resources/images/logo-new1.svg?version=lucas (source page: https://www.bitdeer.com/brand-material). Vector paths preserve the exact brand artwork. Render master at 3840×2160, 60 fps with `--scale=2 --crf=16`; the design coordinate system remains 1920×1080.

## Revision 13 — scrolling lyrics edition
Replaces the kinetic collage video with a black five-line scrolling lyric layout. Official vector Bitdeer logo, green completed words and amber current-word fill, eased scrolling and small word lifts. src/scroll-lyrics.json contains corrected text and per-word Caption fields. Timings derive from prior Whisper word estimates; ad-libs, the opening corrected phrase and sung brand reprises use editorial estimates. Instrumental passages hold the lyrics without unrelated graphics. Original scene code is retained but unused; kinetic-entry.tsx preserves the former composition entry. Export remains native-rendered 4K 60 fps.

## Revision 14 — continuous highlight
Each word now fills left-to-right in one fixed green and retains the same green after completion. Removed the amber-to-green boundary switch, per-word vertical bounce, and toggling glow. Completed lines dim uniformly only once the next line begins, avoiding a reset before the last word completes.

## Revision 14 refinement — amber onset highlights
User requested retaining whimsy. Whole words now turn amber immediately at their timestamps, with a small 4 px bounce settling within 180 ms or the word duration, whichever is shorter. No letter sweep and no completion color reset. Completed words remain amber; only whole-line dimming happens on transition. Green remains in branding, line indicator and progress.

## Revision 15 — smooth amber line fill
Restored progressive left-to-right word-timed fill using amber throughout the line, with no completion color reset. Reduced word lift from 4 px to 1.5 px; a 320–520 ms raised-cosine curve starts and ends at zero velocity. This replaces the sharp bounce while preserving subtle motion.

## Revision 16 — vertical 4K advert with dancing Luca
New composition `ZDRVertical` for TikTok, Reels and Shorts. It is designed at 1080 × 1920 and rendered at `--scale=2`, so the master is 2160 × 3840 at 60 fps. The horizontal `ZeroDataRetention` composition is unchanged. Design spec: `docs/superpowers/specs/2026-09-30-zdr-vertical-ad-design.md`.

What's in it:
- **Luca:** a vector puppet redrawn from the official Welcome art, wearing a white Bitdeer hoodie. He dances 28 beat-locked moves, choreographed per lyric line, and lip-syncs using the word timings gated by vocal-band loudness.
- **Lyrics:** a three-line karaoke stack. Ad-libs become sticker bursts, and the Z-D-R hits become giant stamps.
- **Callouts:** advert copy shown during the instrumentals.
- **Brand:** the vector Bitdeer AI lockup (official SVG plus a rebuilt AI pill) and a 3 s end card.
- **Safe zone:** all text and Luca's face stay clear of the platform UI: top 220 px, bottom 420 px, and the right button column.

Commands:
- Render the master: `npm run render:vertical`, which writes `out/zdr-vertical-4k.mp4`.
- Preview: `npm run studio`, then pick `ZDRVertical`. `LucaSheet` (model sheet) and `ContactSheet` (12 moments in one still) are for development.
- Tests: `npm test`. These check lip-sync, the beat grid, the rig, choreography continuity, lyric data and the safe-zone layout.
- Beat analysis: `npm run analyze` regenerates `src/data/beats.json` and `src/data/audio-envelope.json` from `public/audio.mp3`. The tempo drifts from about 140 to 143 BPM, so beats come from dynamic-programming tracking, not a fixed grid. `override.shiftMs` and `override.downbeatOffset` in `beats.json` allow manual correction.

Where to edit:
- **Advert copy and end-card tagline:** `src/data/callouts.json`. Every line only repeats claims the song itself makes.
- **Choreography:** the `TABLE` in `src/luca/choreography.ts` (start ms, move, params).
- **Moves:** `src/luca/moves.ts`. Angles are mirrored per side: `a` raises the upper arm (0 down, 90 out, 180 up) and `b` bends the elbow. Raised hands are kept beside Luca's large head (`a` about 110–120) and drawn in front of it (`front: true`).
- **Artwork:** `src/luca/parts/Head.tsx` and `src/luca/parts/Body.tsx`, with colours in `src/luca/colors.ts`.
- **Layout and safe zone:** `src/vertical/layout.ts`.
- **Lighting energy by section:** `src/vertical/sections.ts`.

Fonts are Rubik (SIL Open Font License, `public/fonts/`), loaded locally.

## Revision 17 — on-model Luca, privacy stage, edited song
- **Luca rebuilt from the official art.**
  - `scripts/trace-luca.mjs` colour-segments `reference/luca-welcome.png` (official Welcome art) and traces the head, ears, antlers, eyes, brows, muzzle, nose and chin shade into `src/luca/traced.json`, together with the official palette.
  - Parts covered by props in the source (thumb, flagpole) are taken from the clear side and mirrored.
  - The body follows measured official proportions: boxy short-sleeve Bitdeer hoodie, brand-green shorts, straight stub legs, big flat feet, fur forearms and large paws.
  - Re-trace with `node scripts/trace-luca.mjs` (`--debug` writes `out/_trace_debug.png`).
- **Stage:**
  - vault-dial floor that clicks round on the beat
  - keyhole shield on an encryption hex mesh
  - chorus scan beam
  - lock, shield and key icons that dissolve into pixels (these replace the coins)
- **Text:**
  - Inter replaces Rubik.
  - On-screen lyrics now match the original lyrics: a single "Zero", no Hey!/Uh! bursts and no advert callouts.
  - The subtitle under the logo and on the end card is ZERO DATA RETENTION (`src/data/copy.json`).
  - The "AI" in the lockup is black.
- **Song edit:**
  - Two whole-bar cuts remove most of the 59.2–63.5 s and 65.5–70.1 s breaks (beats 139–147 and 155–163, `CUT_BEATS` in `src/timing.ts`).
  - The audio is spliced in the composition with 3-frame crossfades.
  - All data stays in original song time; `songMsAt(videoMs)` maps the edit.
  - Video length is 77.2 s.
- **Preview:** `npx remotion render src/index.tsx ZDRVertical out/zdr-vertical-720p.mp4 --scale=0.6666666667 --codec=h264 --crf=20`.

## Revision 18 — natural Luca, one clean song edit
- **Arms and paws** (`src/luca/parts/Body.tsx`):
  - Each arm is one outlined silhouette. The short sleeve shares the hoodie's outline pass, so it grows out of the body. The fur arm runs from inside the sleeve through the elbow into a mitten paw, with no detached pieces.
  - Paws are single mitten shapes with crease lines, not circles with sticks. The point puts the index finger on the thumb side with the thumb tucked under it, so it can't read as a middle finger. The thumb on the thumbs-up always points skyward.
  - Wrist bend is clamped to ±28° (`WRIST_LIMIT`), and `paw.test.ts` checks that every move stays within it.
- **Motion:**
  - Jumps spread the legs and point the toes (`rig.ts`).
  - The chorus jumps stretch, squash, spin and crouch to load the next jump.
  - The groove shifts weight foot to foot.
  - New moves: `sorry` (a sheepish scratch with closed eyes, replacing the ring-and-dot `blank` eyes) and a friendlier `confused`.
- **Song edit:**
  - One 8-bar cut, `CUT_BEATS [[139, 171]]`, from the end of the last chorus to the band drop before "Status: Task completed." It removes both garbled sung "Bitdeer AI Model Studio" reprises.
  - Cuts use 4-frame equal-power crossfades.
  - Video length: 70.4 s.
- **Lyrics:** feature words get their own colour and motion once sung (`FEATURES` in `src/vertical/Lyrics.tsx`). For example, "love spark" gets a pink-gold shimmer with sparks, "gone" and "never seen" glitch, and "cache" and "clean" get an ice shimmer.
- **Logo:** the supplied `Bitdeer AI Logo-1200_300.png` is used as-is (cropped, never stretched), with white "AI".

## Revision 19 — deer paws, soft hoodie sleeves, outro bit, end jingle
- **Paws** follow the IP library (Welcome art, skateboard, reading and thumbs-up badge). They are round mitten blobs with stubby rounded digits, a single curl crease and an orange cel-shade at the tip, with no human finger lines. The arm is thicker, like the official stubby forearms.
- **Sleeves** are one rounded hoodie shape: a round shoulder, slightly tapered sides and a soft convex cuff with a ribbed band and an underside shadow fold. They share the torso's outline pass, so they never float free. A hood collar now sits round the neck.
- **Arm attachment:** only the upper arm is masked by its own sleeve, so a forearm folded back across the sleeve stays attached, in front of it.
- **Continuity:** the chorus move is one continuous curve, with no hard switches on beat lines. Z-D-R hits ease in over 70 ms.
- **59–62 s:** the band drops out here, so `outroGlide` is a time-based bit rather than beat-locked dancing. Luca spins out of the chorus into finger guns, does two "pew" recoils with a wink, and leans back into the thumbs-up on "Status". The lyrics' rest-dim now measures gaps in video time, so it no longer flickers across the cut.
- **End:** the echo tail is removed. `public/end-jingle.wav` (built by `node scripts/make-end-jingle.mjs`, fully synthesised, in C) plays a bubble "bloop", a four-note glockenspiel arpeggio and a sparkle. Chime sparkles and a logo boing on the end card are synced to its notes.

## Revision 20 — no snapping
- **Motion clean-up pass** (`src/luca/videoPose.ts`): the final pose is a Gaussian-weighted average over ±100 ms (σ 40 ms). This rounds off any single-frame corner left by a move or a move boundary, while beat-sized gestures keep their punch. Hand shapes, eyes and arm layering come from the centre frame.
- **Spin** blends by the shortest turn (`pose.ts`), so a finished spin can't flash a half-turn while cross-fading into the next move.
- **Freestyle** (51.5–56.9 s): spin, body roll, running man, then a pointing hit. Each part keeps running past its slot and cross-fades into the next over half a beat. The floss's hard left/right arm flip is gone.
- **Outro** (59–63 s): finger guns lead into a single thumbs-up rise with a hop, then a slow two-bar sway. The per-beat pumping is gone. `lookAround` is a glance, a hold and a glance back, rather than a constant sine loop.
- **Test:** `videoPose.test.ts` checks the per-frame second difference of every joint across the whole video: under 6, or under 12 for deliberate hits (Z-D-R, intro landing, robot pops).

## Revision 21 — curtain, title card, cheek tufts, shield finale, new stage
- **Curtain** (`src/vertical/Curtain.tsx`): a red velvet tableau curtain with a gold-trimmed valance, gold braid on the leading edges and a fringed hem. Opening lifts each drape's inner bottom corner diagonally to a roped tie-back at the side, so the folds fan out from the tie-back as on a real stage. The drapes then slide off-screen, so only the valance frames the stage. The curtain does not close: the video ends on Luca's wave.
  - It opens as the song starts and closes for the sign-off. The valance stays up throughout to frame the stage.
- **Title screen:** a 3 s pre-roll (`INTRO_MS` in `timing.ts`) on the closed, spotlit curtain shows "NOW PLAYING / ZDR / PERFORMED BY [Bitdeer AI logo]".
  - The song starts at video 3.0 s, and Luca drops in from above as the curtain parts. The copy is in `src/data/copy.json`.
- **Face:** the lower head outline is rebuilt from measurements of the official Welcome art (`HEAD_PATH` in `Head.tsx`). It has a cheek tuft just under each eye, with a flat top edge and the tip pointing up and out, an orange underside shade, and one smooth jaw to the chin. The trace had lost the tufts and left downward lumps.
- **End card:**
  - The logo and subtitle stay where they are in the header.
  - The title, the tagline and the shield effects are drawn as SVG. CSS `background-clip: text` rendered as solid colour blocks in the encoded video, although it looked right in stills.
  - "Nothing saved." sits above "Nothing stored." in big type (112 px). The first line is white with a shine sweep; the second has a brand-green shimmer.
- **Shield finale** (`shieldUp` in `moves.ts`, drawn in `Effects.tsx`): Luca whips out a brand-green keyhole shield with a hex energy dome. He blocks four cyber attacks (code packet, bug, phishing hook, then a big one) that fly in from the left and shatter into red pixels. He recoils on each hit. Each attack is a red data bolt with a glitchy trail; a hex barrier flares in a ripple where it lands and the bolt splits into sparks. Then he gives a victory wave and a wink as the jingle plays. There is no on-screen text in this moment.
- **Stage:** aurora ribbons, faint binary rain behind the shield and light trails racing down the floor grid, on a deeper navy sky.
- **Length:** 75.1 s (3 s title, 67.4 s edited song, 4.7 s end card).
- **Shield SFX:** `public/shield-sfx.wav` (built by `node scripts/make-shield-sfx.mjs`, fully synthesised) has a "shing" draw, a whoosh per attack and a thump-zap-clang per block, timed to `SHIELD_HITS`.
