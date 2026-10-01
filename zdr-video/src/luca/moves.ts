// Luca's move library. Every move is a pure function of time; beat-based fields
// come from the tracked beat grid so the dancing stays on the (drifting) tempo.
import {pose, Pose, PartialPose, Arm, REST, blend} from './pose';

export type Ctx = {
	ms: number;
	/** Global beat position. */
	b: number;
	/** Beats since the segment started. */
	lb: number;
	/** Segment length in beats. */
	dur: number;
	/** Milliseconds since the segment started. */
	lms: number;
	p: Record<string, number | string | number[]>;
};
export type Move = (c: Ctx) => Pose;

/** Cyber attacks hitting Luca's shield, ms after the shieldUp move starts. The last is the big one. */
export const SHIELD_HITS = [950, 1300, 1650, 2050];
/** When the attacks are over and Luca waves, ms after the shieldUp move starts. */
export const VICTORY_MS = 2350;

const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {const t = clamp01(x); return t * t * (3 - 2 * t);};
const outBack = (x: number) => {const t = clamp01(x), c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;};
/** 1 exactly on each beat, falling to 0 half-way between. */
const onBeat = (b: number, sharp = 2) => (0.5 + 0.5 * Math.cos(TAU * b)) ** sharp;
/** Smooth square wave: -1 at even beats, +1 at odd beats, fast transition between. */
const sq = (b: number, k = 4) => Math.tanh(k * Math.sin(Math.PI * (b - 0.5))) / Math.tanh(k);
/** Snap between held values: returns integer step and an eased 0..1 within a fast transition. */
const snapStep = (b: number, len = 0.14) => {const i = Math.floor(b), f = b - i; return {i, t: smooth(f / len)};};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Bounce and head-bob layered under most gestures. */
const groove = (b: number, amount = 1): PartialPose => {
	const k = onBeat(b), s = Math.sin(Math.PI * b);
	return {
		drop: 6 + 16 * k * amount,
		squash: 1 + 0.035 * k * amount,
		headY: 5 * onBeat(b - 0.15) * amount,
		headTilt: -5 * Math.sin(Math.PI * (b - 0.12)) * amount,
		x: 14 * s * amount,
		lean: 4 * s * amount,
		// Weight shifts from foot to foot with the sway: the unweighted heel lifts.
		legL: {lift: 10 * Math.max(0, s) ** 2 * amount}, legR: {lift: 10 * Math.max(0, -s) ** 2 * amount},
	};
};
const on = (base: PartialPose, over: PartialPose): Pose => pose(over, pose(base));

const HIP: Partial<Arm> = {a: 34, b: -118, hand: 'fist'};
const armMix = (a: Partial<Arm>, b: Partial<Arm>, t: number): Partial<Arm> => ({
	a: lerp(a.a ?? 0, b.a ?? 0, t), b: lerp(a.b ?? 0, b.b ?? 0, t), rot: lerp(a.rot ?? 0, b.rot ?? 0, t),
	hand: t < 0.5 ? a.hand : b.hand, front: t < 0.5 ? a.front : b.front,
});

export const MOVES: Record<string, Move> = {
	idle: ({ms}) => pose({
		drop: 6 + 4 * Math.sin(TAU * ms / 2600), headTilt: 2 * Math.sin(TAU * ms / 3100),
		armL: {a: 12 + 3 * Math.sin(TAU * ms / 2600)}, armR: {a: 12 + 3 * Math.sin(TAU * ms / 2600 + 1)},
	}),

	groove: ({b}) => {
		const s = Math.sin(Math.PI * b), k = onBeat(b);
		return on(groove(b), {
			armL: {a: 24 + 16 * s, b: -50 - 12 * k}, armR: {a: 24 - 16 * s, b: -50 - 12 * k},
			legL: {lift: 9 * Math.max(0, s)}, legR: {lift: 9 * Math.max(0, -s)},
			eyes: Math.floor(b / 8) % 2 ? 'happy' : 'open',
		});
	},

	twoStep: ({b}) => {
		const c = Math.cos(Math.PI * (b - 0.5));
		return on(groove(b, 0.6), {
			x: 36 * sq(b), lean: 5 * sq(b),
			legR: {lift: 22 * Math.max(0, c) ** 2, x: 6}, legL: {lift: 22 * Math.max(0, -c) ** 2, x: 6},
			armL: {a: 36 + 26 * c, b: -88}, armR: {a: 36 - 26 * c, b: -88},
			headTilt: -6 * sq(b),
		});
	},

	/** Opening: Luca drops in, "Tokens in" pulls in, "tokens out" pushes out, "Hey!" jumps. */
	intro: ({ms, b}) => {
		// Before the song he waits above the frame; as the curtain finishes opening he drops in.
		const land = 340, from = -300;
		if (ms < land) {
			const t = clamp01((ms - from) / (land - from));
			return pose({y: -1150 * (1 - t * t), squash: 0.9, drop: 0, armL: {a: 116, b: 22, hand: 'open', front: true}, armR: {a: 116, b: 22, hand: 'open', front: true}, legL: {lift: 26}, legR: {lift: 26}, eyes: 'wide'});
		}
		const since = ms - land;
		const impact = Math.exp(-since / 90) * Math.cos(since / 40);
		const inT = smooth((ms - 620) / 160), outT = smooth((ms - 1460) / 160), hey = ms - 2000;
		const pull: Partial<Arm> = {a: 26, b: -104, hand: 'open', rot: -20};
		const push: Partial<Arm> = {a: 92, b: 16, hand: 'open', rot: -24};
		const fall: Partial<Arm> = {a: 116, b: 22, hand: 'open', front: true};
		let armL = armMix(armMix(fall, pull, smooth(since / 220)), push, outT);
		let armR = armL;
		let y = 0, squash = 1 + 0.22 * Math.max(0, impact), drop = 6 + 30 * Math.max(0, impact);
		if (hey > 0) {
			const h = clamp01(hey / 380);
			y = -120 * Math.sin(Math.PI * h);
			armR = armMix(armR, {a: 116, b: 40, hand: 'fist', front: true}, smooth(hey / 90));
			armL = armMix(armL, {a: 40, b: -20, hand: 'fist'}, smooth(hey / 90));
			if (h >= 1) {const s = hey - 380; squash = 1 + 0.16 * Math.exp(-s / 90); drop = 6 + 22 * Math.exp(-s / 110);}
		}
		return on(groove(b, 0.25 * inT), {
			y, squash, drop, armL, armR,
			legL: {lift: y < -20 ? 18 : 0}, legR: {lift: y < -20 ? 18 : 0},
			eyes: ms < 520 ? 'wide' : hey > 0 ? 'happy' : 'open', lean: -5 * inT * (1 - outT) + 4 * outT,
		});
	},

	heartHands: ({b, lms}) => {
		const e = smooth(lms / 260);
		const hand: Partial<Arm> = {a: 18, b: -112, hand: 'open', rot: 20, front: true};
		return on(groove(b, 0.55), {
			armL: armMix(REST.armL, hand, e), armR: armMix(REST.armR, hand, e),
			eyes: 'happy', blush: 0.85, headTilt: 7 * Math.sin(Math.PI * b), lean: 4 * Math.sin(Math.PI * b),
		});
	},

	point: ({b, lms, p}) => {
		const e = outBack(lms / 260);
		const armR = armMix(REST.armR, {a: 98, b: -16, hand: 'point'}, e);
		const armL = armMix(REST.armL, HIP, smooth(lms / 260));
		const wink = typeof p.winkMs === 'number' && lms > p.winkMs;
		return on(groove(b, 0.7), {armR, armL, lean: -6 * e, headTilt: 9 * e, eyes: wink ? 'wink' : 'open', lookX: 0.4});
	},

	/** "Uh!" hip hit. */
	hipHit: ({lms}) => {
		const k = Math.exp(-lms / 160);
		return pose({x: -22 * (1 - k), lean: 11 * (1 - Math.exp(-lms / 60)), squash: 1 + 0.1 * k, drop: 22, headTilt: -12,
			armL: HIP, armR: {a: 60, b: -120, hand: 'fist'}, eyes: 'happy', legR: {lift: 16}});
	},

	/** Ta-da toward the logo. side = 'right' raises one arm only. */
	presenter: ({b, lms, p}) => {
		const e = outBack(lms / 300), jazz = 16 * Math.sin(TAU * 2 * b);
		const up: Partial<Arm> = {a: 112, b: 24, hand: 'open', rot: 0.6 * jazz - 12, front: true};
		const armR = armMix(REST.armR, p.side === 'right' ? {a: 118, b: 28, hand: 'open', rot: 0.6 * jazz - 12, front: true} : up, e);
		const armL = p.side === 'right' ? armMix(REST.armL, HIP, smooth(lms / 260)) : armMix(REST.armL, up, e);
		return on(groove(b, 0.5), {y: -12 * e, armL, armR, lookY: -1, lookX: p.side === 'right' ? 0.5 : 0, headTilt: 6 * Math.sin(Math.PI * b), eyes: 'open', browL: 0.6, browR: 0.6});
	},

	callMe: ({b, lms}) => {
		const e = outBack(lms / 240);
		return on(groove(b, 0.6), {
			armR: armMix(REST.armR, {a: 38, b: 112, hand: 'shaka', rot: 12 * Math.sin(TAU * 2 * b)}, e),
			armL: armMix(REST.armL, HIP, smooth(lms / 240)),
			headTilt: 10 * e, eyes: lms > 260 ? 'wink' : 'open', lookX: 0.5, blush: 0.6,
		});
	},

	fistPump: ({b, lb, dur, lms}) => {
		const second = lb > dur / 2, k = onBeat(b, 3);
		const up: Partial<Arm> = {a: 110 + 10 * k, b: 38, hand: 'fist', front: true};
		const down: Partial<Arm> = {a: 30, b: -70, hand: 'fist'};
		const e = smooth(lms / 160);
		return on(groove(b, 0.8), {
			armR: second ? armMix(up, down, smooth((lb - dur / 2) / 0.4)) : armMix(REST.armR, up, e),
			armL: second ? armMix(down, up, smooth((lb - dur / 2) / 0.4)) : armMix(REST.armL, down, e),
			y: -26 * k, eyes: 'happy', lean: second ? 5 : -5,
		});
	},

	/** Wax-on circles: "Clear the cache", "wiped so clean". both = two hands. */
	wipe: ({b, lb, lms, p}) => {
		const e = smooth(lms / 260), ph = TAU * lb / 2;
		const circle = (dir: number): Partial<Arm> => ({a: 72 + 30 * Math.sin(ph * dir), b: -62 + 34 * Math.cos(ph * dir), hand: 'open', rot: -20});
		return on(groove(b, 0.5), {
			armR: armMix(REST.armR, circle(1), e),
			armL: p.both ? armMix(REST.armL, circle(-1), e) : armMix(REST.armL, HIP, e),
			lean: 6 * Math.sin(ph), headTilt: -6 * Math.sin(ph), eyes: 'closed', lookX: 0.3,
		});
	},

	/** Dismissive wave with the head turned away. */
	waveOff: ({b, lms}) => {
		const e = outBack(lms / 260);
		return on(groove(b, 0.45), {
			armR: armMix(REST.armR, {a: 108 + 10 * Math.sin(TAU * b), b: 26, hand: 'open', rot: -8 + 18 * Math.sin(TAU * b), front: true}, e),
			armL: armMix(REST.armL, HIP, smooth(lms / 260)),
			headTurn: -0.85 * smooth(lms / 300), headTilt: -8, eyes: 'closed', lean: -4, browL: 0.5, browR: 0.5,
		});
	},

	/** Z / D / R hit poses snapping on each stamp time (p.hits, ms from segment start). */
	zdrHits: ({lms, p}) => {
		const hits = p.hits as number[];
		let k = -1;
		for (let i = 0; i < hits.length; i++) if (lms >= hits[i]) k = i;
		const since = k >= 0 ? lms - hits[k] : 0, bump = Math.exp(-since / 80);
		const poses: PartialPose[] = [
			{armR: {a: 126, b: 0, hand: 'open', front: true}, armL: {a: 40, b: 0, hand: 'open'}, lean: 8, headTilt: 10},
			{armR: HIP, armL: HIP, lean: -6, headTilt: -8, drop: 20},
			{armR: {a: 118, b: 40, hand: 'point', front: true}, armL: HIP, legR: {lift: 34}, lean: 4, headTilt: 6},
		];
		// Snap into each hit over ~70 ms rather than in one frame.
		const cur = pose({...(poses[Math.max(0, k)] ?? {})}), prev = pose({...(poses[Math.max(0, k - 1)] ?? {})});
		const hitPose = k > 0 ? blend(prev, cur, smooth(since / 70)) : cur;
		return pose({squash: 1 + 0.12 * bump, eyes: 'wide', y: -10 * bump}, hitPose);
	},

	/** "I will forget everything between us": palms-up shrug and a no-no head shake. */
	shrugNo: ({b, lms}) => {
		const e = outBack(lms / 280), shake = Math.sin(TAU * b);
		const shrug: Partial<Arm> = {a: 50, b: 62, hand: 'open', rot: 22};
		return on(groove(b, 0.4), {armL: armMix(REST.armL, shrug, e), armR: armMix(REST.armR, shrug, e),
			headTilt: 9 * shake, headTurn: 0.3 * shake, eyes: 'closed', drop: 14, browL: 0.7, browR: 0.7});
	},

	/** "API key was never seen": talk to the hand, head turned away. */
	talkHand: ({b, lms}) => {
		const e = outBack(lms / 260);
		return on(groove(b, 0.45), {
			armR: armMix(REST.armR, {a: 84, b: 62, hand: 'open', rot: -10}, e),
			armL: armMix(REST.armL, HIP, smooth(lms / 260)),
			headTurn: -1 * smooth(lms / 300), headTilt: -10, eyes: 'closed', lean: -7, browL: 0.8, browR: 0.8,
		});
	},

	/** Crouching anticipation before the chorus. */
	build: ({lms, dur, lb}) => {
		const u = clamp01(lb / dur), shake = Math.sin(lms * 0.35) * 1.5 * u;
		return pose({drop: 10 + 44 * smooth(u), squash: 1 + 0.08 * u, x: shake, headY: 10 * u,
			armL: {a: 24 + 30 * u, b: -60 - 50 * u, hand: 'fist'}, armR: {a: 24 + 30 * u, b: -60 - 50 * u, hand: 'fist'},
			eyes: 'wide', browL: -0.8, browR: -0.8, expression: 'grin'});
	},

	/**
	 * Signature chorus move: jump with V arms on each "zero" (the second one spins), flex, then
	 * raise the roof. One continuous curve: arms ease between poses across the beat lines, the
	 * landing squat rises from zero, and a crouch loads each jump so nothing snaps on a beat.
	 */
	chorus: ({b, lb, p}) => {
		const V: Partial<Arm> = {a: 112, b: 22, hand: 'open', rot: -20, front: true};
		const flex: Partial<Arm> = {a: 90, b: 90, hand: 'fist', rot: 0, front: true};
		const roofArm = (bb: number): Partial<Arm> => ({a: 110 + 12 * onBeat(bb, 3), b: 40, hand: 'open', rot: -18, front: true});
		const AIR = 0.78;
		const phrase = (t: number): Pose => {
			const beat = Math.max(0, Math.min(3, Math.floor(t))), f = t - beat, jump = beat % 2 === 0;
			// Arms: V on jump beats, flex on the others, eased across each beat line.
			const toFlex = smooth((t - (jump ? beat : beat - 1) - 0.72) / 0.36), toV = smooth((t - (jump ? beat - 1 : beat) - 0.66) / 0.34);
			const arm = jump ? armMix(armMix(flex, V, beat === 0 ? 1 : toV), flex, toFlex * (f > 0.5 ? 1 : 0)) : armMix(armMix(V, flex, smooth((f + 0.28) / 0.36)), V, toV);
			const u = jump ? clamp01(f / AIR) : 1, y = jump ? -104 * Math.sin(Math.PI * u) : 0;
			// Landing squat: rises from zero, peaks 0.12 beats after touchdown, decays into the next beat.
			const since = jump ? f - AIR : f + 1 - AIR, land = since > 0 ? (since / 0.12) * Math.exp(1 - since / 0.12) : 0;
			const load = jump ? (beat === 0 ? 0 : 1) * (1 - smooth(f / 0.14)) : smooth((f - 0.55) / 0.4);
			const stretch = jump ? 0.08 * Math.sin(Math.PI * u) * Math.abs(Math.cos(Math.PI * u)) + 0.03 * Math.sin(Math.PI * u) : 0;
			const kick = 18 * smooth(-y / 50);
			return pose({
				y, armL: arm, armR: arm, legL: {lift: kick, x: 8 * Math.sin(Math.PI * u)}, legR: {lift: kick, x: 8 * Math.sin(Math.PI * u)},
				spin: beat === 2 && p.spin ? smooth(u) : 0,
				squash: (1 - stretch) * (1 + 0.14 * land + 0.05 * load), drop: 6 + 24 * land + 24 * load,
				lean: jump ? (beat === 2 ? -4 : 3) * Math.sin(Math.PI * u) : 0, headY: -8 * Math.sin(Math.PI * u),
				headTilt: jump ? 0 : 8 * Math.sin(Math.PI * f), eyes: jump && u < 1 ? 'happy' : 'wide', expression: 'grin',
				browL: jump ? 0 : -0.6, browR: jump ? 0 : -0.6,
			});
		};
		const roof = on(groove(b, 0.9), {x: 24 * sq(b, 1.6), armL: roofArm(b), armR: roofArm(b), eyes: 'happy', expression: 'grin',
			legL: {lift: 16 * Math.max(0, -Math.cos(Math.PI * (b - 0.5)))}, legR: {lift: 16 * Math.max(0, Math.cos(Math.PI * (b - 0.5)))}});
		if (lb < 3.6) return phrase(lb);
		return blend(phrase(Math.min(lb, 3.999)), roof, smooth((lb - 3.6) / 0.6));
	},

	/** Arms crossed in an X: "We are through!" */
	crossX: ({b, lms}) => {
		const e = outBack(lms / 220), X: Partial<Arm> = {a: 36, b: -128, hand: 'fist', front: true};
		return on(groove(b, 0.4), {armL: armMix(REST.armL, X, e), armR: armMix(REST.armR, X, e),
			headTilt: 8 * Math.sin(TAU * b), eyes: 'closed', lean: -3, browL: 0.4, browR: 0.4});
	},

	/** Pop-lock robot: held angular poses snapping on every beat. */
	robot: ({b}) => {
		const {i, t} = snapStep(b);
		const P: PartialPose[] = [
			{armL: {a: 90, b: 90}, armR: {a: 90, b: -90}, headTilt: 10, x: -10},
			{armL: {a: 90, b: -90}, armR: {a: 90, b: 90}, headTilt: -10, x: 10},
			{armL: {a: 90, b: 90}, armR: {a: 90, b: 90}, headTilt: 0, x: 0},
			{armL: {a: 4, b: 90}, armR: {a: 4, b: 90}, headTilt: 6, x: 0},
		];
		const a = pose({...P[(i + 3) % 4], drop: 8}), c = pose({...P[i % 4], drop: 8});
		const out = pose({}, a);
		const mixArm = (x: Arm, y: Arm): Arm => ({...y, a: lerp(x.a, y.a, t), b: lerp(x.b, y.b, t), hand: 'open', rot: -20, front: true});
		return pose({armL: mixArm(a.armL, c.armL), armR: mixArm(a.armR, c.armR), headTilt: lerp(a.headTilt, c.headTilt, t), x: lerp(a.x, c.x, t),
			drop: 8 + 6 * (1 - t), eyes: 'open', expression: 'flat', lookX: 0}, out);
	},

	/** "I'm cutting the cord": scissor fingers snipping. */
	scissor: ({b, lms}) => {
		const e = outBack(lms / 240);
		return on(groove(b, 0.5), {
			armR: armMix(REST.armR, {a: 104, b: -24, hand: 'peace', rot: 0}, e),
			armL: armMix(REST.armL, HIP, smooth(lms / 240)),
			snip: 0.5 + 0.5 * Math.cos(TAU * 2 * b), eyes: 'wink', headTilt: 8, lookX: 0.6,
		});
	},

	/** Umpire "safe" sweep: arms cross at the chest, then sweep out flat on the beat. */
	safe: ({b, lb}) => {
		const phase = lb % 2, crossT = smooth(phase / 0.25), outT = smooth((phase - 1) / 0.2);
		const cross: Partial<Arm> = {a: 34, b: -120, hand: 'fist', rot: 0, front: true};
		const flat: Partial<Arm> = {a: 92, b: 0, hand: 'open', rot: -26};
		const arm = phase < 1 ? armMix(flat, cross, crossT) : armMix(cross, flat, outT);
		return on(groove(b, 0.5), {armL: arm, armR: arm, drop: 10 + 14 * outT * (phase >= 1 ? 1 : 0), eyes: phase >= 1 ? 'closed' : 'open', headTilt: phase >= 1 ? -6 : 4});
	},

	/** "Who are you?": hand at the chin, head tilted. */
	think: ({b, lms}) => {
		const e = outBack(lms / 280);
		return on(groove(b, 0.3), {
			armR: armMix(REST.armR, {a: 80, b: 142, hand: 'fist', front: true}, e),
			armL: armMix(REST.armL, {a: 14, b: -104, hand: 'fist', front: true}, e),
			headTilt: 13 * e, lookY: -0.7, lookX: 0.6, browR: 1, browL: -0.2, eyes: 'open', expression: 'o',
		});
	},

	byeBye: ({b, lb, lms}) => {
		const e = outBack(lms / 280), w = Math.sin(TAU * lb);
		const wave = (sgn: number): Partial<Arm> => ({a: 112 + 12 * w * sgn, b: 22 + 14 * w * sgn, hand: 'open', rot: -6 + 20 * w * sgn, front: true});
		return on(groove(b, 0.6), {armL: armMix(REST.armL, wave(1), e), armR: armMix(REST.armR, wave(-1), e), eyes: 'happy', expression: 'grin', blush: 0.6});
	},

	/**
	 * Instrumental freestyle (51.5-56.9 s): spin, body roll, running man, then a pointing hit.
	 * Parts are functions of time that keep running past their slot, so each one cross-fades
	 * into the next over half a beat instead of cutting.
	 */
	freestyle: ({b, lb}) => {
		const parts: [number, (t: number) => Pose][] = [
			[2.2, t => {
				// Spin with arms out, hop, then settle into the groove with arms coming down.
				const u = smooth(t / 1.3), settle = smooth((t - 1.2) / 0.9);
				const out: Partial<Arm> = {a: 84, b: 10, hand: 'open', rot: 0, front: true};
				const down: Partial<Arm> = {a: 40, b: -30, hand: 'open', rot: 0, front: true};
				return on(groove(b, 0.6 * settle), {spin: u, y: -40 * Math.sin(Math.PI * clamp01(t / 1.3)),
					armL: armMix(out, down, settle), armR: armMix(out, down, settle), eyes: 'happy', expression: 'grin'});
			}],
			[4, () => {
				// Body roll: arms flow up and down in a wave, one side trailing the other.
				const ph = Math.PI * (b - 0.25), s1 = Math.sin(ph), s2 = Math.sin(ph - 1.1);
				const arm = (w: number): Partial<Arm> => ({a: 62 + 30 * w, b: 20 - 34 * w, hand: 'open', rot: 8 * w, front: true});
				return on(groove(b, 0.7), {armL: arm(s1), armR: arm(-s2), x: 22 * s1, lean: 6 * s1, headTilt: -7 * Math.sin(ph - 0.5),
					drop: 12 + 10 * (1 - Math.cos(2 * ph)) / 2, eyes: 'happy', expression: 'grin', blush: 0.4});
			}],
			[4, () => {
				const s1 = Math.sin(Math.PI * b);
				return on(groove(b, 0.8), {legL: {lift: 38 * Math.max(0, s1) ** 1.5, x: -10 * s1}, legR: {lift: 38 * Math.max(0, -s1) ** 1.5, x: 10 * s1},
					armL: {a: 40 + 30 * s1, b: -96, hand: 'fist', front: true}, armR: {a: 40 - 30 * s1, b: -96, hand: 'fist', front: true}, eyes: 'open', expression: 'grin'});
			}],
			[99, t => {
				const k = Math.exp(-t * 3), up = outBack(t / 0.5);
				return on(groove(b, 0.6), {armR: armMix({a: 40, b: -96, hand: 'fist', front: true}, {a: 118, b: 36, hand: 'point', rot: 0, front: true}, up),
					armL: armMix({a: 40, b: -96, hand: 'fist', front: true}, {...HIP, front: true}, up), squash: 1 + 0.08 * k, legR: {lift: 16 * k}, eyes: 'happy', expression: 'grin'});
			}],
		];
		const XF = 0.5;
		let t0 = 0, i = 0;
		while (i < parts.length - 1 && lb >= t0 + parts[i][0]) {t0 += parts[i][0]; i++;}
		const cur = parts[i][1](lb - t0);
		if (i === 0 || lb - t0 >= XF) return cur;
		const prevStart = t0 - parts[i - 1][0];
		return blend(parts[i - 1][1](lb - prevStart), cur, smooth((lb - t0) / XF));
	},

	/** "Status: Task completed.": finger guns turn into a proud double thumbs-up, a little hop,
	 * then a slow, satisfied sway over two bars (no repeated per-beat pumping). */
	thumbsUp: ({lms}) => {
		const e = outBack(lms / 420), hop = Math.sin(Math.PI * clamp01((lms - 120) / 380));
		const ph = TAU * lms / 2600, sway = Math.sin(ph) * smooth((lms - 400) / 500);
		const T = (w: number): Partial<Arm> => ({a: 46 + 4 * w, b: 64, hand: 'thumb', rot: 0, front: true});
		return pose({armL: armMix(REST.armL, T(-sway), e), armR: armMix(REST.armR, T(sway), e),
			y: -24 * hop, squash: 1 + 0.06 * Math.max(0, -Math.cos(Math.PI * clamp01((lms - 120) / 380))), drop: 10 + 4 * (1 - Math.cos(2 * ph)) / 2,
			x: 12 * sway, lean: 4 * sway, headTilt: 7 * Math.sin(ph - 0.6) * e, eyes: 'happy', expression: 'grin', blush: 0.6});
	},

	/** Band gone quiet: a glance to one side, a hold, a glance to the other, as if wondering. */
	lookAround: ({ms, lms}) => {
		const look = smooth(lms / 320) - 2 * smooth((lms - 760) / 380);
		return pose({drop: 8 + 3 * Math.sin(TAU * ms / 2600), lookX: 0.8 * look, headTurn: 0.3 * look, headTilt: 5 * look, eyes: 'open', expression: 'flat',
			armL: {a: 12, b: -10, hand: 'open'}, armR: {a: 12, b: -10, hand: 'open'}, lean: 2 * look});
	},

	/** "I'm sorry…": sheepish scratch behind the head, eyes squeezed shut, brows up, blushing. */
	sorry: ({ms, lms}) => {
		const e = outBack(lms / 320), scratch = Math.sin(TAU * ms / 260);
		return pose({
			armR: armMix(REST.armR, {a: 128 + 5 * scratch, b: 58, hand: 'fist', rot: 10, front: true}, e),
			armL: armMix(REST.armL, {a: 18, b: -30, hand: 'fist'}, e),
			headTilt: -10 * e, lean: -3 * e, drop: 12, eyes: 'closed', browL: 0.9, browR: 0.9, blush: 0.9, expression: 'smile',
		});
	},

	/** "Who were you again?": palms-up shrug, head tilted, looking up as if trying to remember. */
	confused: ({ms, lms}) => {
		const e = outBack(lms / 320), shrug: Partial<Arm> = {a: 48, b: 60, hand: 'open', rot: 20};
		return pose({armL: armMix(REST.armL, shrug, e), armR: armMix(REST.armR, shrug, e), headTilt: 14 * e + 2 * Math.sin(TAU * ms / 1400),
			eyes: 'open', lookX: 0.7, lookY: -0.8, browL: 0.9, browR: -0.3, drop: 14, squash: 1.02, expression: 'o'});
	},

	/**
	 * The band drops out after the last chorus and only sparse ticks remain, so this is a
	 * deliberate, time-based bit rather than beat-locked dancing: a spin out of the chorus into
	 * finger guns at the viewer, two "pew" recoils with a wink, then a relaxed lean that sets up
	 * the thumbs-up on "Status".
	 */
	outroGlide: ({lms}) => {
		const spinT = clamp01(lms / 520), spin = smooth(spinT);
		const land = lms > 520 ? Math.exp(-(lms - 520) / 110) : 0;
		const aim = outBack((lms - 380) / 260);
		const pew = (t0: number) => {const u = (lms - t0) / 1000; return u > 0 ? Math.exp(-u * 14) * Math.min(1, u * 60) : 0;};
		const kick = pew(1000) + 0.8 * pew(1450);
		const gun = (lift: number): Partial<Arm> => ({a: 84 + 14 * kick + lift, b: 4 + 8 * kick, hand: 'point', rot: 0, front: true});
		const up: Partial<Arm> = {a: 110, b: 40, hand: 'open', rot: -20, front: true};
		const breathe = Math.sin(TAU * lms / 1400) * smooth((lms - 700) / 400);
		return pose({
			spin, y: -34 * Math.sin(Math.PI * spinT), squash: 1 + 0.12 * land, drop: 10 + 22 * land + 3 * breathe,
			armL: armMix(up, gun(-6), aim), armR: armMix(up, gun(0), aim),
			lean: -4 * aim + 1.5 * breathe - 3 * kick, headTilt: 9 * aim + 2 * breathe, headY: -3 * kick,
			legR: {x: 14 * aim, lift: 0},
			eyes: lms < 520 ? 'happy' : lms > 950 ? 'wink' : 'open', expression: lms > 950 ? 'grin' : 'smile', lookX: 0.25, blush: 0.4,
		});
	},

	/**
	 * End card: Luca whips a shield out from behind his back and blocks a volley of cyber attacks
	 * (timed by SHIELD_HITS, drawn in Effects), recoiling a little on each, then a victory wave.
	 */
	shieldUp: ({lms}) => {
		const reach = smooth(lms / 300), out = outBack((lms - 300) / 360);
		const behind: Partial<Arm> = {a: 24, b: -6, hand: 'fist', rot: 0, front: false};
		const guard: Partial<Arm> = {a: 82, b: 14, hand: 'fist', rot: 0, front: true};
		let recoil = 0;
		for (const h of SHIELD_HITS) {const t = (lms - h) / 45; if (t > 0) recoil += 0.8 * t * Math.exp(1 - t) * (h === SHIELD_HITS[SHIELD_HITS.length - 1] ? 1.5 : 1);}
		const brace = smooth((lms - 450) / 300) * (1 - smooth((lms - VICTORY_MS) / 400));
		const win = smooth((lms - VICTORY_MS) / 380), w = Math.sin(TAU * (lms - VICTORY_MS) / 520) * win;
		const lastHit = SHIELD_HITS.reduce((m, h) => lms >= h ? h : m, -1e9);
		const flinch = lms - lastHit < 130;
		return pose({
			armL: armMix(armMix(REST.armL, behind, reach), guard, out),
			armR: armMix(armMix(REST.armR, {a: 30, b: -70, hand: 'fist', rot: 0, front: true}, brace), {a: 118 + 10 * w, b: 30 + 12 * w, hand: 'open', rot: -6 + 16 * w, front: true}, win),
			// Attacks come from screen left: he braces into them and is nudged right on each hit.
			x: 12 * recoil - 6 * reach * (1 - out), lean: 4 * recoil - 5 * brace + 3 * reach * (1 - out), drop: 10 + 14 * brace + 8 * recoil, squash: 1 + 0.04 * recoil,
			headTilt: -6 * brace + 8 * win, lookX: -0.7 * brace + 0.3 * win, legL: {x: 14 * brace, lift: 0}, legR: {x: 6 * brace, lift: 0},
			eyes: flinch && lms < VICTORY_MS ? 'closed' : win > 0.5 ? (lms - VICTORY_MS > 700 ? 'wink' : 'happy') : 'open',
			browL: -0.6 * brace, browR: -0.6 * brace, expression: brace > 0.5 ? 'grin' : 'smile', blush: 0.4 + 0.3 * win,
		});
	},
};
