import React from 'react';
import {STAMPS} from './lyricsData';
import {LYRIC, FONT} from './layout';

const outBack = (x: number) => {const t = Math.max(0, Math.min(1, x)), c = 2.2; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;};
const LETTER_X = [300, 540, 780];
const LETTER_GRAD = [['#36D0AC', '#60F770'], ['#F76B1C', '#FBD16A'], ['#36D0AC', '#60F770']];

/** Whether the Z-D-R stamps own the text zone. */
export const stampsActive = (ms: number) => STAMPS.some(s => ms >= s.ms - 60 && ms < s.lineEndMs + 260);

/** Giant Z / D / R letters slamming in on each hit. */
export const ZdrStamps: React.FC<{ms: number}> = ({ms}) => <>
	{STAMPS.map((s, i) => {
		const since = ms - s.ms, out = ms - (s.lineEndMs + 60);
		if (since < 0 || out > 200) return null;
		const k = i % 3, e = outBack(since / 160), leave = out > 0 ? Math.max(0, 1 - out / 200) : 1;
		const rot = [-8, 5, -4][k];
		return <svg key={i} width={300} height={300} viewBox="-150 -150 300 300" style={{position: 'absolute', left: LETTER_X[k] - 150, top: LYRIC.centerY - 150, overflow: 'visible'}}>
			<defs><linearGradient id={`zdr${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={LETTER_GRAD[k][0]}/><stop offset="1" stopColor={LETTER_GRAD[k][1]}/></linearGradient></defs>
			<g transform={`scale(${(2.1 - 1.1 * e) * leave}) rotate(${rot})`} opacity={Math.min(1, since / 60)}>
				<text x={0} y={92} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={290} fill="#000" opacity={0.35} transform="translate(0 12)">{s.letter}</text>
				<text x={0} y={92} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={290} fill={`url(#zdr${i})`} stroke="#F5F7F4" strokeWidth={10} paintOrder="stroke"
					strokeLinejoin="round">{s.letter}</text>
			</g>
		</svg>;
	})}
</>;
