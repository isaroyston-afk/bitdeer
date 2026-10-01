// Development model sheet: Luca's real choreography sampled at chosen times (song ms).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Luca} from './Luca';
import {poseAt, segmentAt} from './choreography';
import {mouthAt} from './lipsync';
import {blinkAt, wobbleAt} from './secondary';
import {vocalAt} from '../vertical/sections';

/** zoom > 1 draws fewer, larger figures (3 per row) for close inspection of paws and joints. */
export const LucaSheet: React.FC<{times: number[]; zoom?: number}> = ({times, zoom = 1}) => <AbsoluteFill style={{background: '#10151a'}}>
	<svg width={2400} height={2100} viewBox="0 0 2400 2100">
		{times.map((t, i) => {
			const cols = zoom > 1 ? 3 : 6, cw = 2400 / cols;
			const x = cw / 2 + (i % cols) * cw, y = (zoom > 1 ? 900 : 640) + Math.floor(i / cols) * (zoom > 1 ? 1000 : 700);
			const p = poseAt(t);
			return <g key={i}>
				<g transform={`translate(${x} ${y}) scale(${0.5 * zoom})`}>
					<Luca pose={p} mouth={mouthAt(t, vocalAt(t))} blink={blinkAt(t)} wobble={wobbleAt(t, poseAt)} id={`s${i}`}/>
				</g>
				<text x={x} y={y + 50} fill="#9aa" fontSize={24} textAnchor="middle" fontFamily="Arial">{`${(t / 1000).toFixed(2)}s ${segmentAt(t).move}`}</text>
			</g>;
		})}
	</svg>
</AbsoluteFill>;
