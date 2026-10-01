import React from 'react';
import copy from '../data/copy.json';
import {BrandLockup, LOCKUP_ASPECT} from './BrandLockup';
import {HEADER, FONT} from './layout';
import {BRAND_LINES, END_MS} from './sections';
import {beatAt, JINGLE_AT} from '../timing';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {const t = clamp01(x); return t * t * (3 - 2 * t);};
const outBack = (x: number) => {const t = clamp01(x), c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// End card. The logo and subtitle stay exactly where they are in the header; the tagline is two big
// centred lines, "Nothing saved." over "Nothing stored."; Luca steps back and raises his shield.
export const END = {taglineY: [760, 890], taglineSize: 112, lucaGround: 1600, lucaScale: 0.56};
export const endProgress = (ms: number) => smooth((ms - END_MS) / 700);

const CHIMES_LAST = JINGLE_AT + 300 + 3 * 105;

/** Header lockup: snaps in on "Hey!", pulses on the sung brand lines, then glides into the end card. */
export const Header: React.FC<{ms: number}> = ({ms}) => {
	const appear = outBack((ms - 2060) / 260);
	if (appear <= 0) return null;
	const e = endProgress(ms);
	const brand = Math.max(...BRAND_LINES.map(([a, b]) => smooth((ms - a + 120) / 220) * (1 - smooth((ms - b) / 300))));
	const beat = (0.5 + 0.5 * Math.cos(2 * Math.PI * beatAt(ms))) ** 3;
	const w = HEADER.width, y = HEADER.y;
	// A little boing on the jingle's last chime.
	const boing = ms > CHIMES_LAST ? Math.exp(-(ms - CHIMES_LAST) / 220) * Math.sin((ms - CHIMES_LAST) / 38) : 0;
	const scale = appear * (1 + 0.12 * brand + 0.03 * brand * beat + 0.06 * boing);
	const labelY = HEADER.labelY;
	return <>
		<div style={{position: 'absolute', left: 540 - w / 2, top: y - (w * LOCKUP_ASPECT) / 2, width: w, transform: `scale(${scale})`, transformOrigin: 'center center',
			filter: brand > 0.01 ? `drop-shadow(0 0 ${28 * brand}px rgba(96,247,112,${0.55 * brand}))` : undefined}}>
			<BrandLockup width={w}/>
		</div>
		<div style={{position: 'absolute', left: 0, right: 0, top: labelY - 16, textAlign: 'center', fontFamily: FONT, fontWeight: 700,
			fontSize: 24, letterSpacing: 7, color: e > 0.5 ? '#DDE7E2' : '#9FB0A8', opacity: clamp01((ms - 2200) / 300)}}>
			{copy.subtitle}
		</div>
	</>;
};

/** Dims the stage (not Luca) behind the end card. */
export const EndDim: React.FC<{ms: number}> = ({ms}) => {
	const e = endProgress(ms);
	return e > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(3,6,10,${0.5 * e})`}}/> : null;
};

// The jingle's four chime notes (end-jingle.wav: first at 0.30 s, then every 0.105 s).
const CHIMES = [0, 1, 2, 3].map(k => JINGLE_AT + 300 + k * 105);
const CHIME_X = [-230, -80, 80, 230];

/** Sparkles that pop above the logo on each chime of the jingle, then a final burst. */
const Chimes: React.FC<{ms: number}> = ({ms}) => <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
	{CHIMES.map((t, k) => {
		const u = (ms - t) / 700;
		if (u < 0 || u > 1) return null;
		const r = (k === 3 ? 34 : 24) * outBack(u / 0.25) * (1 - u), x = 540 + CHIME_X[k] * 1.25, y = HEADER.y + 70 + 26 * u;
		return <path key={k} transform={`translate(${x} ${y}) rotate(${45 * u})`} fill={['#36D0AC', '#60F770', '#FBD16A', '#FFFFFF'][k]} opacity={1 - u * u}
			d={`M 0,${-r} C ${r * 0.16},${-r * 0.16} ${r * 0.16},${-r * 0.16} ${r},0 C ${r * 0.16},${r * 0.16} ${r * 0.16},${r * 0.16} 0,${r} C ${-r * 0.16},${r * 0.16} ${-r * 0.16},${r * 0.16} ${-r},0 C ${-r * 0.16},${-r * 0.16} ${-r * 0.16},${-r * 0.16} 0,${-r} Z`}/>;
	})}
	{Array.from({length: 14}, (_, i) => {
		const u = (ms - CHIMES[3]) / 900;
		if (u < 0 || u > 1) return null;
		const a = i / 14 * Math.PI * 2, d = 90 + 260 * (1 - (1 - u) ** 3);
		return <circle key={'b' + i} cx={540 + Math.cos(a) * d * 1.4} cy={HEADER.y + Math.sin(a) * d * 0.4} r={7 * (1 - u)} fill={i % 2 ? '#60F770' : '#FBD16A'} opacity={1 - u}/>;
	})}
</svg>;

/** Back layer: flash and chime sparkles over the stage. Front layer (front): the tagline, which
 * stays readable in front of the closing curtain. */
export const EndCard: React.FC<{ms: number; front?: boolean}> = ({ms, front = false}) => {
	const e = endProgress(ms);
	if (e <= 0) return null;
	const flash = Math.exp(-Math.max(0, ms - END_MS) / 160) * 0.35;
	if (!front) return <>
		<div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 42%, rgba(200,255,230,${flash}) 0%, rgba(200,255,230,0) 65%)`}}/>
	</>;
	return <>
		<Chimes ms={ms}/>
		{/* SVG text: CSS background-clip text renders as solid bars in the final encode. */}
		<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
			<defs>
				{copy.endCard.tagline.map((_, i) => {
					const shine = clamp01(((ms - END_MS - 900 - i * 180) / 900) * 1.6 - 0.3);
					return <linearGradient key={i} id={`tag${i}`} x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stopColor={i ? '#36D0AC' : '#F5F7F4'}/><stop offset={clamp01(shine - 0.08)} stopColor={i ? '#60F770' : '#F5F7F4'}/>
						<stop offset={shine} stopColor="#FFFFFF"/><stop offset={clamp01(shine + 0.1)} stopColor={i ? '#60F770' : '#E9FFF1'}/><stop offset="1" stopColor={i ? '#36D0AC' : '#F5F7F4'}/>
					</linearGradient>;
				})}
			</defs>
			{copy.endCard.tagline.map((line, i) => {
				const k = outBack((ms - END_MS - 380 - i * 260) / 420);
				const y = END.taglineY[i], size = END.taglineSize;
				const base = y + size * 0.36;
				return <g key={i} opacity={clamp01(k * 1.5)} transform={`translate(540 ${base + 40 * (1 - k)}) scale(${0.85 + 0.15 * k}) translate(-540 ${-base})`}>
					<text x={540} y={base + 8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} letterSpacing={-2} fill="#000" opacity={0.45}>{line}</text>
					<text x={540} y={base} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} letterSpacing={-2} fill={`url(#tag${i})`}>{line}</text>
				</g>;
			})}
		</svg>
	</>;
};
