import lines from '../scroll-lyrics.json';

export type Viseme = 'AH' | 'EE' | 'OH' | 'OO' | 'SHOUT';
export type Mouth = {open: number; w: number; h: number; round: number; viseme: Viseme | null};
export type Word = {text: string; startMs: number; endMs: number};

export const WORDS: Word[] = lines.flatMap(l => l.words.map(w => ({text: w.text.trim(), startMs: w.startMs, endMs: w.endMs})));

// Mouth width, height and roundness per viseme. Height is scaled by openness.
export const VISEMES: Record<Viseme, {w: number; h: number; round: number}> = {
	AH: {w: 1, h: 1, round: 0.1},
	EE: {w: 1.2, h: 0.5, round: 0},
	OH: {w: 0.78, h: 0.9, round: 0.65},
	OO: {w: 0.52, h: 0.62, round: 1},
	SHOUT: {w: 1.15, h: 1.35, round: 0.2},
};

// Spelled-out words and names whose letters do not follow the vowel-group rule.
const DICT: Record<string, Viseme[]> = {
	gpu: ['EE', 'EE', 'OO'], api: ['EE', 'EE', 'AH'], ai: ['EE', 'AH'], bitdeer: ['EE', 'EE'],
	'z—': ['EE'], 'd—': ['EE'], 'r!)': ['AH'], '(z—': ['EE'], i: ['AH'], 'i’m': ['AH'], my: ['AH'],
	bye: ['AH'], 'bye-': ['AH'], through: ['OO'], you: ['OO'], who: ['OO'], to: ['OO'], your: ['OH'],
	know: ['OH'], now: ['AH'], are: ['AH'], were: ['EE'], the: ['EE'], we: ['EE'], me: ['EE'],
	like: ['AH'], right: ['AH'], weights: ['EE'], key: ['EE'], cache: ['EE'], saved: ['EE'],
	one: ['AH'], love: ['AH'], done: ['OH'], again: ['AH', 'EE'], sorry: ['OH', 'EE'],
};

const visemeFor = (group: string): Viseme => {
	if (group.startsWith('ou') || group.startsWith('oo') || group.startsWith('u')) return 'OO';
	if (group.startsWith('o')) return 'OH';
	if (group.startsWith('a')) return 'AH';
	return 'EE';
};

export const syllables = (raw: string): Viseme[] => {
	if (/^\(/.test(raw) && !/^\(z/i.test(raw)) return ['SHOUT'];
	const word = raw.toLowerCase().replace(/[.,!?…]+$/g, '');
	if (DICT[word]) return DICT[word];
	const letters = word.replace(/[^a-z]/g, '');
	let groups = letters.match(/[aeiouy]+/g) ?? [];
	if (groups.length > 1 && /[^aeiouy]e$/.test(letters)) groups = groups.slice(0, -1);
	return groups.length ? groups.map(visemeFor) : ['EE'];
};

const CLOSED: Mouth = {open: 0, w: 1, h: 0, round: 0, viseme: null};
const smooth = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

/** Mouth shape at a time. vocal is the 0..1 vocal-band loudness for this frame. */
export const mouthAt = (ms: number, vocal: number): Mouth => {
	const word = WORDS.find(w => ms >= w.startMs && ms < w.endMs);
	if (!word) return CLOSED;
	const syl = syllables(word.text), dur = word.endMs - word.startMs, n = syl.length;
	const sylDur = dur / n, idx = Math.min(n - 1, Math.floor((ms - word.startMs) / sylDur));
	const local = ms - word.startMs - idx * sylDur;
	// Fast attack, sustain, and a closing dip at each syllable boundary.
	const attack = Math.min(70, sylDur * 0.3), release = Math.min(90, sylDur * 0.3);
	const env = Math.min(smooth(local / attack), smooth((sylDur - local) / release) * 0.75 + 0.25 * (idx === n - 1 ? 0 : 1));
	const v = syl[idx], shape = VISEMES[v];
	const level = v === 'SHOUT' ? 1 : 0.35 + 0.75 * Math.max(0, Math.min(1, vocal));
	const open = Math.max(0, Math.min(1.2, env * level));
	return {open, w: shape.w, h: shape.h, round: shape.round, viseme: v};
};
