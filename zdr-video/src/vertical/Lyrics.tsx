import React from 'react';
import {interpolate, Easing} from 'remotion';
import {DISPLAY_LINES} from './lyricsData';
import {fitLine, LYRIC, FONT} from './layout';
import {videoMsAt} from '../timing';

const FITS = DISPLAY_LINES.map(l => fitLine(l.text));
const ease = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.85, 0.25, 1)} as const;
const AMBER = '#FFC66A';
const GREEN = 'linear-gradient(95deg, #36D0AC, #60F770)';

/**
 * Feature words get their own colour and motion once sung. anim: shimmer (gradient sweeps
 * through), pulse (heartbeat), glitch (RGB split and jitter), glow (breathing halo).
 */
type Feature = {grad: string; glow: string; anim: 'shimmer' | 'pulse' | 'glitch' | 'glow'};
const FEATURES: [RegExp, Feature][] = [
	[/^(love|spark!?)$/i, {grad: 'linear-gradient(100deg, #FF5FA2, #FFD36E 45%, #FF7AD9 70%, #FF5FA2)', glow: '255,110,170', anim: 'shimmer'}],
	[/^(heart|romance)$/i, {grad: 'linear-gradient(100deg, #FF8FB1, #F2456B)', glow: '242,69,107', anim: 'pulse'}],
	[/^(gone!?|forget|forgetting|never|seen!?)$/i, {grad: 'linear-gradient(100deg, #9FB8FF, #C9A7FF)', glow: '150,170,255', anim: 'glitch'}],
	[/^(clean|wiped|cache,?)$/i, {grad: 'linear-gradient(100deg, #8FF3FF, #FFFFFF 50%, #6FD8FF)', glow: '120,230,255', anim: 'shimmer'}],
	[/^(gpu|api|key)$/i, {grad: 'linear-gradient(100deg, #36D0AC, #60F770 50%, #B6FF8A)', glow: '96,247,112', anim: 'glow'}],
	[/^(done!?|completed\.?)$/i, {grad: 'linear-gradient(100deg, #60F770, #D9FF7A)', glow: '96,247,112', anim: 'glow'}],
	[/^(cord|through!?)$/i, {grad: 'linear-gradient(100deg, #F76B1C, #FBD16A)', glow: '247,107,28', anim: 'glitch'}],
	[/^(bye-bye|sorry…?)$/i, {grad: 'linear-gradient(100deg, #FBD16A, #FF9E6A)', glow: '251,209,106', anim: 'pulse'}],
];
const featureOf = (text: string) => FEATURES.find(([re]) => re.test(text))?.[1];

/** Style for a sung feature word, t = ms since the word started. */
const featureStyle = (f: Feature, t: number): {span: React.CSSProperties; transform: string} => {
	const s = t / 1000, on = Math.min(1, t / 180);
	const base: React.CSSProperties = {background: f.grad, backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: 'none'};
	const halo = (a: number) => `drop-shadow(0 6px 0 rgba(0,0,0,0.38)) drop-shadow(0 0 ${14 * a}px rgba(${f.glow},${0.75 * a}))`;
	if (f.anim === 'shimmer') return {span: {...base, backgroundPosition: `${(100 - (s * 90) % 200)}% 0`, filter: halo(on * (0.7 + 0.3 * Math.sin(s * 9)))},
		transform: `rotate(${-3 * on * Math.sin(s * 7)}deg)`};
	if (f.anim === 'pulse') {const beat = Math.exp(-((s * 2.2) % 1) * 5); return {span: {...base, filter: halo(on * (0.5 + 0.5 * beat))}, transform: `scale(${1 + 0.07 * beat * on})`};}
	if (f.anim === 'glitch') {
		const k = Math.floor(s * 18), j = ((k * 7919) % 13) / 13 - 0.5, burst = (k % 5 === 0 ? 1 : 0.15) * on;
		return {span: {...base, filter: `drop-shadow(${4 * burst}px 0 0 rgba(255,60,120,0.7)) drop-shadow(${-4 * burst}px 0 0 rgba(60,220,255,0.7)) drop-shadow(0 6px 0 rgba(0,0,0,0.38))`,
			opacity: 1 - 0.25 * burst * (j + 0.5)}, transform: `translateX(${6 * j * burst}px) skewX(${-10 * j * burst}deg)`};
	}
	return {span: {...base, filter: halo(on * (0.55 + 0.45 * Math.sin(s * 6)))}, transform: `translateY(${-2 * Math.sin(s * 6) * on}px)`};
};

/** Little sparks flying off the word "spark". */
const Sparks: React.FC<{t: number}> = ({t}) => <>
	{Array.from({length: 7}, (_, i) => {
		const u = ((t / 700) + i / 7) % 1, a = i * 2.4;
		return <span key={i} style={{position: 'absolute', left: `${50 + Math.cos(a) * 60 * u}%`, top: `${30 + Math.sin(a) * 90 * u - 40 * u}%`, width: 10, height: 10,
			background: i % 2 ? '#FFD36E' : '#FF7AD9', borderRadius: 2, transform: `rotate(45deg) scale(${1 - u})`, opacity: Math.min(1, t / 150) * (1 - u),
			boxShadow: '0 0 10px rgba(255,160,200,0.9)'}}/>;
	})}
</>;

/** Three-line karaoke stack: previous (dim), current (large, word fill), next (dim). */
export const Lyrics: React.FC<{ms: number; visible: number}> = ({ms, visible: base}) => {
	let visible = base;
	let scroll = 0;
	for (let i = 1; i < DISPLAY_LINES.length; i++) scroll += interpolate(ms, [DISPLAY_LINES[i].startMs - 140, DISPLAY_LINES[i].startMs + 220], [0, 1], ease);
	// In long instrumental gaps the last line steps back so Luca's freestyle takes the stage.
	let idx = 0;
	for (let i = 0; i < DISPLAY_LINES.length; i++) if (ms >= DISPLAY_LINES[i].startMs - 140) idx = i;
	const cur = DISPLAY_LINES[idx], next = DISPLAY_LINES[idx + 1];
	// Measured in video time: across the song edit's cut the gap on screen is much shorter.
	const gap = next ? videoMsAt(next.startMs) - videoMsAt(cur.endMs) : 0;
	const rest = gap > 3000 ? interpolate(ms, [cur.endMs + 350, cur.endMs + 750, next.startMs - 420, next.startMs - 140], [1, 0.3, 0.3, 1], ease) : 1;
	visible *= rest;
	if (visible <= 0.001) return null;
	return <div style={{position: 'absolute', left: LYRIC.left, width: LYRIC.right - LYRIC.left, top: 0, height: '100%', opacity: visible, fontFamily: FONT}}>
		{DISPLAY_LINES.map((line, i) => {
			const offset = i - scroll;
			if (Math.abs(offset) > 1.6) return null;
			const a = Math.min(1, Math.abs(offset));
			const scale = 1 - 0.5 * a, y = LYRIC.centerY + offset * LYRIC.spacing;
			const fit = FITS[i];
			let wordIndex = 0;
			return <div key={i} style={{
				position: 'absolute', left: 0, right: 0, top: y, transform: `translateY(-50%) scale(${scale})`, transformOrigin: 'center center',
				opacity: (1 - (offset < 0 ? 0.74 : 0.6) * a) * (Math.abs(offset) > 1 ? Math.max(0, 1.6 - Math.abs(offset)) / 0.6 : 1),
				textAlign: 'center', fontSize: fit.size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1,
				color: a > 0.5 ? '#93A09A' : '#F5F7F4', textShadow: '0 6px 0 rgba(0,0,0,0.38)',
			}}>
				{fit.rows.map((row, r) => <div key={r} style={{whiteSpace: 'nowrap'}}>
					{row.split(' ').map((_, k) => {
						const w = line.words[wordIndex++];
						const fill = interpolate(ms, [w.startMs, Math.max(w.startMs + 1, w.endMs)], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
						const since = ms - w.startMs;
						const pop = since > 0 && since < 300 ? Math.sin(Math.PI * since / 300) : 0;
						const zero = /^zero/i.test(w.text);
						const feat = !zero && a < 0.5 && since > 0 ? featureOf(w.text) : undefined;
						const fx = feat ? featureStyle(feat, since) : null;
						return <React.Fragment key={k}>
							{k > 0 ? ' ' : ''}
							<span style={{position: 'relative', display: 'inline-block', transform: `translateY(${-10 * pop * (1 - a)}px) scale(${1 + 0.07 * pop * (1 - a)}) ${fx?.transform ?? ''}`}}>
								{fx && /^spark/i.test(w.text) && <Sparks t={since}/>}
								<span style={zero && a < 0.5 ? {background: GREEN, WebkitBackgroundClip: 'text', color: 'transparent', opacity: 0.55, textShadow: 'none'} : undefined}>{w.text}</span>
								<span style={{
									position: 'absolute', left: 0, top: 0, clipPath: `inset(-20% ${100 - fill}% -20% -5%)`, opacity: 1 - a,
									...(zero ? {background: GREEN, WebkitBackgroundClip: 'text', color: 'transparent', textShadow: 'none', filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.38))'} : fx ? fx.span : {color: AMBER}),
								}}>{w.text}</span>
							</span>
						</React.Fragment>;
					})}
				</div>)}
			</div>;
		})}
	</div>;
};
