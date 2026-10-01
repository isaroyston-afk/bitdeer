import lines from '../scroll-lyrics.json';
import {CUTS} from '../timing';

export type DisplayWord = {text: string; startMs: number; endMs: number};
export type DisplayLine = {text: string; startMs: number; endMs: number; words: DisplayWord[]};

const isAdlib = (t: string) => /^\s*\(/.test(t) || /\)\s*$/.test(t);

/** Sung lyric lines with parenthesised ad-libs removed; Z-D-R lines become stamps. */
const adlibLine = (t: string) => /^\s*\(.*\)\s*$/.test(t);
/** Lines sung inside the song edit's cuts are never heard. */
const cutLine = (startMs: number) => CUTS.some(([a, b]) => startMs >= a && startMs < b);

export const DISPLAY_LINES: DisplayLine[] = lines
	.filter(l => !adlibLine(l.text) && !cutLine(l.startMs))
	.map(l => {
		const words: DisplayWord[] = [];
		for (const w of l.words.filter(x => !isAdlib(x.text))) {
			const prev = words[words.length - 1];
			// "Bye-" + "bye" are timed separately but read as one word.
			if (prev && prev.text.endsWith('-')) {prev.text += w.text.trim(); prev.endMs = w.endMs;}
			// The transcription hears "Zero, zero"; the original lyric is a single "Zero".
			else if (prev && /^zero,?$/i.test(prev.text) && /^zero$/i.test(w.text.trim())) {prev.text = 'Zero'; prev.endMs = w.endMs;}
			else words.push({text: w.text.trim(), startMs: w.startMs, endMs: w.endMs});
		}
		return {text: words.map(w => w.text).join(' '), startMs: words[0]?.startMs ?? l.startMs, endMs: words[words.length - 1]?.endMs ?? l.endMs, words};
	})
	.filter(l => l.words.length > 0);

/** Individual Z, D and R hits, each with the end of its line so stamps hold until then. */
export const STAMPS = lines.flatMap(l => l.words
	.filter(w => /Z—|D—|R!/.test(w.text))
	.map(w => ({letter: w.text.replace(/[^ZDR]/g, ''), ms: w.startMs, lineEndMs: l.endMs})));
