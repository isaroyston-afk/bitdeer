export type Hand = 'fist' | 'open' | 'point' | 'thumb' | 'peace' | 'shaka';
export type Eyes = 'open' | 'happy' | 'wink' | 'closed' | 'wide';
export type Expression = 'smile' | 'grin' | 'o' | 'flat';

/**
 * Arm angles in degrees, mirrored per side. a raises the upper arm: 0 hangs down,
 * 90 points straight out, 180 points up. b bends the elbow in the same direction;
 * negative b folds the forearm inwards across the body.
 */
export type Arm = {a: number; b: number; hand: Hand; rot: number; front: boolean};
/** Foot offset from its rest spot: x outwards (mirrored), lift upwards. */
export type Leg = {x: number; lift: number};

export type Pose = {
	x: number; y: number; squash: number; lean: number; drop: number; spin: number; scale: number;
	headTilt: number; headY: number; headTurn: number;
	armL: Arm; armR: Arm; legL: Leg; legR: Leg;
	eyes: Eyes; lookX: number; lookY: number; browL: number; browR: number;
	expression: Expression; blush: number;
	/** 0..1 finger spread for the peace/scissor hand. */
	snip: number;
};

export type PartialPose = Partial<Omit<Pose, 'armL' | 'armR' | 'legL' | 'legR'>> & {
	armL?: Partial<Arm>; armR?: Partial<Arm>; legL?: Partial<Leg>; legR?: Partial<Leg>;
};

const ARM: Arm = {a: 14, b: -12, hand: 'fist', rot: 0, front: false};
export const REST: Pose = {
	x: 0, y: 0, squash: 1, lean: 0, drop: 6, spin: 0, scale: 1,
	headTilt: 0, headY: 0, headTurn: 0,
	armL: ARM, armR: ARM, legL: {x: 0, lift: 0}, legR: {x: 0, lift: 0},
	eyes: 'open', lookX: 0, lookY: 0, browL: 0, browR: 0,
	expression: 'smile', blush: 0.25, snip: 0,
};

export const pose = (p: PartialPose, base: Pose = REST): Pose => ({
	...base, ...p,
	armL: {...base.armL, ...p.armL}, armR: {...base.armR, ...p.armR},
	legL: {...base.legL, ...p.legL}, legR: {...base.legR, ...p.legR},
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixObj = <T extends Record<string, unknown>>(a: T, b: T, t: number): T => {
	const out: Record<string, unknown> = {};
	for (const k of Object.keys(a)) {
		const va = a[k], vb = b[k];
		// spin is in turns, so 1 and 0 are the same facing: blend the short way round, never through a half turn.
		out[k] = k === 'spin' ? (va as number) + ((vb as number) - (va as number) - Math.round((vb as number) - (va as number))) * t :
			typeof va === 'number' ? lerp(va, vb as number, t) : typeof va === 'object' ? mixObj(va as Record<string, unknown>, vb as Record<string, unknown>, t) : t < 0.5 ? va : vb;
	}
	return out as T;
};

export const blend = (a: Pose, b: Pose, t: number): Pose => t <= 0 ? a : t >= 1 ? b : mixObj(a, b, t);

/** Largest absolute difference across all numeric fields (degrees or design units). */
export const numericDistance = (a: Pose, b: Pose): number => {
	let max = 0;
	const walk = (x: Record<string, unknown>, y: Record<string, unknown>) => {
		for (const k of Object.keys(x)) {
			if (typeof x[k] === 'number') max = Math.max(max, Math.abs((x[k] as number) - (y[k] as number)));
			else if (typeof x[k] === 'object') walk(x[k] as Record<string, unknown>, y[k] as Record<string, unknown>);
		}
	};
	walk(a, b);
	return max;
};
