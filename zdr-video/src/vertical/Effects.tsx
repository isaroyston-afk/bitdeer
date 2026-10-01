import React from 'react';
import {SEGMENTS} from '../luca/choreography';
import {SHIELD_HITS, VICTORY_MS} from '../luca/moves';
import {Pose} from '../luca/pose';
import {rig} from '../luca/rig';
import {beatAt} from '../timing';
import {FONT} from './layout';

const TAU = Math.PI * 2;
const HEART = 'M 0,-14 C 10,-34 44,-30 44,-4 C 44,20 18,36 0,52 C -18,36 -44,20 -44,-4 C -44,-30 -10,-34 0,-14 Z';
const outBack = (x: number) => {const t = Math.max(0, Math.min(1, x)), c = 2; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;};

type Place = {x: number; y: number; s: number};

const active = (ms: number, move: string) => SEGMENTS.filter(s => s.move === move && ms >= s.start && ms < s.end + 500);

const Sparkle: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => (
	<path transform={`translate(${x} ${y})`} opacity={o} fill="#FFF6C9"
		d={`M 0,${-r} C ${r * 0.18},${-r * 0.18} ${r * 0.18},${-r * 0.18} ${r},0 C ${r * 0.18},${r * 0.18} ${r * 0.18},${r * 0.18} 0,${r} C ${-r * 0.18},${r * 0.18} ${-r * 0.18},${r * 0.18} ${-r},0 C ${-r * 0.18},${-r * 0.18} ${-r * 0.18},${-r * 0.18} 0,${-r} Z`}/>
);

/** Props that react to Luca's moves: hearts, sparkles, question marks, check stamp, confetti. */
export const Effects: React.FC<{ms: number; pose: Pose; place: Place; layer: 'back' | 'front'}> = ({ms, pose, place, layer}) => {
	const r = rig(pose), b = beatAt(ms);
	const to = (p: {x: number; y: number}) => ({x: place.x + p.x * place.s, y: place.y + p.y * place.s});
	const head = to(r.head), chest = to({x: r.pelvis.x, y: r.pelvis.y - 150});
	const items: React.ReactNode[] = [];
	if (layer === 'front') {

	for (const s of active(ms, 'heartHands')) {
		const since = ms - s.start, fadeOut = Math.max(0, 1 - Math.max(0, ms - s.end) / 300);
		const k = (0.5 + 0.5 * Math.cos(TAU * b)) ** 3;
		const e = outBack(since / 300) * fadeOut;
		items.push(<path key={'h' + s.start} d={HEART} transform={`translate(${chest.x} ${chest.y - 10}) scale(${(1.3 + 0.25 * k) * e})`} fill="url(#fxHeart)" stroke="#46210A" strokeWidth={6}/>);
		for (let i = 0; i < 4; i++) {
			const t = ((since / 1000 + i * 0.35) % 1.4) / 1.4;
			items.push(<path key={`hs${s.start}-${i}`} d={HEART} transform={`translate(${chest.x + (i % 2 ? 1 : -1) * (90 + 40 * t)} ${chest.y - 60 - 260 * t}) scale(${0.45 * (1 - t) * fadeOut})`} fill="#FF7A9A" opacity={1 - t}/>);
		}
	}

	for (const s of active(ms, 'wipe')) {
		if (ms >= s.end) continue;
		const since = ms - s.start;
		for (let i = 0; i < 6; i++) {
			const t = ((since / 1000) * 1.6 + i / 6) % 1;
			const w = to(r.arms[1].wrist);
			items.push(<Sparkle key={`sp${s.start}-${i}`} x={w.x + Math.cos(i * 2.1) * 70 * t} y={w.y + Math.sin(i * 2.1) * 70 * t - 30 * t} r={22 * (1 - t) + 4} o={1 - t}/>);
		}
	}

	for (const move of ['think', 'confused']) for (const s of active(ms, move)) {
		const since = ms - s.start, fadeOut = Math.max(0, 1 - Math.max(0, ms - s.end) / 300);
		[0, 1, 2].forEach(i => {
			const t = Math.max(0, since - i * 260) / 1000, e = outBack(t / 0.3) * fadeOut;
			if (t <= 0) return;
			const x = head.x + [150, 210, 110][i] * place.s / 0.64, y = head.y - [230, 150, 300][i] * place.s / 0.64 - 10 * Math.sin(t * 4 + i);
			items.push(<text key={`q${s.start}-${i}`} x={x} y={y} fontFamily={FONT} fontWeight={900} fontSize={[92, 64, 52][i] * place.s / 0.64} fill="#FBD16A" stroke="#46210A" strokeWidth={6} paintOrder="stroke"
				textAnchor="middle" transform={`rotate(${[12, -10, 18][i]} ${x} ${y})`} opacity={e}>?</text>);
		});
	}

	for (const s of active(ms, 'thumbsUp')) {
		const since = ms - s.start - 150, fadeOut = Math.max(0, 1 - Math.max(0, ms - s.end) / 300);
		if (since < 0) continue;
		const e = outBack(since / 260) * fadeOut, x = head.x + 200, y = head.y - 170;
		items.push(<g key={'ck' + s.start} transform={`translate(${x} ${y}) scale(${e}) rotate(-8)`}>
			<circle r={62} fill="url(#fxCheck)" stroke="#46210A" strokeWidth={8}/>
			<path d="M -28,2 L -8,22 L 30,-22" stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
		</g>);
	}

	for (const s of active(ms, 'callMe')) {
		if (ms >= s.end) continue;
		const w = to(r.arms[1].wrist), since = ms - s.start;
		[0, 1, 2].forEach(i => {
			const t = ((since / 600) + i / 3) % 1;
			items.push(<path key={`cm${i}`} d={`M ${w.x + 50 + 40 * t},${w.y - 50 - 40 * t} a ${40 + 40 * t} ${40 + 40 * t} 0 0 1 ${20},${60 + 40 * t}`} stroke="#60F770" strokeWidth={8} strokeLinecap="round" fill="none" opacity={1 - t}/>);
		});
	}

	}

	// End card: Luca's shield (held on his left paw, screen left) stops incoming attacks. Each attack
	// is a thin red data bolt with a glitchy trail that streaks in from the left; on impact a hex
	// barrier flares in a ripple across the shield and the bolt splits into sparks that fade.
	if (layer === 'front') for (const s of active(ms, 'shieldUp')) {
		const lms = ms - s.start, arm = r.arms[0];
		const appear = outBack((lms - 280) / 360);
		if (appear <= 0) continue;
		const w = to(arm.wrist), sc = place.s / 0.64;
		const sx = w.x - 20 * sc, sy = w.y - 30 * sc, R = 118 * sc * appear;
		const victory = Math.max(0, Math.min(1, (lms - VICTORY_MS) / 400));
		let flare = 0;
		SHIELD_HITS.forEach((h, k) => {
			const big = k === SHIELD_HITS.length - 1, g = big ? 1.4 : 1;
			const since = lms - h;
			if (since >= 0 && since < 500) flare = Math.max(flare, Math.exp(-since / 140) * g);
			// The bolt: a bright head with a jagged, fading tail, arriving on a shallow arc.
			const fly = (lms - (h - 300)) / 300;
			if (fly > 0 && fly < 1) {
				const y0 = sy - 180 * sc + k * 110 * sc, hit = {x: sx - R * 0.78, y: sy - 20 * sc + (k - 1.5) * 24 * sc};
				const P = (u: number) => ({x: -60 + (hit.x + 60) * u, y: y0 + (hit.y - y0) * u - 40 * sc * Math.sin(Math.PI * u)});
				const head = P(fly);
				let d = '';
				for (let j = 0; j <= 10; j++) {
					const u = Math.max(0, fly - 0.28 * j / 10), p = P(u), jit = ((k * 13 + j * 7 + Math.floor(lms / 33)) % 5 - 2) * 4 * sc;
					d += `${j ? 'L' : 'M'} ${p.x.toFixed(1)},${(p.y + (j ? jit : 0)).toFixed(1)} `;
				}
				items.push(<g key={`bolt${k}`}>
					<path d={d} stroke="#FF2E4D" strokeWidth={10 * sc * g} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} filter="url(#fxGlow)"/>
					<path d={d} stroke="#FF7A8C" strokeWidth={3.5 * sc * g} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
					<circle cx={head.x} cy={head.y} r={9 * sc * g} fill="#FFE3E8" filter="url(#fxGlow)"/>
				</g>);
			}
			// Sparks: thin streaks flung back off the barrier, fading quickly.
			const t = since / 380;
			if (t > 0 && t < 1) {
				const at = {x: sx - R * 0.8, y: sy - 20 * sc + (k - 1.5) * 24 * sc};
				for (let j = 0; j < (big ? 12 : 7); j++) {
					const a = Math.PI * (0.62 + 0.76 * ((j * 0.618 + k * 0.3) % 1)), v = (70 + (j * 29) % 80) * sc * g;
					const d1 = v * (1 - (1 - t) ** 2), d0 = Math.max(0, d1 - 26 * sc);
					items.push(<line key={`sp${k}-${j}`} x1={at.x + Math.cos(a) * d0} y1={at.y + Math.sin(a) * d0 + 40 * t * t * sc} x2={at.x + Math.cos(a) * d1} y2={at.y + Math.sin(a) * d1 + 40 * t * t * sc}
						stroke={j % 3 ? '#FF6B81' : '#FFFFFF'} strokeWidth={3 * sc} strokeLinecap="round" opacity={1 - t}/>);
				}
				// Ripple ring travelling out across the barrier from the impact point.
				items.push(<ellipse key={`rip${k}`} cx={at.x + 30 * sc} cy={at.y} rx={(20 + 150 * t) * sc} ry={(30 + 190 * t) * sc} fill="none" stroke="#9BFFC6" strokeWidth={4 * sc * (1 - t)} opacity={0.8 * (1 - t)}/>);
			}
		});
		// Hex barrier in front of the shield: barely there at rest, lights up on each impact.
		items.push(<g key={'barrier' + s.start} opacity={Math.min(1, 0.14 * appear + 0.75 * flare)}>
			<ellipse cx={sx - 10 * sc} cy={sy} rx={R * 1.5} ry={R * 1.75} fill="url(#fxDome)"/>
			<ellipse cx={sx - 10 * sc} cy={sy} rx={R * 1.5} ry={R * 1.75} fill="url(#fxHex)" opacity={0.7}/>
			<ellipse cx={sx - 10 * sc} cy={sy} rx={R * 1.5} ry={R * 1.75} fill="none" stroke="#9BFFC6" strokeWidth={2.5}/>
		</g>);
		// The shield: brand-gradient crest with a keyhole and white rim; a white flash on impact.
		items.push(<g key={'shield' + s.start} transform={`translate(${sx} ${sy}) scale(${appear * sc * (1 + 0.04 * flare)}) rotate(${-8 + 6 * victory})`}>
			<path d="M 0,-128 L 98,-92 C 98,6 66,74 0,116 C -66,74 -98,6 -98,-92 Z" fill="#46210A"/>
			<path d="M 0,-112 L 84,-80 C 84,4 56,62 0,98 C -56,62 -84,4 -84,-80 Z" fill="url(#fxShield)" stroke="#FFFFFF" strokeWidth={8} strokeLinejoin="round"/>
			<path d="M 0,-96 L 70,-70 C 70,-10 52,40 0,76" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.35} strokeLinecap="round"/>
			<circle cx={0} cy={-18} r={20} fill="#0E3B2E"/>
			<path d="M -9,-4 L -16,42 L 16,42 L 9,-4 Z" fill="#0E3B2E"/>
			<path d="M 0,-112 L 84,-80 C 84,4 56,62 0,98 C -56,62 -84,4 -84,-80 Z" fill="#FFFFFF" opacity={0.5 * Math.min(1, flare)}/>
		</g>);
	}

	// Confetti burst on the first "Zero" of each chorus entry, behind Luca.
	if (layer === 'back') for (const s of SEGMENTS.filter(x => x.move === 'chorus')) {
		const t = (ms - s.start) / 1000;
		if (t < 0 || t > 1.4) continue;
		for (let i = 0; i < 26; i++) {
			const a = -Math.PI / 2 + (i / 26 - 0.5) * 2.6, v = 700 + (i * 37 % 300);
			const x = head.x + Math.cos(a) * v * t, y = head.y + Math.sin(a) * v * t + 900 * t * t;
			const c = ['#36D0AC', '#60F770', '#FBD16A', '#F76B1C', '#FFFFFF'][i % 5];
			items.push(<rect key={`cf${s.start}-${i}`} x={-9} y={-5} width={18} height={10} fill={c} opacity={Math.max(0, 1 - t / 1.4)}
				transform={`translate(${x} ${y}) rotate(${t * 720 + i * 40}) scale(${1 - 0.4 * Math.abs(Math.sin(t * 9 + i))} 1)`}/>);
		}
	}

	return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
		<defs>
			<linearGradient id="fxHeart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8FB1"/><stop offset="1" stopColor="#F2456B"/></linearGradient>
			<linearGradient id="fxCheck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#36D0AC"/><stop offset="1" stopColor="#60F770"/></linearGradient>
			<linearGradient id="fxShield" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#36D0AC"/><stop offset="1" stopColor="#60F770"/></linearGradient>
			<radialGradient id="fxDome" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stopColor="#60F770" stopOpacity={0}/><stop offset="1" stopColor="#60F770" stopOpacity={0.4}/></radialGradient>
			<pattern id="fxHex" width={26} height={45} patternUnits="userSpaceOnUse"><path d="M 13,0 L 26,7.5 L 26,22.5 L 13,30 L 0,22.5 L 0,7.5 Z M 13,30 L 13,45" fill="none" stroke="#9BFFC6" strokeWidth={1.4}/></pattern>
			<filter id="fxGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
		</defs>
		{items}
	</svg>;
};
