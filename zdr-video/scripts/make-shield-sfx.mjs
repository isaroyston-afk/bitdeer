// Builds public/shield-sfx.wav: sound effects for Luca's shield finale, starting when the
// shieldUp move starts (song time END_MS). A metallic "shing" as the shield comes out, a
// whoosh for each incoming attack and a zappy "clang" on each block (the last one bigger).
// Times match SHIELD_HITS in src/luca/moves.ts. Fully synthesised; nothing to license.
// Run: node scripts/make-shield-sfx.mjs
import {writeFileSync} from 'node:fs';

const RATE = 48000, LEN = 2.7, n = Math.round(LEN * RATE);
const HITS = [0.95, 1.3, 1.65, 2.05], FLY = 0.3, DRAW = 0.3;
const L = new Float32Array(n), R = new Float32Array(n);
let seed = 7;
const rnd = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1;};
const add = (i, v, pan = 0) => {if (i >= 0 && i < n) {L[i] += v * (1 - pan); R[i] += v * (1 + pan);}};

/** Band-passed noise swept from f0 to f1 (a state-variable filter), with an envelope. */
const sweep = (t0, dur, f0, f1, amp, env, pan0, pan1) => {
	let lp = 0, bp = 0;
	for (let i = 0; i < dur * RATE; i++) {
		const u = i / (dur * RATE), f = f0 * (f1 / f0) ** u, k = 2 * Math.sin(Math.PI * f / RATE);
		const x = rnd(); lp += k * bp; const hp = x - lp - 0.5 * bp; bp += k * hp;
		add(Math.round(t0 * RATE) + i, amp * env(u) * bp, pan0 + (pan1 - pan0) * u);
	}
};
/** Metallic ring: a few inharmonic partials with fast decay. */
const ring = (t0, f, amp, decay, pan) => {
	for (let i = 0; i < decay * 5 * RATE; i++) {
		const t = i / RATE, a = Math.min(1, t / 0.001);
		let v = 0;
		for (const [m, g] of [[1, 1], [1.51, 0.6], [2.43, 0.4], [3.87, 0.22]]) v += g * Math.exp(-t / (decay / m)) * Math.sin(2 * Math.PI * f * m * t);
		add(Math.round(t0 * RATE) + i, amp * a * v, pan);
	}
};
/** Low thump: a sine dropping in pitch. */
const thump = (t0, f0, amp, dur, pan) => {
	let ph = 0;
	for (let i = 0; i < dur * RATE; i++) {
		const t = i / RATE, f = f0 * Math.exp(-t * 18) + 45;
		ph += 2 * Math.PI * f / RATE;
		add(Math.round(t0 * RATE) + i, amp * Math.exp(-t / (dur * 0.3)) * Math.sin(ph), pan);
	}
};
/** Digital zap: a square-ish tone dropping fast, for the "cyber" part of each block. */
const zap = (t0, f0, amp, dur, pan) => {
	let ph = 0;
	for (let i = 0; i < dur * RATE; i++) {
		const t = i / RATE, f = f0 * Math.exp(-t * 22) + 120;
		ph += 2 * Math.PI * f / RATE;
		add(Math.round(t0 * RATE) + i, amp * Math.exp(-t / (dur * 0.35)) * Math.tanh(4 * Math.sin(ph)) * 0.6, pan);
	}
};

// The shield comes out: a rising swish into a bright metallic "shing".
sweep(DRAW - 0.22, 0.24, 900, 6000, 0.5, u => Math.sin(Math.PI * u) ** 2, -0.1, -0.3);
ring(DRAW, 1480, 0.16, 0.22, -0.3);
ring(DRAW + 0.004, 2210, 0.08, 0.16, -0.3);

HITS.forEach((h, k) => {
	const big = k === HITS.length - 1, g = big ? 1.5 : 1;
	// Whoosh from the left as the attack flies in.
	sweep(h - FLY, FLY, 500, 3200, 0.32 * g, u => u * u * (1 - 0.3 * u), -0.8, -0.35);
	// Block: thump, zap and a short metallic ring, with a crackle of noise.
	thump(h, big ? 180 : 140, 0.55 * g, big ? 0.32 : 0.2, -0.3);
	zap(h, big ? 2400 : 1900 + 200 * k, 0.22 * g, big ? 0.22 : 0.14, -0.35);
	ring(h, 1100 + 120 * k, 0.12 * g, big ? 0.28 : 0.14, -0.3);
	sweep(h, big ? 0.3 : 0.16, 5000, 1800, 0.3 * g, u => (1 - u) ** 3, -0.35, -0.1);
});

let peak = 0; for (const ch of [L, R]) for (const v of ch) peak = Math.max(peak, Math.abs(v));
const gain = 0.45 / peak;
for (const ch of [L, R]) for (let i = 0; i < n; i++) {const u = Math.max(0, (i / RATE - (LEN - 0.15)) / 0.15); ch[i] *= gain * (1 - Math.min(1, u));}

const pcm = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {pcm.writeInt16LE(Math.round(L[i] * 32767), i * 4); pcm.writeInt16LE(Math.round(R[i] * 32767), i * 4 + 2);}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(RATE, 24);
h.writeUInt32LE(RATE * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
writeFileSync('public/shield-sfx.wav', Buffer.concat([h, pcm]));
console.log(`public/shield-sfx.wav: ${LEN}s`);
