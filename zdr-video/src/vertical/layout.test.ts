import {describe, expect, it} from 'vitest';
import {fitLine, SAFE, LYRIC, LUCA, estimateWidth, HEADER} from './layout';
import {DISPLAY_LINES} from './lyricsData';

describe('layout', () => {
	it('keeps the lyric zone inside the safe area', () => {
		expect(LYRIC.top).toBeGreaterThanOrEqual(SAFE.top);
		expect(LYRIC.bottom).toBeLessThanOrEqual(SAFE.buttonsTop);
		expect(LYRIC.left).toBeGreaterThanOrEqual(SAFE.left);
		expect(LYRIC.right).toBeLessThanOrEqual(1080 - SAFE.left);
	});

	it('keeps the header clear of the top platform band', () => {
		expect(HEADER.y - HEADER.height / 2).toBeGreaterThanOrEqual(SAFE.top);
	});

	it('keeps Luca clear of the button column and his face above the captions', () => {
		expect(LUCA.x + LUCA.halfWidth).toBeLessThanOrEqual(SAFE.buttonsLeft);
		expect(LUCA.faceY).toBeLessThanOrEqual(SAFE.bottom - 50);
	});

	it('fits every lyric line in at most two rows at a readable size', () => {
		for (const l of DISPLAY_LINES) {
			const fit = fitLine(l.text);
			expect(fit.rows.length, l.text).toBeLessThanOrEqual(2);
			expect(fit.size, l.text).toBeGreaterThanOrEqual(64);
			for (const r of fit.rows) expect(estimateWidth(r, fit.size), r).toBeLessThanOrEqual(LYRIC.right - LYRIC.left);
		}
	});

});
