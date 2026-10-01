// Song structure used by the stage lighting and camera.
import env from '../data/audio-envelope.json';
import {AUDIO_MS} from '../timing';

// Song time. The edit jumps from the end of the last chorus (59.13 s) to the outro (72.59 s).
export const CHORUS: [number, number][] = [[29420, 51500], [56900, 59200]];
export const BREAKS: [number, number][] = [[51500, 56900]];
export const BRAND_LINES: [number, number][] = [[6280, 7900]];
/** The band drops out: sparse spoken outro ("Status: Task completed." … "Who were you again?"). */
export const OUTRO: [number, number] = [72590, 80900];
export const END_MS = 80900;

export const inRange = (ms: number, ranges: [number, number][]) => ranges.some(([a, b]) => ms >= a && ms < b);

const smoothstep = (a: number, b: number, x: number) => {const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t);};

/** 0..1 visual energy: verse 0.45, pre-chorus 0.6, build ramps, chorus 1, breaks 0.85, outro 0.28, end card 0.3. */
export const energyAt = (ms: number) => {
	const level = (t: number) => {
		if (t >= END_MS) return 0.3;
		if (t >= OUTRO[0]) return 0.28;
		if (inRange(t, CHORUS)) return 1;
		if (inRange(t, BREAKS)) return 0.85;
		if (t >= 27760 && t < 29420) return 0.6 + 0.4 * smoothstep(27760, 29420, t);
		if (t >= 14540 && t < 27760) return 0.6;
		return 0.45;
	};
	// Average a short window so section changes ease in over ~300 ms.
	let s = 0;
	for (let k = -3; k <= 3; k++) s += level(ms + k * 50);
	return s / 7;
};

const frameOf = (ms: number) => Math.round(ms / 1000 * env.fps);
const read = (arr: number[], ms: number) => ms < 0 || ms >= AUDIO_MS ? 0 : arr[Math.min(arr.length - 1, frameOf(ms))] ?? 0;
export const vocalAt = (ms: number) => read(env.vocal, ms);
export const bassAt = (ms: number) => read(env.bass, ms);
