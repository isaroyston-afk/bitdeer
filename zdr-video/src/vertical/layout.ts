// Design coordinates for the 1080 x 1920 frame (rendered at --scale=2 for 2160 x 3840).
// Safe zone is the strictest combination of TikTok, Reels and Shorts overlays.
export const W = 1080, H = 1920;

export const SAFE = {
	top: 220,          // platform header / tabs
	bottom: 1500,      // captions, handle, music ticker
	left: 60,
	buttonsLeft: 940,  // right-hand like / comment / share column
	buttonsTop: 880,   // the column starts about here
};

export const HEADER = {y: 292, width: 560, height: 86, labelY: 378};

export const LYRIC = {top: 430, bottom: 870, left: 60, right: 1020, centerY: 662, spacing: 176};

/** Luca stands on the stage floor; 1000 puppet units tall at scale 1. */
export const LUCA = {x: 540, groundY: 1560, scale: 0.64, halfWidth: 230, faceY: 1560 - 625 * 0.64};

export const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

// Conservative advance widths for Inter ExtraBold, in em.
const NARROW = /[iljI!.,:;’'|]/;
export const estimateWidth = (text: string, size: number) => {
	let w = 0;
	for (const ch of text) w += ch === ' ' ? 0.26 : NARROW.test(ch) ? 0.3 : /[MWmw]/.test(ch) ? 0.86 : /[A-Z0-9?]/.test(ch) ? 0.7 : 0.58;
	return w * size;
};

/** Largest size (64-104 px) at which the line fits in one row, or two balanced rows. */
export const fitLine = (text: string, maxWidth = LYRIC.right - LYRIC.left) => {
	const words = text.split(' ');
	for (let size = 104; size >= 64; size -= 2) {
		if (estimateWidth(text, size) <= maxWidth) return {size, rows: [text]};
		let best: string[] | null = null, bestW = Infinity;
		for (let k = 1; k < words.length; k++) {
			const rows = [words.slice(0, k).join(' '), words.slice(k).join(' ')];
			const w = Math.max(...rows.map(r => estimateWidth(r, size)));
			if (w < bestW) {bestW = w; best = rows;}
		}
		// A one-word overflow row looks orphaned; prefer shrinking a little first.
		if (best && bestW <= maxWidth && (size <= 88 || best.every(r => r.split(' ').length > 1))) return {size, rows: best};
	}
	return {size: 64, rows: [text]};
};
