import React from 'react';
import {registerRoot, Composition} from 'remotion';
import {ScrollingLyrics} from './ScrollingLyrics';
import {LucaSheet} from './luca/LucaSheet';
import {VerticalAd} from './vertical/VerticalAd';
import {ContactSheet} from './vertical/ContactSheet';
import {TOTAL_FRAMES, FPS} from './timing';

registerRoot(() => <>
	<Composition id="ZeroDataRetention" component={ScrollingLyrics} durationInFrames={4854} fps={60} width={1920} height={1080}/>
	<Composition id="ZDRVertical" component={VerticalAd} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{safeGuides: false}}/>
	<Composition id="ContactSheet" component={ContactSheet} durationInFrames={1} fps={60} width={2160} height={1320}
		defaultProps={{times: [200, 2300, 6900, 17700, 30400, 37600, 49600, 53900, 58800, 62400, 73500, 76400], cols: 6, safeGuides: false}}/>
	<Composition id="LucaSheet" component={LucaSheet} durationInFrames={1} fps={60} width={2400} height={2100}
		defaultProps={{times: [28600, 29700, 30300, 32500, 35900, 37300, 39500, 41300, 45000, 46300, 50000, 52100, 53700, 55500, 75900, 78000, 79800, 82000]}}/>
</>);
