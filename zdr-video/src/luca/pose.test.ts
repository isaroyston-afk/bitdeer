import {describe, expect, it} from 'vitest';
import {REST, blend, pose, numericDistance} from './pose';

describe('pose', () => {
	const a = pose({x: 0, lean: 0, armL: {a: 10, b: 0, hand: 'fist'}, eyes: 'open'});
	const b = pose({x: 100, lean: 20, armL: {a: 170, b: 40, hand: 'open'}, eyes: 'happy'});

	it('fills unspecified fields from REST', () => {
		expect(a.armR).toEqual(REST.armR);
		expect(a.squash).toBe(REST.squash);
	});

	it('returns the endpoints at t = 0 and t = 1', () => {
		expect(blend(a, b, 0)).toEqual(a);
		expect(blend(a, b, 1)).toEqual(b);
	});

	it('interpolates numbers and switches discrete fields at the midpoint', () => {
		const m = blend(a, b, 0.25);
		expect(m.x).toBeCloseTo(25);
		expect(m.armL.a).toBeCloseTo(50);
		expect(m.armL.hand).toBe('fist');
		expect(m.eyes).toBe('open');
		expect(blend(a, b, 0.75).armL.hand).toBe('open');
	});

	it('measures the largest numeric difference', () => {
		expect(numericDistance(a, b)).toBe(160);
		expect(numericDistance(a, a)).toBe(0);
	});

	it('blends spin the short way round, so a finished turn never flashes a half turn', () => {
		const a = pose({spin: 1}), b = pose({spin: 0});
		for (const t of [0.25, 0.5, 0.75]) expect(Math.cos(2 * Math.PI * blend(a, b, t).spin)).toBeCloseTo(1, 6);
	});
});
