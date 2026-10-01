import {MOVES, Ctx} from './moves';
import {blend, Pose} from './pose';
import {beatAt} from '../timing';
import {TOTAL_MS} from '../timing';

export type Segment = {start: number; end: number; move: keyof typeof MOVES; p?: Ctx['p']; blendMs?: number};

// [start ms, move, params]; each segment ends where the next begins.
// Starts follow the lyric line times in scroll-lyrics.json.
const TABLE: [number, string, Ctx['p']?, number?][] = [
	[0, 'intro'],
	[2480, 'heartHands'],
	[3880, 'point', {winkMs: 1300}],
	[5960, 'hipHit', {}, 90],
	[6280, 'presenter'],
	[8160, 'callMe'],
	[9080, 'heartHands'],
	[10720, 'fistPump'],
	[12240, 'wipe'],
	[14540, 'waveOff'],
	[17200, 'zdrHits', {hits: [0, 240, 360]}, 80],
	[18000, 'shrugNo'],
	[20700, 'zdrHits', {hits: [0, 160, 260]}, 80],
	[21200, 'wipe', {both: 1}],
	[24440, 'talkHand'],
	[27760, 'build'],
	[29420, 'chorus', {spin: 1}, 110],
	[32020, 'waveOff'],
	[33320, 'chorus', {}, 110],
	[35420, 'crossX'],
	[36940, 'robot'],
	[38680, 'scissor'],
	[40460, 'safe'],
	[42220, 'safe'],
	[43780, 'chorus', {spin: 1}, 110],
	[45560, 'think'],
	[47480, 'chorus', {}, 110],
	[48940, 'byeBye'],
	[51500, 'freestyle', {}, 360],
	[56900, 'chorus', {spin: 1}, 220],
	// 59.13-72.59 s is cut from the song (see CUT_BEATS in timing.ts); the video jumps to the band stop.
	[72590, 'outroGlide', {}, 60],
	[75000, 'thumbsUp', {}, 380],
	[77200, 'lookAround', {}, 360],
	[78860, 'sorry', {}, 260],
	[80200, 'confused', {}, 240],
	[80900, 'shieldUp', {}, 260],
];

export const SEGMENTS: Segment[] = TABLE.map(([start, move, p, blendMs], i) => ({
	start, end: TABLE[i + 1]?.[0] ?? TOTAL_MS + 1000, move, p: p ?? {}, blendMs,
}));

const ctxFor = (s: Segment, ms: number): Ctx => {
	const b = beatAt(ms), b0 = beatAt(s.start);
	return {ms, b, lb: b - b0, dur: beatAt(s.end) - b0, lms: ms - s.start, p: s.p ?? {}};
};

/** A segment's own pose at a time, without cross-fading. */
export const movePoseAt = (s: Segment, ms: number): Pose => MOVES[s.move](ctxFor(s, ms));

const segmentIndex = (ms: number) => {
	let i = 0;
	while (i < SEGMENTS.length - 1 && ms >= SEGMENTS[i + 1].start) i++;
	return i;
};

const ease = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

/** Luca's pose at a time, cross-fading from the previous move at each boundary. */
export const poseAt = (ms: number): Pose => {
	const i = segmentIndex(ms), s = SEGMENTS[i];
	const current = MOVES[s.move](ctxFor(s, ms));
	const blendMs = s.blendMs ?? 200;
	if (i === 0 || ms - s.start >= blendMs) return current;
	const prev = SEGMENTS[i - 1];
	return blend(MOVES[prev.move](ctxFor(prev, ms)), current, ease((ms - s.start) / blendMs));
};

export const segmentAt = (ms: number) => SEGMENTS[segmentIndex(ms)];
