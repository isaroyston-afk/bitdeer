import beatsData from './data/beats.json';

export const FPS = 60;
/** Length of public/audio.mp3. All song data (lyrics, beats, moves) uses this "song time". */
export const AUDIO_MS = beatsData.durationMs;
export const END_CARD_MS = 4700;
/** Title screen on the closed curtain before the song starts (video time 0 to INTRO_MS). */
export const INTRO_MS = 3000;
/** The end-card sign-off (public/end-jingle.wav) and its start, in song time: on Luca's victory wave,
 * after his shield blocks the attacks (END_MS 80900 + VICTORY_MS 2350 - 300 ms so the chimes land on it). */
export const JINGLE_MS = 2600;
export const JINGLE_AT = AUDIO_MS + 2070;
/** Song-time end of the end card (the end card runs past the audio). */
export const TOTAL_MS = AUDIO_MS + END_CARD_MS;

const shift = beatsData.override.shiftMs ?? 0;
export const BEATS: number[] = beatsData.beats.map(b => b + shift);
export const DOWNBEAT: number = beatsData.override.downbeatOffset ?? beatsData.downbeatOffset;
const first = BEATS[1] - BEATS[0], last = BEATS[BEATS.length - 1] - BEATS[BEATS.length - 2];

/** Continuous beat position at a time; beat i sits exactly at BEATS[i]. */
export const beatAt = (ms: number): number => {
	if (ms <= BEATS[0]) return (ms - BEATS[0]) / first;
	const n = BEATS.length - 1;
	if (ms >= BEATS[n]) return n + (ms - BEATS[n]) / last;
	let lo = 0, hi = n;
	while (hi - lo > 1) {const mid = (lo + hi) >> 1; if (BEATS[mid] <= ms) lo = mid; else hi = mid;}
	return lo + (ms - BEATS[lo]) / (BEATS[lo + 1] - BEATS[lo]);
};

export const msAtBeat = (b: number): number => {
	const n = BEATS.length - 1;
	if (b <= 0) return BEATS[0] + b * first;
	if (b >= n) return BEATS[n] + (b - n) * last;
	const i = Math.floor(b);
	return BEATS[i] + (b - i) * (BEATS[i + 1] - BEATS[i]);
};

export const isDownbeat = (i: number) => ((i - DOWNBEAT) % 4 + 4) % 4 === 0;
/** Position within the bar, 0..4, with 0 on the downbeat. */
export const barPhase = (b: number) => (((b - DOWNBEAT) % 4) + 4) % 4;

// ---- Song edit: one 8-bar cut (beat indices from beats.json). It removes both sung
// "Bitdeer AI Model Studio" reprises, whose vocals are garbled, and joins the last chorus
// straight to the outro, where the band drops out on the downbeat at beat 171. ----
const CUT_BEATS: [number, number][] = [[139, 171]];
export const CUTS: [number, number][] = CUT_BEATS.map(([a, b]) => [BEATS[a], BEATS[b]]);
export const CUT_MS = CUTS.reduce((s, [a, b]) => s + b - a, 0);
export const VIDEO_TOTAL_MS = INTRO_MS + TOTAL_MS - CUT_MS;
export const TOTAL_FRAMES = Math.ceil(VIDEO_TOTAL_MS / 1000 * FPS);

/** Song time for a video time: the song starts after the title screen and skips each cut.
 * Negative during the title screen. */
export const songMsAt = (videoMs: number) => {
	let s = videoMs - INTRO_MS;
	for (const [a, b] of CUTS) if (s >= a) s += b - a;
	return s;
};
/** Video time at which a song time is heard (song times inside a cut map to the cut point). */
export const videoMsAt = (songMs: number) => {
	let v = songMs + INTRO_MS;
	for (const [a, b] of [...CUTS].reverse()) {
		if (songMs >= b) v -= b - a;
		else if (songMs > a) v -= songMs - a;
	}
	return v;
};
/** Kept stretches of the audio file and where each starts in the video. */
export const PIECES = (() => {
	const out: {songStart: number; songEnd: number; videoStart: number}[] = [];
	let start = 0, video = INTRO_MS;
	for (const [a, b] of CUTS) {out.push({songStart: start, songEnd: a, videoStart: video}); video += a - start; start = b;}
	out.push({songStart: start, songEnd: AUDIO_MS, videoStart: video});
	return out;
})();
