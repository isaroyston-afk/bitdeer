import React from 'react';
import {staticFile} from 'remotion';
import {C, LINE} from '../colors';
import {ArmRig, LegRig, Pt, DIM} from '../rig';
import {Hand} from '../pose';

// Body parts in the official Luca style: flat fills, dark-brown outlines,
// one red-orange cel-shade tone, chunky stubby limbs and big rounded paws.
const cap = {strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none'} as const;
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

// ---------- legs: straight stubs with an inner shade line, big flat-bottomed feet ----------
const FOOT = 'M -44,-44 C -20,-60 26,-60 46,-44 C 62,-30 62,-6 54,0 L -54,0 C -62,-8 -62,-32 -44,-44 Z';
export const Leg: React.FC<LegRig> = ({hip, ankle, side, footRot}) => {
	// Run the leg a little into the foot so a turned foot never shows the leg's cut end.
	const dir = {x: ankle.x - hip.x, y: ankle.y - hip.y}, len = Math.hypot(dir.x, dir.y) || 1;
	const d = poly([hip, {x: ankle.x + dir.x / len * 16, y: ankle.y + dir.y / len * 16}]);
	return <g>
		<path d={d} stroke={C.outline} strokeWidth={DIM.legW + LINE * 2} strokeLinecap="butt"/>
		<path d={d} stroke={C.fur} strokeWidth={DIM.legW} strokeLinecap="butt"/>
		<path d={poly([{x: hip.x - side * (DIM.legW / 2 - 7), y: hip.y}, {x: ankle.x - side * (DIM.legW / 2 - 7), y: ankle.y}])} stroke={C.furShade} strokeWidth={8}/>
		<g transform={`translate(${ankle.x} ${ankle.y}) rotate(${footRot}) translate(${side * DIM.footOut} ${DIM.ankleH}) scale(${side} 1)`}>
			<clipPath id={`foot${side}`}><path d={FOOT}/></clipPath>
			<path d={FOOT} fill={C.fur} stroke={C.outline} strokeWidth={LINE * 2} strokeLinejoin="round" paintOrder="stroke"/>
			<rect x={-70} y={-11} width={140} height={20} fill={C.furShade} clipPath={`url(#foot${side})`}/>
			<path d="M -20,-40 C -8,-48 14,-48 26,-40" stroke={C.outline} strokeWidth={LINE * 0.8} {...cap}/>
		</g>
	</g>;
};

// ---------- torso: boxy white Bitdeer hoodie over brand-green shorts ----------
const TOP = DIM.neckY - DIM.hemY; // torso-local y of the (hidden) neck
const BODY = `M -150,0 L -154,${TOP + 70} C -154,${TOP + 30} -120,${TOP} -60,${TOP} L 60,${TOP} C 120,${TOP} 154,${TOP + 30} 154,${TOP + 70} L 150,0 Z`;
const SHORTS = `M -138,-10 L 138,-10 L 134,${DIM.shortsH} L 6,${DIM.shortsH} L 0,${DIM.shortsH - 14} L -6,${DIM.shortsH} L -134,${DIM.shortsH} Z`;
const POCKET = 'M -84,-96 L 84,-96 C 94,-96 98,-90 100,-80 L 112,-26 L -112,-26 L -100,-80 C -98,-90 -94,-96 -84,-96 Z';

/** Hoodie silhouette outline, drawn before the sleeves' outlines and fills. */
// The hood lies folded round the neck, mostly hidden by the big head; its rim shows beside the chin.
const HOOD = `M -150,${TOP + 40} C -150,${TOP - 40} 150,${TOP - 40} 150,${TOP + 40} C 110,${TOP + 16} -110,${TOP + 16} -150,${TOP + 40} Z`;
export const TorsoOutline: React.FC = () => <g fill={C.outline} stroke={C.outline} strokeWidth={LINE * 2} strokeLinejoin="round">
	<path d={BODY}/><path d={HOOD}/>
</g>;

export const Torso: React.FC<{id: string}> = ({id}) => <g>
	<defs><clipPath id={`${id}-body`}><path d={BODY}/></clipPath><clipPath id={`${id}-shorts`}><path d={SHORTS}/></clipPath></defs>
	<path d={SHORTS} fill="#4EE58E" stroke={C.outline} strokeWidth={LINE * 2} strokeLinejoin="round" paintOrder="stroke"/>
	<g clipPath={`url(#${id}-shorts)`}>
		<path d="M -120,20 C -96,0 -70,30 -56,60 L -120,70 Z M 80,4 C 96,20 118,26 140,20 L 140,70 L 104,70 Z" fill="#2FBF6E"/>
	</g>
	<path d={BODY} fill={C.hoodie}/>
	<path d={HOOD} fill={C.hoodie}/>
	<path d={`M -118,${TOP + 26} C -70,${TOP + 6} 70,${TOP + 6} 118,${TOP + 26}`} stroke={C.hoodieDeep} strokeWidth={10} {...cap}/>
	<g clipPath={`url(#${id}-body)`}>
		<path d={`M 118,0 L 122,${TOP} L 170,${TOP} L 170,0 Z`} fill={C.hoodieShade}/>
		<rect x={-170} y={-24} width={340} height={30} fill={C.hoodieShade}/>
		<path d="M -160,-24 L 160,-24" stroke={C.outline} strokeWidth={LINE * 0.6}/>
		<ellipse cx={0} cy={TOP + 22} rx={170} ry={36} fill={C.hoodieDeep} opacity={0.45}/>
	</g>
	<path d={POCKET} fill={C.hoodie} stroke={C.outline} strokeWidth={LINE * 0.7} strokeLinejoin="round"/>
	<svg x={-36} y={-86} width={72} height={54} viewBox="0 0 40 30"><image href={staticFile('bitdeer-logo.svg')} width={156} height={30}/></svg>
	{[-1, 1].map(s => <g key={s}>
		<path d={`M ${s * 34},${TOP + 4} C ${s * 36},${TOP + 40} ${s * 34},${TOP + 70} ${s * 40},${TOP + 96}`} stroke={C.string} strokeWidth={9} {...cap}/>
		<rect x={s * 40 - 8} y={TOP + 92} width={16} height={22} rx={7} fill={C.stringTip} stroke={C.outline} strokeWidth={LINE * 0.5}/>
	</g>)}
</g>;

// ---------- arms and paws ----------
// Each arm is one silhouette: a soft, rounded hoodie sleeve that shares the torso's outline
// pass (so it grows out of the body), then a thick fur arm and a round deer paw. Outlines are
// drawn before fills, so the arm and paw union into one shape with no seams.
// Paws follow the IP library: round mitten blobs, stubby rounded digits, one curl crease
// (Welcome art, skateboard and reading poses) and an orange cel-shade at the tip.
const SLEEVE_ROOT = 54, SLEEVE_CUFF = 48, CUFF_BAND = 13, ARM_W = 58;
/** Largest bend of the paw relative to the forearm, in degrees (more reads as a broken wrist). */
export const WRIST_LIMIT = 28;

type Prim = {k: 'e'; cx: number; cy: number; rx: number; ry: number} | {k: 'c'; a: Pt; b: Pt; w: number};
const E = (cx: number, cy: number, rx: number, ry: number): Prim => ({k: 'e', cx, cy, rx, ry});
const Digit = (ax: number, ay: number, bx: number, by: number, w = 30): Prim => ({k: 'c', a: {x: ax, y: ay}, b: {x: bx, y: by}, w});

const prim = (p: Prim, key: number, color: string, grow: number) => p.k === 'e'
	? <ellipse key={key} cx={p.cx} cy={p.cy} rx={p.rx + grow} ry={p.ry + grow} fill={color}/>
	: <path key={key} d={`M ${p.a.x},${p.a.y} L ${p.b.x},${p.b.y}`} stroke={color} strokeWidth={p.w + grow * 2} {...cap}/>;

/**
 * Paw in paw-local units, drawn for the right-hand side of the screen (side +1) and mirrored
 * for the other: origin at the wrist, +y continues the forearm, +x is the thumb side.
 * up = the world "up" direction in these local units (for the thumbs-up).
 */
const paw = (hand: Hand, snip: number, up: Pt): {mitten: Prim; digits: Prim[]; lines: string[]} => {
	switch (hand) {
		case 'open': return {mitten: E(0, 34, 38, 37), digits: [], lines: ['M 10,24 C -6,20 -10,44 6,46']};
		case 'point': return {
			// One stubby rounded digit raised from the thumb side, as in the official Welcome art.
			mitten: E(0, 28, 35, 33), digits: [Digit(13, 34, 15, 78, 31)],
			lines: ['M -20,42 C -10,58 8,58 14,46'],
		};
		case 'thumb': {
			// The digit always points up in the world, whatever the forearm is doing.
			const bx = 10 + up.x * 12, by = 28 + up.y * 12;
			return {mitten: E(0, 28, 35, 33), digits: [Digit(bx, by, 10 + up.x * 50, 28 + up.y * 50, 31)], lines: ['M -18,36 C -8,50 10,48 14,36']};
		}
		case 'peace': {
			const s = 6 + 12 * snip;
			return {mitten: E(0, 28, 35, 33), digits: [Digit(-8, 40, -8 - s, 76, 27), Digit(12, 40, 12 + s, 76, 27)], lines: ['M -22,34 C -16,44 -6,46 0,40']};
		}
		case 'shaka': return {mitten: E(0, 28, 35, 33), digits: [Digit(22, 22, 46, 10, 28), Digit(-20, 44, -32, 66, 26)], lines: ['M -8,30 C 0,40 12,38 14,30']};
		default: return {mitten: E(0, 30, 35, 34), digits: [], lines: ['M 14,16 C 26,24 24,38 12,42']};
	}
};

const sub = (a: Pt, b: Pt): Pt => ({x: a.x - b.x, y: a.y - b.y});
const along = (a: Pt, b: Pt, t: number): Pt => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
const unit = (v: Pt): Pt => {const l = Math.hypot(v.x, v.y) || 1; return {x: v.x / l, y: v.y / l};};

// Sleeve in sleeve-local units: x runs from the shoulder along the upper arm, y across it.
// A round shoulder, sides that taper slightly to a soft, gently convex cuff with rounded corners.
const SLEEVE_LEN = DIM.upper * DIM.sleeve;
const SLEEVE_PATH = (() => {
	const r1 = SLEEVE_ROOT, r2 = SLEEVE_CUFF, L = SLEEVE_LEN, k = 16;
	return `M 0,${-r1} C ${L * 0.5},${-r1} ${L - k},${-r2} ${L - k},${-r2} Q ${L},${-r2} ${L},${-r2 + k} Q ${L + 7},0 ${L},${r2 - k} Q ${L},${r2} ${L - k},${r2} `
		+ `C ${L - k},${r2} ${L * 0.5},${r1} 0,${r1} A ${r1} ${r1} 0 0 1 0,${-r1} Z`;
})();
const sleeveT = (r: ArmRig) => {
	const d = unit(sub(r.elbow, r.shoulder));
	return `translate(${r.shoulder.x} ${r.shoulder.y}) rotate(${Math.atan2(d.y, d.x) * 180 / Math.PI})`;
};

/** Sleeve outline: drawn with the torso outline so the sleeve and hoodie form one shape. */
export const SleeveOutline: React.FC<{r: ArmRig}> = ({r}) => <path d={SLEEVE_PATH} transform={sleeveT(r)} fill={C.outline} stroke={C.outline} strokeWidth={LINE * 2} strokeLinejoin="round"/>;

/** Sleeve fill with a ribbed hoodie cuff and a soft shadow fold along the underside. */
export const SleeveFill: React.FC<{r: ArmRig; id: string}> = ({r, id}) => {
	const cid = `${id}-sleeve${r.side}`, L = SLEEVE_LEN, under = -r.side;
	return <g transform={sleeveT(r)}>
		<clipPath id={cid}><path d={SLEEVE_PATH}/></clipPath>
		<path d={SLEEVE_PATH} fill={C.hoodie}/>
		<g clipPath={`url(#${cid})`}>
			<path d={`M -60,${under * 30} C 0,${under * 40} ${L * 0.6},${under * 30} ${L + 10},${under * 30} L ${L + 10},${under * 70} L -60,${under * 70} Z`} fill={C.hoodieShade}/>
			<rect x={L - CUFF_BAND} y={-70} width={CUFF_BAND + 12} height={140} fill={C.hoodieShade}/>
		</g>
		<path d={`M ${L - CUFF_BAND},${-SLEEVE_CUFF + 5} Q ${L - CUFF_BAND + 4},0 ${L - CUFF_BAND},${SLEEVE_CUFF - 5}`} stroke={C.outline} strokeWidth={LINE * 0.6} {...cap}/>
	</g>;
};

/** The fur arm and the paw as one silhouette. Only the upper arm is hidden inside its sleeve,
 * so a forearm folded back across the sleeve stays attached, in front of it. */
export const ArmLimb: React.FC<{r: ArmRig; snip: number; id: string}> = ({r, snip, id}) => {
	const bend = Math.max(-WRIST_LIMIT, Math.min(WRIST_LIMIT, r.side * r.arm.rot));
	const handDeg = r.angle - 90 + bend;
	const th = handDeg * Math.PI / 180;
	const up = {x: -Math.sin(th) * r.side, y: -Math.cos(th)};
	const {mitten, digits, lines} = paw(r.arm.hand, snip, up);
	const parts = [mitten, ...digits];
	const fd = unit(sub(r.wrist, r.elbow));
	const upper = poly([along(r.shoulder, r.elbow, DIM.sleeve * 0.5), r.elbow]);
	// The forearm starts a little past the elbow; the upper arm's round end covers the joint.
	const fore = poly([{x: r.elbow.x + fd.x * 12, y: r.elbow.y + fd.y * 12}, {x: r.wrist.x + fd.x * 14, y: r.wrist.y + fd.y * 14}]);
	const pawT = `translate(${r.wrist.x} ${r.wrist.y}) rotate(${handDeg}) scale(${r.side} 1)`;
	const mid = `${id}-sl${r.side}`, pid = `${id}-paw${r.side}`;
	const m = mitten as Extract<Prim, {k: 'e'}>;
	return <g>
		<mask id={mid} maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={6000} height={6000}>
			<rect x={-3000} y={-3000} width={6000} height={6000} fill="white"/>
			<path d={SLEEVE_PATH} transform={sleeveT(r)} fill="black" stroke="black" strokeWidth={LINE * 2} strokeLinejoin="round"/>
		</mask>
		<path d={upper} stroke={C.outline} strokeWidth={ARM_W + LINE * 2} {...cap} mask={`url(#${mid})`}/>
		<path d={fore} stroke={C.outline} strokeWidth={ARM_W + LINE * 2} {...cap}/>
		<g transform={pawT}>{parts.map((p, i) => prim(p, i, C.outline, LINE))}</g>
		<path d={upper} stroke={C.fur} strokeWidth={ARM_W} {...cap} mask={`url(#${mid})`}/>
		<path d={fore} stroke={C.fur} strokeWidth={ARM_W} {...cap}/>
		<g transform={pawT}>
			<clipPath id={pid}><ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry}/></clipPath>
			{prim(mitten, 0, C.fur, 0)}
			{/* Orange cel-shade crescent at the tip of the paw, as on the official paws and feet. */}
			<ellipse cx={m.cx} cy={m.cy + m.ry * 0.95} rx={m.rx * 1.1} ry={m.ry * 0.42} fill={C.furShade} clipPath={`url(#${pid})`}/>
			{digits.map((p, i) => prim(p, i + 1, C.fur, 0))}
			{lines.map((d, i) => <path key={i} d={d} stroke={C.outline} strokeWidth={LINE * 0.8} {...cap}/>)}
		</g>
	</g>;
};
