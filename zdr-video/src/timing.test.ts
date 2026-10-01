import {describe, expect, it} from 'vitest';
import {AUDIO_MS, BEATS, TOTAL_FRAMES, beatAt, msAtBeat, isDownbeat, barPhase, FPS, END_CARD_MS, CUTS, CUT_MS, PIECES, songMsAt, videoMsAt, VIDEO_TOTAL_MS, INTRO_MS} from './timing';

describe('timing', () => {
	it('maps beat times to integer beat positions', () => {
		expect(beatAt(BEATS[5])).toBeCloseTo(5, 6);
		expect(beatAt(BEATS[100])).toBeCloseTo(100, 6);
	});

	it('interpolates between beats and inverts', () => {
		for (const ms of [0, 1234, 29420, 51500, 80000, 82500]) expect(msAtBeat(beatAt(ms))).toBeCloseTo(ms, 3);
	});

	it('is monotonic across the whole video, including the end card', () => {
		let prev = -Infinity;
		for (let f = 0; f < TOTAL_FRAMES; f++) {
			const b = beatAt(songMsAt(f / FPS * 1000));
			expect(b).toBeGreaterThan(prev);
			prev = b;
		}
	});

	it('marks one beat in four as a downbeat', () => {
		const downs = BEATS.map((_, i) => isDownbeat(i)).filter(Boolean).length;
		expect(Math.abs(downs - BEATS.length / 4)).toBeLessThanOrEqual(1);
	});
});

describe('song edit', () => {
	it('cuts whole bars, starting on a downbeat, from the last chorus to the outro', () => {
		// After "Zero, zero data retention!" (ends 59.2 s) to the band drop before "Status" (75.0 s).
		const wanted = [[59200, 75000]];
		expect(CUTS).toHaveLength(1);
		CUTS.forEach(([a, b], i) => {
			expect(barPhase(beatAt(a))).toBeCloseTo(0, 5);
			expect((beatAt(b) - beatAt(a)) % 4).toBeCloseTo(0, 5);
			expect(a).toBeGreaterThan(wanted[i][0] - 150);
			expect(b).toBeLessThan(wanted[i][1]);
		});
	});

	it('starts the song after the title screen, plays it unchanged until the first cut, and skips each cut', () => {
		expect(songMsAt(INTRO_MS)).toBe(0);
		expect(songMsAt(INTRO_MS + 1000)).toBe(1000);
		const [a, b] = CUTS[0];
		expect(songMsAt(videoMsAt(a - 1))).toBeCloseTo(a - 1);
		expect(songMsAt(videoMsAt(a) + 1)).toBeCloseTo(b + 1);
	});

	it('round-trips video time', () => {
		for (let v = 0; v < VIDEO_TOTAL_MS; v += 777) expect(videoMsAt(songMsAt(v))).toBeCloseTo(v, 6);
	});

	it('describes contiguous audio pieces that add up to the edited song', () => {
		expect(PIECES[0]).toMatchObject({songStart: 0, videoStart: INTRO_MS});
		for (let i = 1; i < PIECES.length; i++) expect(PIECES[i].videoStart).toBeCloseTo(PIECES[i - 1].videoStart + PIECES[i - 1].songEnd - PIECES[i - 1].songStart);
		const last = PIECES[PIECES.length - 1];
		expect(last.songEnd).toBe(AUDIO_MS);
		expect(last.videoStart + last.songEnd - last.songStart).toBeCloseTo(INTRO_MS + AUDIO_MS - CUT_MS);
	});

	it('runs for the title screen, the edited song and the end card', () => {
		expect(TOTAL_FRAMES).toBe(Math.ceil((INTRO_MS + AUDIO_MS - CUT_MS + END_CARD_MS) / 1000 * FPS));
	});
});
