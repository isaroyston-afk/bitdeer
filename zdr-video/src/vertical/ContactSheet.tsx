// Development contact sheet: several moments of the vertical ad in one still.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {VerticalAd} from './VerticalAd';

export const ContactSheet: React.FC<{times: number[]; cols: number; safeGuides?: boolean}> = ({times, cols, safeGuides}) => {
	const s = 1 / 3;
	return <AbsoluteFill style={{background: '#222'}}>
		{times.map((t, i) => <div key={i} style={{position: 'absolute', left: (i % cols) * 360, top: Math.floor(i / cols) * 660, width: 360, height: 660}}>
			<div style={{position: 'absolute', width: 1080, height: 1920, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden'}}>
				<VerticalAd atMs={t} safeGuides={safeGuides}/>
			</div>
			<div style={{position: 'absolute', top: 640, left: 4, color: '#fff', font: '16px Arial'}}>{(t / 1000).toFixed(2)}s</div>
		</div>)}
	</AbsoluteFill>;
};
