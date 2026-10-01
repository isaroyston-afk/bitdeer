import React from 'react';
import {C} from '../colors';
import {Pose} from '../pose';
import {Mouth} from '../lipsync';
import T from '../traced.json';

// Head parts are traced from the official Welcome artwork (scripts/trace-luca.mjs).
// Head-local units: centre (0, 0), 528 wide. Left-side parts are traced; the right
// side is the same shape mirrored, as in the official front view.

const box = (d: string) => {
	const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
	for (let i = 0; i + 1 < n.length; i += 2) {x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);}
	return {x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0};
};
const HEAD_BOX = box(T.head), EYE = box(T.eye), ANTLER = box(T.antler), EAR = box(T.ear), BROW = box(T.brow);
// Pivots: antler base where it enters the head, ear base on the head's upper side.
const ANTLER_PIVOT = {x: ANTLER.x1 - ANTLER.w * 0.25, y: ANTLER.y1 - 10};
const EAR_PIVOT = {x: EAR.x1 - EAR.w * 0.2, y: EAR.cy + EAR.h * 0.2};
const A = {mouthTop: T.anchors.mouthTop[1], mouthBottom: T.anchors.mouthBottom[1], noseBottom: T.anchors.noseBottom[1], mouthHalfWidth: T.anchors.mouthHalfWidth};
export const HEAD_HALF_HEIGHT = HEAD_BOX.h / 2;
const LINE = T.muzzleOutline * 1.5;

const Side: React.FC<{side: number; children: React.ReactNode}> = ({side, children}) => <g transform={side > 0 ? 'scale(-1 1)' : undefined}>{children}</g>;

const Antler: React.FC<{side: number; wobble: number; id: string}> = ({side, wobble, id}) => <Side side={side}>
	<g transform={`rotate(${-wobble} ${ANTLER_PIVOT.x} ${ANTLER_PIVOT.y})`}>
		<path d={T.antler} fill={`url(#${id}-antler)`} stroke={C.outline} strokeWidth={T.outline * 2} strokeLinejoin="round" paintOrder="stroke"/>
	</g>
</Side>;

const Ear: React.FC<{side: number; wobble: number}> = ({side, wobble}) => <Side side={side}>
	<g transform={`rotate(${-wobble} ${EAR_PIVOT.x} ${EAR_PIVOT.y})`}>
		<path d={T.ear} fill={C.outline}/>
		<path d={T.earShell} fill={C.fur}/>
		<path d={T.earIn} fill={C.earIn}/>
		<path d={T.earDeep} fill={C.earDeep}/>
	</g>
</Side>;

const Brow: React.FC<{side: number; raise: number}> = ({side, raise}) => <Side side={side}>
	<g transform={`translate(0 ${-9 * raise}) rotate(${-8 * raise} ${BROW.cx} ${BROW.cy})`}>
		<path d={T.browShadow} fill={C.earIn}/>
		<path d={T.brow} fill={C.brow}/>
	</g>
</Side>;

// Head silhouette. The trace's upper half is used as-is; below eye level the outline is rebuilt
// from measurements of the official Welcome art. A cheek tuft juts out just under each eye,
// with a flat top edge and its tip pointing up and out (the official reference). Then one
// smooth jaw curve runs to the chin. (The trace's profile smoothing lost the tufts, and the
// shirt collar overlapping the jaw in the source left downward-hanging lumps.)
const CUT_Y = 60;
const headPts = (() => {
	const n = T.head.match(/-?\d+(\.\d+)?/g)!.map(Number), ends: [number, number][] = [[n[0], n[1]]];
	for (let i = 2; i + 5 < n.length; i += 6) ends.push([n[i + 4], n[i + 5]]);
	return ends;
})();
/** Lower-left contour from eye level to the chin; [x, y, sharp]. Mirrored for the right side. */
const LOWER_LEFT: [number, number, boolean?][] = [
	[-257, 64], [-255, 84, true], [-268, 82], [-284, 76], [-298, 66, true], [-292, 84], [-282, 104], [-270, 122],
	[-258, 136], [-238, 157], [-208, 180], [-166, 200], [-112, 216], [-56, 225], [0, 228],
];
const HEAD_PATH = (() => {
	// The trace runs clockwise from the top centre: right side down, bottom, left side up.
	const upper = headPts.filter(([, y]) => y < CUT_Y);
	const split = upper.findIndex(([x], i) => i > 0 && x < 0 && upper[i - 1][0] > 0);
	const right = upper.slice(0, split), left = upper.slice(split);
	const lowerRight = [...LOWER_LEFT].reverse().map(([x, y, c]) => [-x, y, c] as [number, number, boolean?]);
	const lower = [...lowerRight.reverse(), ...LOWER_LEFT.slice(0, -1).reverse()];
	const pts: [number, number, boolean?][] = [...right, ...lower, ...left];
	// Closed Catmull-Rom spline; sharp points get zero-length handles so the tuft tips stay crisp.
	const P = (i: number) => pts[(i + pts.length) % pts.length];
	let d = `M ${P(0)[0].toFixed(1)},${P(0)[1].toFixed(1)}`;
	for (let i = 0; i < pts.length; i++) {
		const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k = 1 / 6;
		const c1 = p1[2] ? p1 : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
		const c2 = p2[2] ? p2 : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
		d += ` C ${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
	}
	return d + ' Z';
})();
/** Orange cel-shade along each tuft's underside, as in the official art. */
const TUFT_SHADE = 'M -291,90 C -282,110 -270,128 -252,146';

const arc = (d: string) => <path d={d} stroke={C.outline} strokeWidth={LINE * 2.2} strokeLinecap="round" fill="none"/>;

type EyeProps = {side: number; state: Pose['eyes']; blink: number; squeeze: number; lookX: number; lookY: number};
const Eye: React.FC<EyeProps> = ({side, state, blink, squeeze, lookX, lookY}) => {
	const {cx, cy, w, h} = EYE;
	// The traced eye is the left one; mirrored for the right so highlights stay on the outer side.
	const happy = state === 'happy' || (state === 'wink' && side > 0);
	let content: React.ReactNode;
	if (happy) content = arc(`M ${cx - w * 0.38},${cy + h * 0.12} Q ${cx},${cy - h * 0.42} ${cx + w * 0.38},${cy + h * 0.12}`);
	else if (state === 'closed' || blink > 0.7) content = <g>
		{arc(`M ${cx - w * 0.4},${cy} Q ${cx},${cy + h * 0.28} ${cx + w * 0.4},${cy}`)}
		{arc(`M ${cx - w * 0.38},${cy + h * 0.02} L ${cx - w * 0.52},${cy - h * 0.1}`)}
	</g>;
	else {
		const open = 1 - 0.92 * Math.min(1, blink / 0.7), s = state === 'wide' ? 1.08 : 1;
		content = <g transform={`translate(${cx} ${cy}) scale(${s} ${s * open}) translate(${-cx} ${-cy})`}>
			<path d={T.eye} fill={C.outline}/>
			<g transform={`translate(${-side * lookX * 5} ${lookY * 4})`}>
				{T.eyeLid.map((d, i) => <path key={'l' + i} d={d} fill={C.eyeLid}/>)}
				{T.eyeWhite.map((d, i) => <path key={'w' + i} d={d} fill={C.white}/>)}
			</g>
		</g>;
	}
	return <Side side={side}><g transform={`translate(${cx} ${cy}) scale(${squeeze} 1) translate(${-cx} ${-cy})`}>{content}</g></Side>;
};

/** Parametric mouth in the official style: flat-topped "D" with orange-red inside and pink tongue. */
const MouthShape: React.FC<{m: Mouth; expression: Pose['expression']; id: string}> = ({m, expression, id}) => {
	let {open, w, h, round} = m;
	if (open < 0.08) {
		if (expression === 'grin') ({open, w, h, round} = {open: 0.85, w: 1, h: 1, round: 0});
		else if (expression === 'o') ({open, w, h, round} = {open: 0.5, w: 0.5, h: 0.6, round: 1});
	}
	const top = A.mouthTop, full = A.mouthBottom - A.mouthTop;
	const H = full * h * open, halfW = A.mouthHalfWidth * w * (0.7 + 0.3 * Math.min(1, open));
	if (H < 4) {
		if (expression === 'flat') return <path d={`M -16,${top + 4} L 16,${top + 4}`} stroke={C.outline} strokeWidth={LINE} strokeLinecap="round"/>;
		return <path d={`M -24,${top - 2} Q -12,${top + 13} 0,${top + 1} Q 12,${top + 13} 24,${top - 2}`} stroke={C.outline} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" fill="none"/>;
	}
	const y0 = top - 0.2 * H * round, cTop = y0 - H * 0.45 * round;
	const d = `M ${-halfW},${y0} C ${-halfW * 0.55},${cTop} ${halfW * 0.55},${cTop} ${halfW},${y0} C ${halfW * 1.02},${y0 + H * 1.3} ${-halfW * 1.02},${y0 + H * 1.3} ${-halfW},${y0} Z`;
	return <g>
		<clipPath id={`${id}-mouth`}><path d={d}/></clipPath>
		<path d={d} fill={C.earIn}/>
		<ellipse cx={0} cy={y0 + H * 0.86} rx={halfW * 0.62} ry={H * 0.36} fill={C.tongue} clipPath={`url(#${id}-mouth)`}/>
		<path d={d} fill="none" stroke={C.outline} strokeWidth={LINE} strokeLinejoin="round"/>
	</g>;
};

export type HeadProps = {p: Pose; mouth: Mouth; blink: number; wobble: {sym: number; lat: number}; id: string};

export const Head: React.FC<HeadProps> = ({p, mouth, blink, wobble, id}) => {
	const turn = p.headTurn, face = turn * 26;
	return <g>
		<defs>
			<linearGradient id={`${id}-antler`} gradientUnits="userSpaceOnUse" x1={ANTLER.x0} y1={ANTLER.y0} x2={ANTLER.x1} y2={ANTLER.y1}>
				<stop offset="0.15" stopColor={C.antlerTop}/><stop offset="0.85" stopColor={C.antlerBottom}/>
			</linearGradient>
		</defs>
		<g transform={`translate(${-turn * 10} 0)`}>
			<Antler side={-1} wobble={wobble.sym + wobble.lat} id={id}/>
			<Antler side={1} wobble={wobble.sym - wobble.lat} id={id}/>
			<Ear side={-1} wobble={wobble.sym * 1.3 + wobble.lat}/>
			<Ear side={1} wobble={wobble.sym * 1.3 - wobble.lat}/>
		</g>
		<clipPath id={`${id}-head`}><path d={HEAD_PATH}/></clipPath>
		<path d={HEAD_PATH} fill={C.fur} stroke={C.outline} strokeWidth={T.outline * 2} strokeLinejoin="round" paintOrder="stroke"/>
		<g clipPath={`url(#${id}-head)`}>
			<path d={T.band} fill={C.earIn}/>
			{[-1, 1].map(s => <Side key={s} side={s}><path d={TUFT_SHADE} stroke={C.earIn} strokeWidth={11} strokeLinecap="round" fill="none"/></Side>)}
		</g>
		<g transform={`translate(${face} 0)`}>
			{p.blush > 0.3 && [-1, 1].map(s => <ellipse key={s} cx={s * (EYE.cx < 0 ? -EYE.cx : EYE.cx)} cy={EYE.y1 + 18} rx={32} ry={15} fill={C.blush} opacity={(p.blush - 0.3) * 0.6}/>)}
			<Brow side={-1} raise={p.browL}/>
			<Brow side={1} raise={p.browR}/>
			<Eye side={-1} state={p.eyes} blink={blink} squeeze={1 - 0.2 * Math.max(0, turn)} lookX={p.lookX} lookY={p.lookY}/>
			<Eye side={1} state={p.eyes} blink={blink} squeeze={1 - 0.2 * Math.max(0, -turn)} lookX={p.lookX} lookY={p.lookY}/>
			<g transform={`translate(${face * 0.3} 0)`}>
				<path d={T.muzzle} fill={C.white} stroke={C.outline} strokeWidth={T.muzzleOutline * 2} strokeLinejoin="round" paintOrder="stroke"/>
				<MouthShape m={mouth} expression={p.expression} id={id}/>
				<path d={`M 0,${A.noseBottom - 4} L 0,${A.mouthTop}`} stroke={C.outline} strokeWidth={LINE} strokeLinecap="round"/>
				<path d={T.nose} fill={C.nose}/>
			</g>
		</g>
	</g>;
};
