import {describe, expect, it} from 'vitest';
import {syllables, mouthAt, WORDS} from './lipsync';

describe('syllables', () => {
	it('drops a silent final e', () => {
		expect(syllables('done!')).toEqual(['OH']);
		expect(syllables('gone')).toEqual(['OH']);
	});

	it('counts vowel groups', () => {
		expect(syllables('retention!')).toHaveLength(3);
		expect(syllables('remember')).toHaveLength(3);
		expect(syllables('Zero,')).toEqual(['EE', 'OH']);
	});

	it('spells out acronyms from the dictionary', () => {
		expect(syllables('GPU')).toEqual(['EE', 'EE', 'OO']);
		expect(syllables('API')).toEqual(['EE', 'EE', 'AH']);
	});

	it('treats parenthesised ad-libs as shouts', () => {
		expect(syllables('(Hey!)')).toEqual(['SHOUT']);
	});

	it('always returns at least one syllable', () => {
		for (const w of WORDS) expect(syllables(w.text).length).toBeGreaterThan(0);
	});
});

describe('mouthAt', () => {
	it('is closed in the long instrumental gap', () => {
		expect(mouthAt(54000, 0.8).open).toBe(0);
	});

	it('opens in the middle of a sung word', () => {
		// "heart" 3260-3720
		expect(mouthAt(3490, 0.6).open).toBeGreaterThan(0.4);
	});

	it('closes between the syllables of a word more than at their centres', () => {
		// "retention!" 31120-32020, three syllables of 300 ms
		const mid = mouthAt(31120 + 150, 0.6).open, edge = mouthAt(31120 + 300, 0.6).open;
		expect(edge).toBeLessThan(mid);
	});

	it('opens wider with a louder vocal', () => {
		expect(mouthAt(3490, 0.9).open).toBeGreaterThan(mouthAt(3490, 0.1).open);
	});

	it('stays within 0..1.2', () => {
		for (let ms = 0; ms < 81000; ms += 7) {
			const {open} = mouthAt(ms, 1);
			expect(open).toBeGreaterThanOrEqual(0);
			expect(open).toBeLessThanOrEqual(1.2);
		}
	});
});
