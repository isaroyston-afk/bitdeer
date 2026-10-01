// Secondary motion (antler/ear spring follow-through) and seeded blinks.
import {Pose} from './pose';

const DT = 1 / 60;

/** Damped springs driven by head acceleration; simulated over the last 0.6 s so renders stay deterministic. */
export const wobbleAt = (ms: number, poseAt: (ms: number) => Pose) => {
	const head = (t: number) => {const p = poseAt(t); return {y: p.y + p.drop + p.headY, x: p.x + p.lean * 3 + p.headTilt * 2};};
	const k = (2 * Math.PI * 3.2) ** 2, c = 2 * 0.22 * Math.sqrt(k), g = 0.0009 * k;
	let sym = 0, symV = 0, lat = 0, latV = 0;
	const samples: {x: number; y: number}[] = [];
	for (let i = 0; i <= 38; i++) samples.push(head(ms - (37 - i) * DT * 1000));
	for (let i = 1; i < samples.length - 1; i++) {
		const ay = (samples[i + 1].y - 2 * samples[i].y + samples[i - 1].y) / (DT * DT);
		const ax = (samples[i + 1].x - 2 * samples[i].x + samples[i - 1].x) / (DT * DT);
		symV += (-k * sym - c * symV + g * ay) * DT; sym += symV * DT;
		latV += (-k * lat - c * latV + g * ax) * DT; lat += latV * DT;
	}
	const clamp = (v: number) => Math.max(-18, Math.min(18, v));
	return {sym: clamp(sym), lat: clamp(lat)};
};

const mulberry = (seed: number) => () => {
	seed |= 0; seed = seed + 0x6D2B79F5 | 0;
	let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
	t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const BLINKS: number[] = [];
{const r = mulberry(7); for (let t = 1400; t < 90000; t += 2200 + r() * 2600) BLINKS.push(t);}

/** 0 = open, 1 = fully closed. Blinks last 150 ms. */
export const blinkAt = (ms: number) => {
	for (const t of BLINKS) {
		if (ms < t) break;
		const u = (ms - t) / 150;
		if (u < 1) return Math.sin(Math.PI * u);
	}
	return 0;
};
