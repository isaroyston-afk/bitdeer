// Traces Luca's head parts from the official Welcome artwork (reference/luca-welcome.png)
// into smooth vector paths in head-local puppet units, written to src/luca/traced.json.
// Parts hidden by props in the source (thumb hand on the left cheek, flag pole on the
// right ear) are taken from the clear side and mirrored.
// Run: node scripts/trace-luca.mjs
import {writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readPng, writePng} from './png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const {width: W, height: H, data} = readPng(join(root, 'reference/luca-welcome.png'));

// ---- pixel classes ----
const PAL = {O: [76, 36, 4], F: [255, 189, 84], Wh: [252, 252, 252], R: [228, 96, 46], B: [161, 78, 8], G1: [53, 208, 172], G2: [80, 234, 134], P: [248, 168, 176], M: [185, 138, 140]};
const cls = new Uint8Array(W * H); // 0 transparent, 1 O, 2 F, 3 W, 4 R, 5 B, 6 G, 7 P, 8 M, 9 other
const NAMES = ['', 'O', 'F', 'Wh', 'R', 'B', 'G', 'P', 'M', 'X'];
for (let i = 0; i < W * H; i++) {
	const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
	if (a < 128) continue;
	// Antler greens are a gradient: classify by hue first.
	if (g > r + 40 && g > 150 && b > 90) {cls[i] = 6; continue;}
	let best = 9, bd = 60 * 60 * 3;
	Object.values(PAL).forEach((c, k) => {
		const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
		if (d < bd) {bd = d; best = [1, 2, 3, 4, 5, 6, 6, 7, 8][k];}
	});
	cls[i] = best;
}
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : cls[y * W + x];

// ---- region tools ----
const flood = (sx, sy, pass, box = [0, 0, W, H]) => {
	const m = new Uint8Array(W * H), st = [sx + sy * W];
	m[sx + sy * W] = 1;
	while (st.length) {
		const p = st.pop(), x = p % W, y = (p / W) | 0;
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const nx = x + dx, ny = y + dy;
			if (nx < box[0] || ny < box[1] || nx >= box[2] || ny >= box[3]) continue;
			const q = nx + ny * W;
			if (!m[q] && pass(at(nx, ny), nx, ny)) {m[q] = 1; st.push(q);}
		}
	}
	return m;
};
const fillHoles = (m) => {
	// Everything not reachable from the border through non-mask pixels is inside.
	const out = flood(0, 0, (c, x, y) => !m[x + y * W]);
	const r = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) r[i] = out[i] ? 0 : 1;
	return r;
};
const bbox = (m) => {
	let x0 = W, y0 = H, x1 = 0, y1 = 0;
	for (let i = 0; i < W * H; i++) if (m[i]) {const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;}
	return {x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1};
};
const mirrorFrom = (m, axis, keepRight) => {
	const r = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const d = Math.abs(x - axis), sx = Math.round(keepRight ? axis + d : axis - d);
		if (sx >= 0 && sx < W && m[sx + y * W]) r[x + y * W] = 1;
	}
	return r;
};
const and = (a, f) => {const r = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) r[i] = a[i] && f(i) ? 1 : 0; return r;};
const or = (a, b) => {const r = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) r[i] = a[i] || b[i] ? 1 : 0; return r;};
const dilateInto = (m, allowed, n) => {
	let cur = m;
	for (let k = 0; k < n; k++) {
		const r = cur.slice();
		for (let i = 0; i < W * H; i++) if (!cur[i] && allowed[i]) {
			const x = i % W, y = (i / W) | 0;
			if ((x > 0 && cur[i - 1]) || (x < W - 1 && cur[i + 1]) || (y > 0 && cur[i - W]) || (y < H - 1 && cur[i + W])) r[i] = 1;
		}
		cur = r;
	}
	return cur;
};
const largest = (m) => {
	const seen = new Uint8Array(W * H); let best = null, bestN = 0;
	for (let i = 0; i < W * H; i++) if (m[i] && !seen[i]) {
		const comp = flood(i % W, (i / W) | 0, (c, x, y) => m[x + y * W] === 1);
		let n = 0; for (let j = 0; j < W * H; j++) if (comp[j]) {n++; seen[j] = 1;}
		if (n > bestN) {bestN = n; best = comp;}
	}
	return best;
};

const erode = (m, n) => {
	let cur = m;
	for (let k = 0; k < n; k++) {
		const r = cur.slice();
		for (let i = 0; i < W * H; i++) if (cur[i]) {
			const x = i % W, y = (i / W) | 0;
			if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || !cur[i - 1] || !cur[i + 1] || !cur[i - W] || !cur[i + W]) r[i] = 0;
		}
		cur = r;
	}
	return cur;
};
/** Morphological opening that also keeps only the main body: removes thin leak channels. */
const openMain = (m, n) => and(dilateInto(largest(erode(m, n)), m, n + 2), i => m[i]);

// ---- contour tracing (Moore neighbourhood) -> simplified -> Bezier ----
const trace = (m) => {
	let start = -1;
	for (let i = 0; i < W * H; i++) if (m[i]) {start = i; break;}
	if (start < 0) return [];
	const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
	const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[x + y * W];
	let x = start % W, y = (start / W) | 0, dir = 7;
	const pts = [[x, y]], sx = x, sy = y;
	for (let guard = 0; guard < 400000; guard++) {
		let found = false;
		for (let k = 0; k < 8; k++) {
			const d = (dir + 6 + k) % 8, nx = x + N8[d][0], ny = y + N8[d][1];
			if (on(nx, ny)) {x = nx; y = ny; dir = d; found = true; break;}
		}
		if (!found || (x === sx && y === sy)) break;
		pts.push([x + 0.5, y + 0.5]);
	}
	return pts;
};
const rdp = (pts, eps) => {
	if (pts.length < 3) return pts;
	let idx = 0, dmax = 0;
	const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], L = Math.hypot(bx - ax, by - ay) || 1;
	for (let i = 1; i < pts.length - 1; i++) {
		const d = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / L;
		if (d > dmax) {dmax = d; idx = i;}
	}
	if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
	return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
};
// Light moving-average smoothing removes pixel stair-steps before simplification.
const smoothPts = (pts, r = 3) => pts.map((_, i) => {
	let sx = 0, sy = 0;
	for (let k = -r; k <= r; k++) {const p = pts[(i + k + pts.length) % pts.length]; sx += p[0]; sy += p[1];}
	return [sx / (2 * r + 1), sy / (2 * r + 1)];
});
const toPath = (pts, T) => {
	const p = pts.map(T), n = p.length, f = (v) => v.toFixed(1);
	let d = `M ${f(p[0][0])},${f(p[0][1])}`;
	for (let i = 0; i < n; i++) {
		const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C ${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
	}
	return d + ' Z';
};
const shape = (m, T, eps = 1.1) => {const raw = trace(m); if (raw.length < 8) return null; const s = rdp(smoothPts(raw), eps); return toPath(s.slice(0, -1), T);};

// ---- head ----
const headRaw = fillHoles(openMain(flood(745, 600, (c) => c !== 1 && c !== 0), 10));
const muzzleFill = flood(745, 1000, (c) => c === 3);
const muzzleBox = bbox(fillHoles(muzzleFill));
const axis = (muzzleBox.x0 + muzzleBox.x1) / 2;
// Rebuild the head from the right half's row widths, replacing outlier rows (where the
// cheek touches the flag hand) with the local median. Rows are convex, so this is exact.
const profileClean = (m) => {
	const b0 = bbox(m), half = new Float64Array(H).fill(-1);
	for (let y = b0.y0; y <= b0.y1; y++) {let r = -1; for (let x = Math.ceil(axis); x < W; x++) if (m[x + y * W]) r = x - axis; half[y] = r;}
	const med = (y) => {const v = []; for (let k = -90; k <= 90; k += 3) if (half[y + k] >= 0) v.push(half[y + k]); v.sort((a, c) => a - c); return v[v.length >> 1];};
	const clean = new Float64Array(H).fill(-1);
	for (let y = b0.y0; y <= b0.y1; y++) if (half[y] >= 0) {const mm = med(y); clean[y] = half[y] - mm > 10 ? mm : half[y];}
	// Light vertical smoothing removes row-to-row jitter (keeps the silhouette).
	const r = new Uint8Array(W * H);
	for (let y = b0.y0; y <= b0.y1; y++) {
		if (clean[y] < 0) continue;
		let s = 0, n = 0;
		for (let k = -8; k <= 8; k++) if (clean[y + k] >= 0) {s += clean[y + k]; n++;}
		const hw = y - b0.y0 < 8 || b0.y1 - y < 8 ? clean[y] : s / n;
		for (let x = Math.floor(axis - hw); x <= Math.ceil(axis + hw); x++) r[x + y * W] = 1;
	}
	return r;
};
const head = profileClean(headRaw);
const hb = bbox(head);
if (process.argv.includes('--rows')) for (let y = hb.y0; y <= hb.y1; y += 20) {let a = -1, b = -1; for (let x = 0; x < W; x++) if (head[x + y * W]) {if (a < 0) a = x; b = x;} console.log('row', y, a, b, b - a);}
const k = 528 / hb.w;                       // puppet units per source pixel
const cy = (hb.y0 + hb.y1) / 2;
const T = ([x, y]) => [(x - axis) * k, (y - cy) * k];
const TL = T; // left-side parts are mirrored at render time with scale(-1, 1)

// Outline thickness: dark run just outside the head's right edge at mid-height.
// Outline thickness: median dark run just outside the clean head, sampled on its right half.
let ring = 0; {
	const runs = [];
	for (let a = -80; a <= 80; a += 10) {
		const t = a * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t);
		let rr = 0; while (head[Math.round(axis + dx * rr) + Math.round(cy + dy * rr) * W]) rr++;
		let n = 0; while (at(Math.round(axis + dx * (rr + n)), Math.round(cy + dy * (rr + n))) === 1) n++;
		if (n > 3) runs.push(n);
	}
	runs.sort((a, c) => a - c); ring = runs[runs.length >> 1];
}

// Head cel-shade band (red-orange pixels inside the head, right half mirrored).
const band = and(mirrorFrom(and(headRaw, i => cls[i] === 4 && ((i / W) | 0) > cy), axis, true), i => head[i]);

// ---- ears and antlers (left side is clear in the source) ----
const ringMask = dilateInto(head, new Uint8Array(W * H).map((_, i) => cls[i] === 1 ? 1 : 0), ring + 4);
const under = or(head, ringMask);
const antlerSeed0 = (() => {for (let y = 40; y < 300; y++) for (let x = 150; x < 600; x++) if (at(x, y) === 6) return [x, y]; return null;})();
const antlerInterior = flood(antlerSeed0[0], antlerSeed0[1], (c) => c === 6, [0, 0, axis, H]);
const darkPx = new Uint8Array(W * H).map((_, i) => cls[i] === 1 ? 1 : 0);
const antlerOuter = dilateInto(antlerInterior, darkPx, ring + 6);
const headOuter = dilateInto(head, darkPx, ring + 6);
// The ear: every opaque pixel in the upper-left zone that is not head or antler.
const earZone = new Uint8Array(W * H).map((_, i) => {const x = i % W, y = (i / W) | 0; return x < axis - 150 && y < cy - 20 && cls[i] !== 0 && !headOuter[i] && !antlerOuter[i] ? 1 : 0;});
const earOuterVis = largest(earZone);
const earShell = largest(and(earOuterVis, i => cls[i] === 2));
const earIn = largest(and(earOuterVis, i => cls[i] === 4)), earDeep = largest(and(earOuterVis, i => cls[i] === 5));
// Extend under the head so the ear can rotate without opening a gap.
const ear = dilateInto(fillHoles(earOuterVis), under, ring * 3);
const earShellExt = dilateInto(earShell, under, ring * 3);
const antlerSeed = (() => {for (let y = 40; y < 300; y++) for (let x = 150; x < 600; x++) if (at(x, y) === 6) return [x, y]; return null;})();
const antlerRaw = flood(antlerSeed[0], antlerSeed[1], (c) => c === 6, [0, 0, axis, H]);
const antler = dilateInto(antlerRaw, under, ring * 4);

// ---- face (left side) ----
const brow = largest(and(new Uint8Array(W * H).fill(1), i => cls[i] === 5 && (i % W) < axis && ((i / W) | 0) > hb.y0 + hb.h * 0.25 && ((i / W) | 0) < cy));
const browBox = bbox(brow);
const browShadow = largest(and(new Uint8Array(W * H).fill(1), i => {const x = i % W, y = (i / W) | 0; return cls[i] === 4 && x > browBox.x0 - 40 && x < browBox.x1 + 40 && y > browBox.y0 && y < browBox.y1 + 60;}));
// Eye: everything that is not fur, around the left eye's white.
const eyeSeed = (() => {for (let x = 300; x < axis - 120; x++) if (at(x, 830) === 3) return [x, 830]; return null;})();
const eyeBox = [Math.round(axis - 520), Math.round(cy - 280), Math.round(axis - 110), Math.round(cy + 330)];
const eye = fillHoles(flood(eyeSeed[0], eyeSeed[1], (c) => c !== 2 && c !== 0 && c !== 4 && c !== 5, eyeBox));
const eyeB = bbox(eye);
const eyeWhite = and(eye, i => cls[i] === 3), eyeLid = and(eye, i => cls[i] === 8);
// Split whites into separate islands (sclera crescent, highlights).
const islands = (m, minN = 60) => {
	const seen = new Uint8Array(W * H), out = [];
	for (let i = 0; i < W * H; i++) if (m[i] && !seen[i]) {
		const comp = flood(i % W, (i / W) | 0, (c, x, y) => m[x + y * W] === 1);
		let n = 0; for (let j = 0; j < W * H; j++) if (comp[j]) {n++; seen[j] = 1;}
		if (n >= minN) out.push(comp);
	}
	return out;
};
// Muzzle, nose.
const muzzle = fillHoles(muzzleFill);
let ringM = 0; {
	// Top of the left lobe: the muzzle column that starts highest.
	let lx = muzzleBox.x0, ly = H;
	for (let x = muzzleBox.x0; x < axis; x++) for (let y = muzzleBox.y0; y < muzzleBox.y1; y++) if (muzzle[x + y * W]) {if (y < ly) {ly = y; lx = x;} break;}
	for (let y = ly - 1; y > ly - 60; y--) if (at(lx, y) === 1) ringM++;
}
const darkInMuzzle = and(muzzle, i => cls[i] === 1);
let noseBottom = muzzleBox.y0;
for (let y = muzzleBox.y0; y < muzzleBox.y1; y++) {
	let n = 0; for (let x = muzzleBox.x0; x <= muzzleBox.x1; x++) if (darkInMuzzle[x + y * W]) n++;
	if (n > 30) noseBottom = y; else if (noseBottom > muzzleBox.y0 && n > 0 && n < 30) break;
}
const nose = mirrorFrom(and(darkInMuzzle, i => ((i / W) | 0) <= noseBottom + 2), axis, true);
const mouthDark = and(darkInMuzzle, i => ((i / W) | 0) > noseBottom + 30);

const avg = (m) => {
	let r = 0, g = 0, b = 0, n = 0;
	for (let i = 0; i < W * H; i++) if (m[i] && data[i * 4 + 3] > 250) {r += data[i * 4]; g += data[i * 4 + 1]; b += data[i * 4 + 2]; n++;}
	return '#' + [r, g, b].map(v => Math.round(v / Math.max(1, n)).toString(16).padStart(2, '0')).join('');
};
const tongue = and(muzzle, i => cls[i] === 7), mouthIn = and(muzzle, i => cls[i] === 4 && ((i / W) | 0) > noseBottom);
const antTop = and(antlerRaw, i => ((i / W) | 0) < bbox(antlerRaw).y0 + 60), antBot = and(antlerRaw, i => ((i / W) | 0) > bbox(antlerRaw).y1 - 120);
const colors = {
	outline: avg(and(new Uint8Array(W * H).fill(1), i => cls[i] === 1)), fur: avg(and(head, i => cls[i] === 2)), shade: avg(band),
	earIn: avg(earIn), earDeep: avg(earDeep), brow: avg(brow), browShadow: avg(browShadow), eyeLid: avg(eyeLid),
	tongue: avg(tongue), mouth: avg(mouthIn), antlerTop: avg(antTop), antlerBottom: avg(antBot),
};
const out = {
	colors,
	_source: 'reference/luca-welcome.png (official Luca Welcome art), traced by scripts/trace-luca.mjs',
	unitsPerPixel: k, outline: ring * k,
	head: shape(head, T, 1.2),
	band: shape(largest(band) ?? band, T, 1.0),
	ear: shape(largest(ear), TL), earShell: shape(largest(earShellExt), TL), earIn: shape(earIn, TL), earDeep: shape(earDeep, TL),
	antler: shape(largest(antler), TL, 1.0),
	brow: shape(brow, TL, 0.8), browShadow: shape(browShadow, TL, 0.8),
	eye: shape(eye, TL, 0.8), eyeWhite: islands(eyeWhite).map(m => shape(m, TL, 0.6)), eyeLid: islands(eyeLid, 30).map(m => shape(m, TL, 0.6)),
	muzzle: shape(muzzle, T, 0.9), nose: shape(largest(nose), T, 0.7), muzzleOutline: ringM * k,
	boxes: {
		head: [hb.x0, hb.y0, hb.w, hb.h].map(v => v), eye: [eyeB.x0, eyeB.y0, eyeB.w, eyeB.h], muzzle: [muzzleBox.x0, muzzleBox.y0, muzzleBox.w, muzzleBox.h],
		mouthDark: (() => {const b = bbox(mouthDark); return [b.x0, b.y0, b.w, b.h];})(), noseBottom,
	},
	anchors: {
		eyeCenter: T([(eyeB.x0 + eyeB.x1) / 2, (eyeB.y0 + eyeB.y1) / 2]),
		muzzleTop: T([axis, muzzleBox.y0]), muzzleBottom: T([axis, muzzleBox.y1]), noseBottom: T([axis, noseBottom]),
		mouthTop: T([axis, bbox(mouthDark).y0]), mouthBottom: T([axis, bbox(mouthDark).y1]), mouthHalfWidth: bbox(mouthDark).w / 2 * k,
	},
};
writeFileSync(join(root, 'src/luca/traced.json'), JSON.stringify(out, null, 1));
console.log({axis, headBox: hb, k: k.toFixed(4), ringPx: ring, outlineUnits: (ring * k).toFixed(1), eyeB, muzzleBox, noseBottom, anchors: out.anchors,
	sizes: Object.fromEntries(Object.entries(out).filter(([, v]) => typeof v === 'string' && v.startsWith('M')).map(([n, v]) => [n, v.length])),
	whites: out.eyeWhite.length, lids: out.eyeLid.length});

// Debug overlay: grey source with coloured masks.
if (process.argv.includes('--debug')) {
	const img = Buffer.alloc(W * H * 4);
	for (let i = 0; i < W * H; i++) {const g = data[i * 4 + 3] < 128 ? 255 : (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3 * 0.6 + 100; img[i * 4] = img[i * 4 + 1] = img[i * 4 + 2] = g; img[i * 4 + 3] = 255;}
	const paint = (m, c) => {for (let i = 0; i < W * H; i++) if (m[i]) {img[i * 4] = img[i * 4] * 0.35 + c[0] * 0.65; img[i * 4 + 1] = img[i * 4 + 1] * 0.35 + c[1] * 0.65; img[i * 4 + 2] = img[i * 4 + 2] * 0.35 + c[2] * 0.65;}};
	paint(head, [255, 0, 0]); paint(ear, [0, 0, 255]); paint(earIn, [255, 0, 255]); paint(antler, [0, 200, 0]); paint(eye, [0, 200, 255]); paint(muzzle, [255, 200, 0]); paint(nose, [120, 0, 120]); paint(brow, [0, 0, 0]); paint(browShadow, [0, 120, 120]); paint(band, [255, 128, 0]);
	await writePng(join(root, 'out/_trace_debug.png'), W, H, img);
}
