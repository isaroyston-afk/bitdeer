// Audio analysis for the vertical edition.
// Writes src/data/beats.json (tempo, beat grid, downbeat phase) and
// src/data/audio-envelope.json (per-video-frame vocal and bass loudness, 0..1).
// Run: node scripts/analyze-audio.mjs
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 60, SR = 22050, N = 1024, HOP = 256;

const wav = join(mkdtempSync(join(tmpdir(), 'zdr-')), 'mono.wav');
execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', join(root, 'public/audio.mp3'),
	'-vn', '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', wav], {cwd: root, stdio: 'inherit'});

// Minimal WAV reader: locate the data chunk and read signed 16-bit samples.
const buf = readFileSync(wav);
let off = 12, dataOff = 0, dataLen = 0;
while (off < buf.length) {
	const id = buf.toString('ascii', off, off + 4), len = buf.readUInt32LE(off + 4);
	if (id === 'data') {dataOff = off + 8; dataLen = len; break;}
	off += 8 + len;
}
const samples = new Float32Array(dataLen / 2);
for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(dataOff + i * 2) / 32768;
const durationMs = samples.length / SR * 1000;

// Iterative radix-2 FFT, magnitude spectrum per hop.
const fft = (re, im) => {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {[re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]];}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
		for (let i = 0; i < n; i += len) {
			let cr = 1, ci = 0;
			for (let k = 0; k < len / 2; k++) {
				const a = i + k, b = a + len / 2;
				const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
				re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
				const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
			}
		}
	}
};
const hann = Float32Array.from({length: N}, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
const frames = Math.floor((samples.length - N) / HOP);
const bin = hz => Math.round(hz / SR * N);
const [vLo, vHi, bLo, bHi] = [bin(300), bin(3400), bin(30), bin(150)];
const vocal = new Float32Array(frames), bass = new Float32Array(frames), flux = new Float32Array(frames);
let prev = new Float32Array(N / 2);
for (let f = 0; f < frames; f++) {
	const re = new Float32Array(N), im = new Float32Array(N);
	for (let i = 0; i < N; i++) re[i] = samples[f * HOP + i] * hann[i];
	fft(re, im);
	const mag = new Float32Array(N / 2);
	let fl = 0, v = 0, b = 0;
	for (let k = 1; k < N / 2; k++) {
		mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
		fl += Math.max(0, mag[k] - prev[k]);
		if (k >= vLo && k <= vHi) v += mag[k];
		if (k >= bLo && k <= bHi) b += mag[k];
	}
	flux[f] = fl; vocal[f] = v / (vHi - vLo + 1); bass[f] = b / (bHi - bLo + 1); prev = mag;
}
const hopMs = HOP / SR * 1000;

// Onset envelope: flux minus a local mean, half-wave rectified.
const onset = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
	let s = 0, c = 0;
	for (let k = Math.max(0, f - 8); k <= Math.min(frames - 1, f + 8); k++) {s += flux[k]; c++;}
	onset[f] = Math.max(0, flux[f] - s / c);
}

// Tempo: autocorrelation over 70-180 BPM with a mild preference around 120 BPM.
let best = {score: -Infinity, lag: 0};
for (let bpm = 70; bpm <= 180; bpm += 0.05) {
	const lag = 60000 / bpm / hopMs;
	let s = 0;
	for (let f = 0; f + lag * 4 + 1 < frames; f++) {
		const g = (x) => {const i = Math.floor(x), t = x - i; return onset[i] * (1 - t) + onset[i + 1] * t;};
		s += onset[f] * (g(f + lag) + 0.5 * g(f + 2 * lag) + 0.25 * g(f + 4 * lag));
	}
	s *= Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
	if (s > best.score) best = {score: s, lag, bpm};
}
const bpm = Math.round(best.bpm * 100) / 100, beatMs = 60000 / bpm;

// Beat tracking by dynamic programming (Ellis 2007). The tempo of this track
// drifts from about 140 to 143 BPM, so a fixed grid slides off the beat.
const period = 60000 / bpm / hopMs;
let mean = 0, sd = 0;
for (const x of onset) mean += x / frames;
for (const x of onset) sd += (x - mean) ** 2 / frames;
sd = Math.sqrt(sd);
const norm = Float32Array.from(onset, x => x / sd);
const cum = new Float32Array(frames), back = new Int32Array(frames).fill(-1);
for (let t = 0; t < frames; t++) {
	let bestScore = 0, bestPrev = -1;
	for (let p = Math.max(0, Math.round(t - 2 * period)); p <= t - Math.round(period / 2); p++) {
		const s = cum[p] - 100 * Math.log((t - p) / period) ** 2;
		if (bestPrev < 0 || s > bestScore) {bestScore = s; bestPrev = p;}
	}
	cum[t] = norm[t] + (bestPrev >= 0 ? bestScore : 0);
	back[t] = bestPrev;
}
let last = frames - 1;
for (let t = frames - 1; t > frames - 1 - period; t--) if (cum[t] > cum[last]) last = t;
const beatFrames = [];
for (let t = last; t >= 0; t = back[t]) beatFrames.unshift(t);
// Local linear fit over +-6 beats removes hop-quantisation jitter but keeps the drift.
const raw = beatFrames.map(f => f * hopMs);
const beatTimes = raw.map((_, i) => {
	const lo = Math.max(0, i - 6), hi = Math.min(raw.length - 1, i + 6);
	let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
	for (let j = lo; j <= hi; j++) {sx += j; sy += raw[j]; sxx += j * j; sxy += j * raw[j]; n++;}
	const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
	return sy / n + slope * (i - sx / n);
});
// Extend the grid back towards 0 ms at the opening period.
while (beatTimes[0] > (beatTimes[1] - beatTimes[0]) * 0.6) beatTimes.unshift(beatTimes[0] - (beatTimes[1] - beatTimes[0]));
beatFrames.length = 0;
for (const t of beatTimes) beatFrames.push(Math.max(0, Math.min(frames - 1, Math.round(t / hopMs))));

// Downbeat: which beat-in-bar gets the most bass energy and lyric line starts.
const lines = JSON.parse(readFileSync(join(root, 'src/scroll-lyrics.json'), 'utf8'));
const barScore = [0, 0, 0, 0];
beatFrames.forEach((f, i) => {barScore[i % 4] += bass[f];});
const bassMax = Math.max(...barScore);
for (let k = 0; k < 4; k++) barScore[k] /= bassMax;
for (const l of lines) {
	let near = 0;
	beatTimes.forEach((t, i) => {if (Math.abs(t - l.startMs) < Math.abs(beatTimes[near] - l.startMs)) near = i;});
	if (Math.abs(beatTimes[near] - l.startMs) < beatMs * 0.3) barScore[near % 4] += 0.15;
}
const downbeatOffset = barScore.indexOf(Math.max(...barScore));

// Per-video-frame envelopes normalised to the 5th-98th percentile range.
const toVideo = (src) => {
	const out = [];
	for (let vf = 0; vf < Math.ceil(durationMs / 1000 * FPS); vf++) {
		const f = Math.min(frames - 1, Math.round(vf / FPS * 1000 / hopMs));
		out.push(src[f]);
	}
	const sorted = [...out].sort((a, b) => a - b), lo = sorted[Math.floor(sorted.length * .05)], hi = sorted[Math.floor(sorted.length * .98)];
	return out.map(x => Math.round(Math.max(0, Math.min(1, (x - lo) / (hi - lo))) * 1000) / 1000);
};

const beats = beatTimes.map(t => Math.round(t * 10) / 10);
mkdirSync(join(root, 'src/data'), {recursive: true});
writeFileSync(join(root, 'src/data/beats.json'), JSON.stringify({
	bpm, beatMs: Math.round(beatMs * 1000) / 1000, downbeatOffset, durationMs: Math.round(durationMs),
	// Manual overrides: shiftMs moves every beat; downbeatOffset replaces the measured bar phase.
	override: {shiftMs: 0, downbeatOffset: null},
	beats,
}, null, 1));
writeFileSync(join(root, 'src/data/audio-envelope.json'), JSON.stringify({fps: FPS, vocal: toVideo(vocal), bass: toVideo(bass), onset: toVideo(onset)}));
console.log({bpm, beatMs, beats: beats.length, first: beats.slice(0, 4), downbeatOffset, barScore, durationMs});
