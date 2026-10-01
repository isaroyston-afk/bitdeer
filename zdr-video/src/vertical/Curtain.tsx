import React from 'react';
import copy from '../data/copy.json';
import {FONT, W, H} from './layout';
import {BrandLockup, LOCKUP_ASPECT} from './BrandLockup';
import {INTRO_MS} from '../timing';

// Red theatre curtain: a gold-trimmed valance across the top and two velvet tableau drapes that
// lift diagonally to tie-backs and slide off-screen as the song starts. The valance stays.
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {const t = clamp01(x); return t * t * (3 - 2 * t);};
const inOut = (x: number) => {const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;};
const outBack = (x: number) => {const t = clamp01(x), c = 1.6; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;};

/** The curtain opens as the song starts (video time) and stays open: the video ends on Luca's wave. */
export const CURTAIN = {openAt: INTRO_MS - 800, openMs: 1600};
const VALANCE_H = 150, FOLDS = 9;

/** 0 = closed, 1 = fully open (video time). */
export const curtainOpen = (videoMs: number) => inOut((videoMs - CURTAIN.openAt) / CURTAIN.openMs);

type P = {x: number; y: number};
const lerpP = (a: P, b: P, t: number): P => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
const f1 = (p: P) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

/**
 * One drape of a tableau (tie-back) curtain, drawn for the left side and mirrored for the right.
 * Opening pulls the inner bottom corner diagonally up and out to a tie-back at the side, so the
 * leading edge sweeps from the top into a diagonal swag and the folds fan out from the tie-back,
 * as on a real stage. When fully open a narrow swag stays at each side, framing the stage.
 * open 0 = closed (meets the other drape at the centre), 1 = tied back.
 */
const Drape: React.FC<{side: number; open: number; t: number; id: string}> = ({side, open: u, t, id}) => {
	const X0 = -24, half = W / 2 + 30, moving = Math.sin(Math.PI * u);
	// The bottom corner leads and the top follows, so the swag forms as it opens; heavy cloth lags.
	// In the last part of the pull the gathered drape slides out past the frame edge, so once
	// open nothing pokes into the picture except the valance.
	const ut = smooth(u), ub = smooth(Math.min(1, u * 1.15)), off = smooth((u - 0.55) / 0.45) * 150;
	const topX = half + (40 - half) * ut - off;
	const G: P = {x: half + (-30 - half) * ub + 30 * moving - off, y: H + 20 + (H * 0.5 - H - 20) * ub - 26 * moving};
	const tailX = half + (0 - half) * ub - off, floor = H + 24;
	const sway = Math.sin(t * 2.4) * 8 * moving;
	// Fold boundary p (0 = outer edge, 1 = leading edge): top -> through the tie-back -> floor.
	const edge = (p: number) => {
		const top: P = {x: X0 + (topX - X0) * p, y: -10};
		const g = lerpP({x: X0, y: G.y}, G, p);
		const c1: P = {x: top.x + (g.x - top.x) * 0.06 + sway * p, y: g.y * 0.7};
		const tail: P = {x: X0 + (tailX - X0) * p, y: floor};
		const c2: P = {x: g.x, y: g.y + (floor - g.y) * 0.6};
		return {top, c1, g, c2, tail};
	};
	const N = 11;
	const strips = Array.from({length: N}, (_, i) => {
		const a = edge(i / N), b = edge((i + 1) / N);
		return `M ${f1(b.top)} Q ${f1(b.c1)} ${f1(b.g)} Q ${f1(b.c2)} ${f1(b.tail)} L ${f1(a.tail)} Q ${f1(a.c2)} ${f1(a.g)} Q ${f1(a.c1)} ${f1(a.top)} Z`;
	});
	const e = edge(1);
	const outline = `M ${X0},-10 L ${f1(e.top)} Q ${f1(e.c1)} ${f1(e.g)} Q ${f1(e.c2)} ${f1(e.tail)} L ${X0},${floor} Z`;
	const lead = `M ${f1(e.top)} Q ${f1(e.c1)} ${f1(e.g)}`;
	// The last sliver fades as it leaves the frame, so no braid or fringe line lingers at the edge.
	const gone = smooth((u - 0.82) / 0.16);
	return <g transform={side > 0 ? `translate(${W} 0) scale(-1 1)` : undefined} opacity={1 - gone}>
		<defs>
			<clipPath id={`${id}-c`}><path d={outline}/></clipPath>
			<linearGradient id={`${id}-fold`} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stopColor="#4A0610"/><stop offset="0.38" stopColor="#B3122A"/><stop offset="0.56" stopColor="#E3384E"/>
				<stop offset="0.76" stopColor="#9C0E22"/><stop offset="1" stopColor="#4A0610"/>
			</linearGradient>
			<radialGradient id={`${id}-bunch`} gradientUnits="userSpaceOnUse" cx={G.x} cy={G.y} r={420}>
				<stop offset="0" stopColor="#1A0005" stopOpacity={0.55 * ub}/><stop offset="1" stopColor="#1A0005" stopOpacity={0}/>
			</radialGradient>
			<linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#000" stopOpacity={0.45}/><stop offset="0.22" stopColor="#000" stopOpacity={0}/>
				<stop offset="0.86" stopColor="#000" stopOpacity={0.08}/><stop offset="1" stopColor="#000" stopOpacity={0.45}/>
			</linearGradient>
		</defs>
		<path d={outline} fill="#7A0A1A"/>
		<g clipPath={`url(#${id}-c)`}>
			{strips.map((d, i) => <path key={i} d={d} fill={`url(#${id}-fold)`}/>)}
			<rect x={-40} y={-20} width={W} height={H + 60} fill={`url(#${id}-bunch)`}/>
			<rect x={-40} y={-20} width={W} height={H + 60} fill={`url(#${id}-shade)`}/>
			{/* Gold fringe along the hem. */}
			<rect x={-40} y={floor - 58} width={W} height={34} fill="#C9922E"/>
			{Array.from({length: 40}, (_, i) => <rect key={i} x={-30 + i * 19} y={floor - 58} width={7} height={34} fill="#F3CF6B" opacity={0.6}/>)}
		</g>
		{/* Gold braid down the leading edge. */}
		<path d={lead} stroke="#7A4A0E" strokeWidth={14} fill="none"/>
		<path d={lead} stroke="#E2B04A" strokeWidth={8} fill="none"/>
		{/* Tie-back rope and tassel at the gather point. */}
		{ub > 0.25 && <g opacity={smooth((ub - 0.25) / 0.3)} transform={`translate(${G.x + 26} ${G.y})`}>
			<path d="M -46,-14 Q -6,22 34,-18" stroke="#7A4A0E" strokeWidth={20} fill="none" strokeLinecap="round"/>
			<path d="M -46,-14 Q -6,22 34,-18" stroke="#E2B04A" strokeWidth={13} fill="none" strokeLinecap="round"/>
			<path d="M -42,-10 Q -6,14 30,-14" stroke="#FBE3A0" strokeWidth={3} fill="none" strokeDasharray="5 7"/>
			<circle cx={-6} cy={8} r={12} fill="#E2B04A" stroke="#7A4A0E" strokeWidth={3}/>
			<g transform={`rotate(${8 * Math.sin(t * 2.1)} -6 18)`}>
				<rect x={-14} y={16} width={16} height={18} rx={5} fill="#E2B04A" stroke="#7A4A0E" strokeWidth={3}/>
				<path d="M -20,32 L 8,32 L 14,86 L -26,86 Z" fill="#C9922E" stroke="#7A4A0E" strokeWidth={3}/>
				{[-18, -10, -2, 6].map(x => <path key={x} d={`M ${x},36 L ${x * 1.25},84`} stroke="#F3CF6B" strokeWidth={2.5}/>)}
			</g>
		</g>}
	</g>;
};

/** Valance: the fixed swag across the top that frames the stage, gold braid and tassels. */
const Valance: React.FC<{t: number}> = ({t}) => {
	const swags = 4, sw = W / swags;
	return <g>
		<defs>
			<linearGradient id="val" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5C0712"/><stop offset="0.6" stopColor="#B3122A"/><stop offset="1" stopColor="#7A0A1A"/></linearGradient>
		</defs>
		<rect x={0} y={0} width={W} height={VALANCE_H - 40} fill="url(#val)"/>
		{Array.from({length: swags}, (_, i) => {
			const x = i * sw, bob = Math.sin(t * 1.4 + i) * 3;
			return <g key={i}>
				<path d={`M ${x},${VALANCE_H - 46} Q ${x + sw / 2},${VALANCE_H + 34 + bob} ${x + sw},${VALANCE_H - 46} Z`} fill="url(#val)"/>
				<path d={`M ${x},${VALANCE_H - 46} Q ${x + sw / 2},${VALANCE_H + 34 + bob} ${x + sw},${VALANCE_H - 46}`} stroke="#E2B04A" strokeWidth={9} fill="none"/>
				<path d={`M ${x + sw},${VALANCE_H - 50} l -10,22 l 20,0 Z M ${x + sw - 8},${VALANCE_H - 30} L ${x + sw + 8},${VALANCE_H - 30} L ${x + sw + 12},${VALANCE_H + 6} L ${x + sw - 12},${VALANCE_H + 6} Z`} fill="#E2B04A"/>
			</g>;
		})}
		<rect x={0} y={0} width={W} height={18} fill="#3A040B"/>
	</g>;
};

/** Spotlight pool on the closed curtain for the title card. */
const Spot: React.FC<{o: number}> = ({o}) => <div style={{position: 'absolute', inset: 0, opacity: o,
	background: 'radial-gradient(ellipse 62% 34% at 50% 46%, rgba(255,236,190,0.42) 0%, rgba(255,220,160,0.12) 55%, rgba(0,0,0,0) 75%)'}}/>;

/** Title card shown on the closed curtain: song title and artist. */
const TitleCard: React.FC<{videoMs: number}> = ({videoMs}) => {
	const fadeOut = 1 - smooth((videoMs - (CURTAIN.openAt - 250)) / 300);
	const a = outBack((videoMs - 150) / 520), b = outBack((videoMs - 520) / 480), c = outBack((videoMs - 820) / 480);
	const shimmer = ((videoMs / 1000) * 70) % 260 - 80;
	const lockW = 420;
	return <div style={{position: 'absolute', inset: 0, opacity: fadeOut, fontFamily: FONT, textAlign: 'center'}}>
		<div style={{position: 'absolute', left: 0, right: 0, top: 560, opacity: clamp01(a), transform: `translateY(${30 * (1 - a)}px)`,
			fontWeight: 800, fontSize: 30, letterSpacing: 14, color: '#F3CF6B', textShadow: '0 3px 0 rgba(0,0,0,0.4)'}}>{copy.intro.kicker}</div>
		{/* SVG text with a gradient fill: CSS background-clip text renders as a solid block in the
		    final encode, so titles are drawn as SVG. */}
		<svg width={W} height={340} viewBox={`0 0 ${W} 340`} style={{position: 'absolute', left: 0, top: 590, overflow: 'visible',
			transform: `scale(${0.6 + 0.4 * a})`, transformOrigin: '540px 170px', opacity: clamp01(a * 1.4)}}>
			<defs>
				<linearGradient id="titleGold" x1="0" y1="0" x2="1" y2="0.25">
					<stop offset="0" stopColor="#E0A63A"/><stop offset={clamp01(shimmer / 100 - 0.1)} stopColor="#F5D27A"/>
					<stop offset={clamp01(shimmer / 100)} stopColor="#FFF6D2"/><stop offset={clamp01(shimmer / 100 + 0.12)} stopColor="#F0BE55"/><stop offset="1" stopColor="#D9982E"/>
				</linearGradient>
			</defs>
			<text x={540} y={262} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={300} letterSpacing={8} fill="#3C000A" opacity={0.6} transform="translate(0 12)">{copy.intro.title}</text>
			<text x={540} y={262} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={300} letterSpacing={8} fill="url(#titleGold)" stroke="#7A4A0E" strokeWidth={4} paintOrder="stroke">{copy.intro.title}</text>
		</svg>
		<div style={{position: 'absolute', left: 0, right: 0, top: 940, opacity: clamp01(b), transform: `translateY(${24 * (1 - b)}px)`,
			fontWeight: 700, fontSize: 34, letterSpacing: 10, color: '#FBE3B0'}}>{copy.intro.byline}</div>
		<div style={{position: 'absolute', left: 540 - lockW / 2, top: 1000, width: lockW, opacity: clamp01(c), transform: `scale(${0.8 + 0.2 * c})`,
			filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.45))'}}>
			<div style={{background: 'rgba(10,6,8,0.55)', borderRadius: 24, padding: '22px 30px', boxSizing: 'border-box'}}>
				<BrandLockup width={lockW - 60}/>
			</div>
		</div>
		<div style={{position: 'absolute', left: 0, right: 0, top: 1000 + (lockW - 60) * LOCKUP_ASPECT + 80, opacity: clamp01(c) * 0.85,
			fontWeight: 700, fontSize: 24, letterSpacing: 8, color: '#E8C98A'}}>{copy.intro.note}</div>
	</div>;
};

/** Curtain layer: drawn over everything except the safe-zone guides. */
export const Curtain: React.FC<{videoMs: number}> = ({videoMs}) => {
	const open = curtainOpen(videoMs), t = videoMs / 1000;
	const title = videoMs < CURTAIN.openAt + 200;
	return <>
		{title && <Spot o={1 - smooth((videoMs - CURTAIN.openAt) / 500)}/>}
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
			{open < 0.999 && <>
				<Drape side={-1} open={open} t={t} id="drL"/>
				<Drape side={1} open={open} t={t + 0.7} id="drR"/>
			</>}
			<Valance t={t}/>
		</svg>
		{title && <Spot o={0.55 * (1 - smooth((videoMs - CURTAIN.openAt) / 500))}/>}
		{title && <TitleCard videoMs={videoMs}/>}
	</>;
};
