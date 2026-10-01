import {describe, expect, it} from 'vitest';
import {videoPoseAt} from './videoPose';
import {numericDistance} from './pose';
import {CUTS, videoMsAt, songMsAt, FPS, VIDEO_TOTAL_MS} from '../timing';
import {segmentAt} from './choreography';

describe('video-time pose', () => {
	it('does not jump at the song cuts', () => {
		for (const [a] of CUTS) {
			const v = videoMsAt(a), f = 1000 / FPS;
			expect(numericDistance(videoPoseAt(v - f), videoPoseAt(v + f))).toBeLessThan(24);
		}
	});

	it('moves without snapping: no joint changes speed abruptly between frames', () => {
		// Second difference per frame across every numeric field (spin excluded: turns are meant to be quick).
		// Deliberate hits (Z-D-R stamps, the intro landing, robot pops) may be sharper.
		const HITS = new Set(['zdrHits', 'intro', 'robot']);
		const flat = (o: object): number[] => Object.entries(o).flatMap(([k, x]) => k === 'spin' ? [] : typeof x === 'number' ? [x] : typeof x === 'object' ? flat(x) : []);
		const f = 1000 / FPS;
		for (let v = f; v < VIDEO_TOTAL_MS - f; v += 2 * f) {
			const A = flat(videoPoseAt(v - f)), B = flat(videoPoseAt(v)), C = flat(videoPoseAt(v + f));
			let jerk = 0;
			for (let i = 0; i < A.length; i++) jerk = Math.max(jerk, Math.abs(A[i] - 2 * B[i] + C[i]));
			const move = segmentAt(songMsAt(v)).move;
			expect(jerk, `${move} @ ${(v / 1000).toFixed(2)} s`).toBeLessThan(HITS.has(move) ? 12 : 6);
		}
	}, 600000);
});
