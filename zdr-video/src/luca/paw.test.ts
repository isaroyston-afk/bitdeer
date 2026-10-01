import {describe, expect, it} from 'vitest';
import {SEGMENTS, poseAt} from './choreography';
import {MOVES} from './moves';
import {WRIST_LIMIT} from './parts/Body';
import {TOTAL_MS} from '../timing';

describe('paws', () => {
	it('never asks for a wrist bend beyond what reads as natural', () => {
		// Hand rotation is clamped at draw time; the moves should not rely on the clamp.
		for (let ms = 0; ms < TOTAL_MS; ms += 50) {
			const p = poseAt(ms);
			for (const arm of [p.armL, p.armR]) expect(Math.abs(arm.rot), `${ms} ms`).toBeLessThanOrEqual(WRIST_LIMIT + 1e-6);
		}
	});

	it('has no remaining blank (ring-and-dot) eyes', () => {
		for (let ms = 0; ms < TOTAL_MS; ms += 50) expect(poseAt(ms).eyes).not.toBe('blank');
	});

	it('gives the sorry beat its own sheepish move', () => {
		expect(MOVES.sorry).toBeTypeOf('function');
		const s = SEGMENTS.find(x => x.move === 'sorry')!;
		expect(poseAt(s.start + 600).eyes).toBe('closed');
	});
});
