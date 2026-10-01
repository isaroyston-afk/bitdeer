import {describe, expect, it} from 'vitest';
import {SEGMENTS, poseAt, movePoseAt} from './choreography';
import {MOVES} from './moves';
import {numericDistance} from './pose';
import {TOTAL_MS, FPS} from '../timing';

const frameMs = 1000 / FPS;

describe('choreography', () => {
	it('starts at 0 and runs contiguously past the end of the video', () => {
		expect(SEGMENTS[0].start).toBe(0);
		for (let i = 1; i < SEGMENTS.length; i++) expect(SEGMENTS[i].start).toBe(SEGMENTS[i - 1].end);
		expect(SEGMENTS[SEGMENTS.length - 1].end).toBeGreaterThanOrEqual(TOTAL_MS);
	});

	it('only uses moves that exist', () => {
		for (const s of SEGMENTS) expect(MOVES[s.move], s.move).toBeTypeOf('function');
	});

	it('has no zero-length or negative segments', () => {
		for (const s of SEGMENTS) expect(s.end).toBeGreaterThan(s.start);
	});

	it('does not jump at move boundaries beyond the outgoing move\'s own motion', () => {
		SEGMENTS.slice(1).forEach((s, k) => {
			const prev = SEGMENTS[k];
			const jump = numericDistance(poseAt(s.start - frameMs), poseAt(s.start + frameMs));
			const own = numericDistance(movePoseAt(prev, s.start - frameMs), movePoseAt(prev, s.start + frameMs));
			expect(jump, `${s.move} @ ${s.start}`).toBeLessThan(24 + own);
		});
	});

	it('produces a finite pose for every frame', () => {
		for (let ms = 0; ms < TOTAL_MS; ms += frameMs) {
			const p = poseAt(ms);
			for (const v of [p.x, p.y, p.squash, p.lean, p.drop, p.armL.a, p.armR.b, p.legL.lift, p.headTilt]) expect(Number.isFinite(v)).toBe(true);
		}
	});
});
