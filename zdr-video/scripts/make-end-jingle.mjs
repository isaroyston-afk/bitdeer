// Builds public/end-jingle.wav: a short, cute sign-off for the end card, in C to sit with the
// song (the last chorus centres on C). A soft "bloop" (a bubble that pitches up), a four-note
// glockenspiel arpeggio C6-E6-G6-C7, and a sparkle shimmer that rings out to silence.
// Everything is synthesised here, so there is nothing to license.
// Run: node scripts/make-end-jingle.mjs
import {writeFileSync} from 'node:fs';

const RATE = 48000, LEN = 2.6, n = Math.round(LEN * RATE);
const L = new Float32Array(n), R = new Float32Array(n);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const add = (i, v, pan = 0) => {if (i >= 0 && i < n) {L[i] += v * (1 - pan) * 0.5 * 2 ** 0.5; R[i] += v * (1 + pan) * 0.5 * 2 ** 0.5;}};

// Bubble "bloop": a sine gliding up an octave with a fast decay, like a water drop.
const bloop = (t0, f0, f1, dur, amp, pan) => {
	let ph = 0;
	for (let i = 0; i < dur * RATE; i++) {
		const t = i / RATE, u = t / dur, f = f0 * (f1 / f0) ** Math.min(1, u * 1.6);
		ph += 2 * Math.PI * f / RATE;
		const env = Math.min(1, t / 0.004) * Math.exp(-t / (dur * 0.35));
		add(Math.round(t0 * RATE) + i, amp * env * Math.sin(ph), pan);
	}
};
// Glockenspiel / music-box note: bright inharmonic partials with individual decays.
const bell = (t0, midi, amp, pan, decay = 0.9) => {
	const f = hz(midi), parts = [[1, 1, decay], [2.76, 0.32, decay * 0.45], [5.4, 0.12, decay * 0.25], [8.93, 0.05, decay * 0.15]];
	for (let i = 0; i < 2.2 * RATE; i++) {
		const t = i / RATE, att = Math.min(1, t / 0.002);
		let v = 0;
		for (const [m, a, d] of parts) v += a * Math.exp(-t / d) * Math.sin(2 * Math.PI * f * m * t);
		add(Math.round(t0 * RATE) + i, amp * att * v, pan);
	}
};

bloop(0.00, 520, 1040, 0.16, 0.42, -0.2);
bloop(0.13, 700, 1400, 0.13, 0.30, 0.25);
const step = 0.105; // quick, bouncy arpeggio
[[84, -0.35], [88, -0.1], [91, 0.15], [96, 0.35]].forEach(([m, pan], k) => bell(0.30 + k * step, m, k === 3 ? 0.34 : 0.26, pan, k === 3 ? 1.1 : 0.6));
// The final C chimes with a soft fifth and octave underneath for a warm button.
bell(0.30 + 3 * step, 79, 0.12, -0.2, 1.0);
bell(0.30 + 3 * step, 72, 0.10, 0.1, 1.2);
// Sparkle: a few very high, quiet pings that twinkle across the stereo field.
[[0.78, 103, 0.6], [0.9, 100, -0.5], [1.02, 108, 0.3], [1.16, 105, -0.2]].forEach(([t, m, pan]) => bell(t, m, 0.05, pan, 0.25));

// Gentle high-shelf softening (one-pole low-pass mixed back) and a clean fade to zero at the end.
for (const ch of [L, R]) {
	let y = 0;
	for (let i = 0; i < n; i++) {y += 0.35 * (ch[i] - y); ch[i] = 0.6 * ch[i] + 0.4 * y;}
	for (let i = 0; i < n; i++) {const u = Math.max(0, (i / RATE - (LEN - 0.6)) / 0.6); ch[i] *= 0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, u));}
}
let peak = 0; for (const ch of [L, R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
const gain = 0.5 / peak; // about -6 dBFS, a touch under the song's chorus peaks

const pcm = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {pcm.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4); pcm.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2);}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(RATE, 24);
h.writeUInt32LE(RATE * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
writeFileSync('public/end-jingle.wav', Buffer.concat([h, pcm]));
console.log(`public/end-jingle.wav: ${LEN}s`);
