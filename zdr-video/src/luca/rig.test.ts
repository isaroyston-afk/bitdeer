import {describe, expect, it} from 'vitest';
import {rig, DIM, armDir} from './rig';
import {REST, pose} from './pose';
import T from './traced.json';

describe('rig', () => {
	it('mirrors arm directions per side', () => {
		expect(armDir(90, -1, 0).x).toBeCloseTo(-1);
		expect(armDir(90, 1, 0).x).toBeCloseTo(1);
		expect(armDir(180, 1, 0).y).toBeCloseTo(-1);
	});

	it('uses the official proportions: short stub legs, head about 47% of the body', () => {
		const r = rig(REST);
		const legLen = r.legs[0].ankle.y - r.legs[0].hip.y;
		expect(legLen).toBeGreaterThan(40);
		expect(legLen).toBeLessThan(80);
		const headTop = r.head.y - 227, total = -(headTop - 143);
		expect(455 / total).toBeGreaterThan(0.44);
		expect(455 / total).toBeLessThan(0.52);
	});

	it('keeps the head overlapping the top of the hoodie', () => {
		const r = rig(REST);
		expect(r.head.y + 227).toBeGreaterThan(DIM.neckY);
	});

	it('moves everything with a jump', () => {
		const a = rig(REST), b = rig(pose({y: -100}));
		expect(b.head.y).toBeCloseTo(a.head.y - 100);
		// In the air the feet also tuck up a little and spread apart.
		expect(b.legs[0].ankle.y).toBeLessThan(a.legs[0].ankle.y - 100);
		expect(b.legs[0].ankle.y).toBeGreaterThan(a.legs[0].ankle.y - 116);
	});

	it('spreads the legs and points the toes when airborne', () => {
		const a = rig(REST), b = rig(pose({y: -100}));
		const spread = (r: typeof a) => r.legs[1].ankle.x - r.legs[0].ankle.x;
		expect(spread(b) - spread(a)).toBeGreaterThan(40);
		expect(a.legs.every(l => Math.abs(l.footRot) < 1)).toBe(true);
		expect(b.legs[1].footRot).toBeGreaterThan(5);
		expect(b.legs[0].footRot).toBeLessThan(-5);
	});

	it('keeps the shoulders inside the hoodie so the sleeves join the body', () => {
		for (const a of [0, 60, 120, 170]) {
			const r = rig(pose({armL: {a}, armR: {a}}));
			for (const arm of r.arms) expect(Math.abs(arm.shoulder.x - r.pelvis.x)).toBeLessThan(154 - 10);
		}
	});

	it('never inverts a leg when the foot lifts high', () => {
		const r = rig(pose({legL: {lift: 200}}));
		expect(r.legs[0].ankle.y).toBeGreaterThan(r.legs[0].hip.y);
	});

	it('can raise the paws beside the cheeks, clear of the head', () => {
		const r = rig(pose({armR: {a: 112, b: 22}}));
		const headHalf = 264;
		expect(r.arms[1].wrist.x - r.head.x).toBeGreaterThan(headHalf - 40);
		expect(r.arms[1].wrist.y).toBeLessThan(r.head.y + 227);
	});

	it('traced the head at 528 units wide', () => {
		expect(T.unitsPerPixel * 1092).toBeCloseTo(528, 0);
	});
});
