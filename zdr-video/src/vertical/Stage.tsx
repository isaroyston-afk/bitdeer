import React from 'react';
import {AbsoluteFill} from 'remotion';
import {W, H, LUCA} from './layout';
import {beatAt, barPhase} from '../timing';
import {energyAt, bassAt, inRange, CHORUS} from './sections';

// Privacy-themed stage: vault-dial floor, keyhole shield backdrop on an encryption hex
// mesh, security scan beam, and lock/shield/key icons that dissolve into pixels.
const TAU = Math.PI * 2;
const onBeat = (b: number, k = 2) => (0.5 + 0.5 * Math.cos(TAU * b)) ** k;
const rand = (i: number) => {const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x);};

const HORIZON = 1200;
const ICONS = Array.from({length: 14}, (_, i) => ({x: 60 + rand(i) * (W - 120), speed: 26 + rand(i + 40) * 30, size: 30 + rand(i + 80) * 26,
	phase: rand(i + 120), kind: i % 3, depth: 0.45 + rand(i + 200) * 0.55, sway: rand(i + 260) * TAU}));
const DUST = Array.from({length: 36}, (_, i) => ({x: rand(i + 300) * W, y: rand(i + 400) * HORIZON, r: 1.5 + rand(i + 500) * 2.2, tw: rand(i + 600) * TAU}));
// Light trails racing along the floor grid toward the viewer, like packets on a data highway.
const TRAILS = Array.from({length: 14}, (_, i) => ({lane: (i % 7) - 3 + (rand(i + 700) - 0.5) * 0.6, speed: 0.35 + rand(i + 720) * 0.45, phase: rand(i + 740),
	color: ['#36D0AC', '#60F770', '#FBD16A', '#7FD8FF'][i % 4]}));
// Columns of falling binary digits behind the shield, faint, for a "data" texture.
const RAIN = Array.from({length: 16}, (_, i) => ({x: 40 + i * 66 + rand(i + 800) * 20, speed: 60 + rand(i + 820) * 90, phase: rand(i + 840) * 2000, len: 6 + Math.floor(rand(i + 860) * 8)}));

// Line icons drawn in a 100 x 100 box centred on 0,0.
const Lock: React.FC = () => <g>
	<path d="M -22,-6 L -22,-22 C -22,-46 22,-46 22,-22 L 22,-6" fill="none" strokeWidth={10}/>
	<rect x={-32} y={-8} width={64} height={50} rx={10} strokeWidth={9}/>
	<circle cx={0} cy={14} r={6} stroke="none" fill="currentColor"/>
	<path d="M 0,16 L 0,28" strokeWidth={8}/>
</g>;
const Shield: React.FC = () => <g>
	<path d="M 0,-44 L 36,-30 C 36,4 24,30 0,44 C -24,30 -36,4 -36,-30 Z" strokeWidth={9} strokeLinejoin="round"/>
	<path d="M -14,0 L -3,11 L 16,-12" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
</g>;
const Key: React.FC = () => <g>
	<circle cx={-18} cy={0} r={16} strokeWidth={9}/>
	<path d="M -2,0 L 38,0 M 26,0 L 26,14 M 36,0 L 36,10" strokeWidth={9} strokeLinecap="round" fill="none"/>
</g>;
const ICON_SHAPES = [Lock, Shield, Key];

/** An icon that rises, then breaks into pixels that scatter and fade (data being erased). */
const DissolvingIcon: React.FC<{i: number; t: number; e: number}> = ({i, t, e}) => {
	const c = ICONS[i], travel = H + 240;
	const u = (c.phase + t * c.speed * (0.7 + 0.5 * e) / travel) % 1; // 0 bottom -> 1 top
	const y = H + 120 - u * travel, x = c.x + 24 * Math.sin(t * 0.6 + c.sway);
	const breakAt = 0.55 + rand(i + 900) * 0.2, k = (u - breakAt) / 0.12;
	const Icon = ICON_SHAPES[c.kind];
	const color = ['#60F770', '#36D0AC', '#FBD16A'][c.kind];
	const s = c.size / 100 * c.depth * 1.6;
	if (k < 0) return <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} fill="none" color={color} opacity={0.28 + 0.4 * c.depth}><Icon/></g>;
	if (k > 1) return null;
	return <g transform={`translate(${x} ${y})`} opacity={(0.28 + 0.4 * c.depth) * (1 - k)}>
		{Array.from({length: 9}, (_, j) => {
			const gx = (j % 3 - 1) * 26 * s, gy = (Math.floor(j / 3) - 1) * 26 * s;
			const a = rand(i * 17 + j) * TAU, d = 60 * k * c.depth;
			return <rect key={j} x={gx + Math.cos(a) * d - 7 * s} y={gy + Math.sin(a) * d - 7 * s - 30 * k} width={14 * s} height={14 * s} fill={color}/>;
		})}
	</g>;
};

export const Stage: React.FC<{ms: number}> = ({ms}) => {
	const b = beatAt(ms), e = energyAt(ms), bass = bassAt(ms), chorus = inRange(ms, CHORUS);
	const k = onBeat(b), t = ms / 1000, bar = barPhase(b);
	const flash = chorus ? Math.exp(-bar * 2.2) * 0.14 : 0;
	const drift = (a: number, sp: number) => Math.sin(t * sp + a);

	// Perspective floor lines rushing toward the viewer, one row per beat.
	const rows: number[] = [], f = b % 1;
	for (let i = 0; i < 8; i++) rows.push(HORIZON + (H - HORIZON + 200) * ((i + f) / 8) ** 2.2);
	const cols = Array.from({length: 13}, (_, i) => (i - 6) * 220);

	// Vault dial: ticks click round by one notch on every beat.
	const beatInt = Math.floor(b), click = Math.min(1, (b - beatInt) / 0.12);
	const dialRot = (beatInt + click * click * (3 - 2 * click)) * 7.5;
	const pulse = 1 + 0.05 * k * (0.5 + e * 0.5);
	const cx = LUCA.x, cy = LUCA.groundY + 6;
	// Scan beam: sweeps down across Luca once per bar in the chorus.
	const scanY = 620 + bar / 4 * 1000;

	// Aurora ribbons across the sky, drifting slowly and brightening with the music.
	const aurora = (i: number) => {
		const y0 = 300 + i * 140, amp = 70 + 30 * i, ph = t * (0.25 + 0.07 * i) + i * 1.7;
		let d = `M -100,${y0}`;
		for (let x = -100; x <= W + 100; x += 60) d += ` L ${x},${(y0 + amp * Math.sin(x / 260 + ph) + 26 * Math.sin(x / 90 - ph * 1.6)).toFixed(1)}`;
		return d;
	};

	return <AbsoluteFill style={{background: 'linear-gradient(#020309 0%, #050A1C 38%, #071528 60%, #03060C 100%)'}}>
		<AbsoluteFill style={{
			background: [
				`radial-gradient(circle at ${22 + 6 * drift(0, 0.21)}% ${24 + 5 * drift(1, 0.17)}%, rgba(54,208,172,${0.2 + 0.18 * e + 0.08 * bass * e}) 0%, rgba(54,208,172,0) 38%)`,
				`radial-gradient(circle at ${82 + 5 * drift(2, 0.19)}% ${60 + 6 * drift(3, 0.23)}%, rgba(247,107,28,${0.1 + 0.14 * e + 0.06 * bass * e}) 0%, rgba(247,107,28,0) 34%)`,
				`radial-gradient(ellipse 60% 26% at 50% ${LUCA.groundY / H * 100}%, rgba(96,247,112,${0.12 + 0.12 * e * (0.6 + 0.4 * k)}) 0%, rgba(96,247,112,0) 70%)`,
			].join(','),
		}}/>
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
			<defs>
				<pattern id="hex" width={52} height={90} patternUnits="userSpaceOnUse" patternTransform={`translate(${(t * 6) % 52} 0)`}>
					<path d="M 26,0 L 52,15 L 52,45 L 26,60 L 0,45 L 0,15 Z M 26,60 L 26,90" fill="none" stroke="#36D0AC" strokeWidth={1.4}/>
				</pattern>
				<radialGradient id="hexFade" cx="0.5" cy="0.42" r="0.6"><stop offset="0" stopColor="#fff" stopOpacity={0.9}/><stop offset="1" stopColor="#fff" stopOpacity={0}/></radialGradient>
				<mask id="hexMask"><rect width={W} height={H} fill="url(#hexFade)"/></mask>
				<linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#36D0AC"/><stop offset="1" stopColor="#60F770"/></linearGradient>
				<radialGradient id="shieldFill" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stopColor="#36D0AC" stopOpacity={0.16}/><stop offset="1" stopColor="#36D0AC" stopOpacity={0}/></radialGradient>
				<linearGradient id="beamA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36D0AC" stopOpacity={0.3}/><stop offset="1" stopColor="#36D0AC" stopOpacity={0}/></linearGradient>
				<linearGradient id="beamB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBD16A" stopOpacity={0.22}/><stop offset="1" stopColor="#FBD16A" stopOpacity={0}/></linearGradient>
				<linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#36D0AC" stopOpacity={0}/><stop offset="0.35" stopColor="#36D0AC" stopOpacity={0.45}/><stop offset="1" stopColor="#60F770" stopOpacity={0.6}/></linearGradient>
				<linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#36D0AC"/><stop offset="0.5" stopColor="#60F770"/><stop offset="1" stopColor="#FBD16A"/></linearGradient>
				<radialGradient id="floorGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#60F770" stopOpacity={0.3}/><stop offset="1" stopColor="#60F770" stopOpacity={0}/></radialGradient>
				<filter id="auroraBlur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
				<linearGradient id="trail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={0}/><stop offset="1" stopColor="#fff" stopOpacity={1}/></linearGradient>
				<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#60F770" stopOpacity={0}/><stop offset="0.85" stopColor="#60F770" stopOpacity={0.22}/><stop offset="1" stopColor="#CFFFE0" stopOpacity={0.7}/></linearGradient>
			</defs>

			{/* Aurora ribbons. */}
			<g style={{mixBlendMode: 'screen'}} filter="url(#auroraBlur)">
				{[0, 1, 2].map(i => <path key={i} d={aurora(i)} fill="none" stroke={['#36D0AC', '#60F770', '#7A6CFF'][i]} strokeWidth={90 - i * 18} strokeLinecap="round"
					opacity={(0.10 + 0.10 * e + 0.05 * bass * e) * (i === 2 ? 0.7 : 1)}/>)}
			</g>
			<rect width={W} height={HORIZON + 80} fill="url(#hex)" mask="url(#hexMask)" opacity={0.07 + 0.06 * e}/>
			{/* Binary rain. */}
			<g fontFamily="monospace" fontSize={22} fontWeight={700} fill="#36D0AC">
				{RAIN.map((c, i) => {
					const head = ((t * c.speed + c.phase) % (HORIZON + 300)) - 150;
					return <g key={i}>{Array.from({length: c.len}, (_, j) => {
						const y = head - j * 26;
						if (y < 0 || y > HORIZON) return null;
						return <text key={j} x={c.x} y={y} opacity={(j === 0 ? 0.5 : 0.22 * (1 - j / c.len)) * (0.5 + 0.5 * e)}>{rand(i * 31 + j + Math.floor(t * 4)) > 0.5 ? '1' : '0'}</text>;
					})}</g>;
				})}
			</g>
			{DUST.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#BFF7E4" opacity={0.06 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.tw))}/>)}

			{/* Keyhole shield behind Luca: a quiet brand-gradient emblem that pulses with the beat. */}
			<g transform={`translate(${cx} 1080) scale(${1 + 0.015 * k * e})`} opacity={0.5 + 0.3 * e}>
				<path d="M 0,-420 L 330,-300 C 330,20 220,250 0,380 C -220,250 -330,20 -330,-300 Z" fill="url(#shieldFill)" stroke="url(#shieldGrad)" strokeWidth={5} strokeOpacity={0.45} strokeLinejoin="round"/>
				<path d="M 0,-376 L 290,-270 C 290,0 196,210 0,330 C -196,210 -290,0 -290,-270 Z" fill="none" stroke="url(#shieldGrad)" strokeWidth={2} strokeOpacity={0.3} strokeDasharray="6 14"/>
				<circle cx={0} cy={-150} r={46} fill="none" stroke="url(#shieldGrad)" strokeWidth={5} strokeOpacity={0.35}/>
				<path d="M -22,-120 L -34,-40 L 34,-40 L 22,-120" fill="none" stroke="url(#shieldGrad)" strokeWidth={5} strokeOpacity={0.35} strokeLinejoin="round"/>
			</g>

			{ICONS.map((_, i) => <DissolvingIcon key={i} i={i} t={t} e={e}/>)}

			<g opacity={0.5 + 0.35 * e}>
				<polygon points={`-60,-40 220,-40 ${cx + 40},${LUCA.groundY} ${cx - 260},${LUCA.groundY}`} fill="url(#beamA)" opacity={0.5 + 0.5 * e * (0.7 + 0.3 * k)}/>
				<polygon points={`${W - 220},-40 ${W + 60},-40 ${cx + 260},${LUCA.groundY} ${cx - 40},${LUCA.groundY}`} fill="url(#beamB)" opacity={0.45 + 0.55 * e * (0.7 + 0.3 * (1 - k))}/>
			</g>
			<g stroke="url(#gridFade)" strokeWidth={2} opacity={0.28 + 0.2 * e}>
				{rows.map((y, i) => <line key={i} x1={0} x2={W} y1={y} y2={y} opacity={Math.min(1, (y - HORIZON) / 160)}/>)}
				{cols.map((dx, i) => <line key={'c' + i} x1={W / 2 + dx * 0.08} y1={HORIZON} x2={W / 2 + dx * 3.2} y2={H + 200}/>)}
			</g>

			{/* Light trails on the floor grid. */}
			{TRAILS.map((tr, i) => {
				const u = (tr.phase + t * tr.speed * (0.6 + 0.8 * e)) % 1, depth = u ** 2.2, len = 0.05 + 0.08 * u;
				const y1 = HORIZON + (H - HORIZON + 200) * depth, y0 = HORIZON + (H - HORIZON + 200) * Math.max(0, u - len) ** 2.2;
				const lx = (d: number) => W / 2 + tr.lane * 220 * (0.08 + 3.12 * d);
				return <line key={'tr' + i} x1={lx(Math.max(0, u - len) ** 2.2)} y1={y0} x2={lx(depth)} y2={y1} stroke={tr.color} strokeWidth={2 + 6 * depth}
					strokeLinecap="round" opacity={(0.25 + 0.6 * e) * Math.min(1, u * 4)}/>;
			})}

			{/* Vault-door dial floor. */}
			<ellipse cx={cx} cy={cy} rx={360} ry={74} fill="url(#floorGlow)"/>
			<g transform={`translate(${cx} ${cy}) scale(1 0.19)`}>
				<circle r={300 * pulse} fill="#061A17" fillOpacity={0.55} stroke="url(#dialGrad)" strokeWidth={10 / 0.19 * 0.5}/>
				<g transform={`rotate(${dialRot})`}>
					{Array.from({length: 48}, (_, i) => <line key={i} x1={0} y1={-282 * pulse} x2={0} y2={-(i % 4 ? 262 : 240) * pulse}
						transform={`rotate(${i * 7.5})`} stroke={i % 12 ? '#36D0AC' : '#FBD16A'} strokeWidth={i % 4 ? 5 : 9} strokeOpacity={i % 4 ? 0.55 : 0.9}/>)}
				</g>
				<circle r={210 * pulse} fill="none" stroke="#60F770" strokeWidth={6} strokeOpacity={0.35}/>
				<g transform={`rotate(${-dialRot * 0.5})`}>
					{[0, 1, 2, 3].map(i => <rect key={i} x={-14} y={-205 * pulse} width={28} height={36} rx={6} transform={`rotate(${i * 90})`} fill="#36D0AC" fillOpacity={0.5}/>)}
				</g>
			</g>
			<ellipse cx={cx} cy={cy} rx={300 * (1 + bar / 4 * 0.8)} ry={57 * (1 + bar / 4 * 0.8)} fill="none" stroke="url(#dialGrad)" strokeWidth={3} opacity={(1 - bar / 4) * 0.45 * e}/>

			{chorus && <g opacity={0.9}>
				<rect x={0} y={scanY - 140} width={W} height={140} fill="url(#scan)"/>
				<line x1={0} x2={W} y1={scanY} y2={scanY} stroke="#CFFFE0" strokeWidth={2.5} opacity={0.75}/>
			</g>}
		</svg>
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, rgba(200,255,230,${flash}) 0%, rgba(200,255,230,0) 60%)`}}/>
	</AbsoluteFill>;
};
