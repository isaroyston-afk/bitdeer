import {describe, expect, it} from 'vitest';
import {DISPLAY_LINES, STAMPS} from './lyricsData';

describe('lyric display data', () => {
	it('keeps ad-libs out of the lyric lines', () => {
		for (const l of DISPLAY_LINES) for (const w of l.words) expect(w.text).not.toMatch(/[()]/);
		for (const l of DISPLAY_LINES) expect(l.text).not.toMatch(/^[ZDR]—/);
	});

	it('turns the Z-D-R lines into six letter stamps', () => {
		expect(STAMPS.map(s => s.letter).join('')).toBe('ZDRZDR');
		for (let i = 1; i < STAMPS.length; i++) expect(STAMPS[i].ms).toBeGreaterThan(STAMPS[i - 1].ms);
	});

	it('matches the original lyrics: a single "Zero", no ad-libs', () => {
		const texts = DISPLAY_LINES.map(l => l.text);
		expect(texts.filter(t => /zero/i.test(t))).toEqual(Array(5).fill('Zero data retention!'));
		for (const t of texts) expect(t).not.toMatch(/\b(hey|uh)\b/i);
		expect(texts[0]).toBe('Tokens in, tokens out!');
	});

	it('drops the garbled brand reprises removed by the song edit', () => {
		expect(DISPLAY_LINES.filter(l => /Bitdeer/.test(l.text))).toHaveLength(1);
		const i = DISPLAY_LINES.findIndex(l => /^Status/.test(l.text));
		expect(DISPLAY_LINES[i - 1].text).toBe('Zero data retention!');
	});

	it('keeps every sung word, in order', () => {
		const words = DISPLAY_LINES.flatMap(l => l.words.map(w => w.text.trim()));
		expect(words.slice(0, 4)).toEqual(['Tokens', 'in,', 'tokens', 'out!']);
		expect(words[words.length - 1]).toBe('again?');
		expect(words).toContain('Bye-bye');
		for (let i = 1; i < DISPLAY_LINES.length; i++) expect(DISPLAY_LINES[i].startMs).toBeGreaterThan(DISPLAY_LINES[i - 1].startMs);
	});
});
