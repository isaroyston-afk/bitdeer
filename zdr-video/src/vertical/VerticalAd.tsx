import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import {FPS, beatAt, barPhase, songMsAt, videoMsAt, PIECES, JINGLE_AT, JINGLE_MS} from '../timing';
import {videoPoseAt} from '../luca/videoPose';
import {mouthAt} from '../luca/lipsync';
import {blinkAt, wobbleAt} from '../luca/secondary';
import {Luca} from '../luca/Luca';
import {Stage} from './Stage';
import {Lyrics} from './Lyrics';
import {ZdrStamps, stampsActive} from './AdLibs';
import {Effects} from './Effects';
import {Header, EndCard, EndDim, endProgress, END} from './EndCard';
import {Curtain} from './Curtain';
import {END_MS} from './sections';
import {SHIELD_HITS} from '../luca/moves';
import {LUCA, SAFE, W, H} from './layout';
import {CHORUS, inRange, vocalAt} from './sections';

for (const w of [600, 700, 800, 900]) loadFont({family: 'Inter', url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: String(w)});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const busy = (ms: number) => stampsActive(ms) ? 1 : 0;
const f = (ms: number) => Math.round(ms / 1000 * FPS);

/** Crossfade length at each cut, in frames. */
const XFADE = 4;

/** The edited soundtrack: kept pieces of audio.mp3 with equal-power crossfades at each cut,
 * then a short sign-off jingle on the end card. */
const Soundtrack: React.FC = () => <>
	{PIECES.map((p, i) => {
		const dur = f(p.songEnd - p.songStart) + (i < PIECES.length - 1 ? XFADE : 0), first = i === 0, last = i === PIECES.length - 1;
		const eq = (x: number) => Math.sin(Math.PI / 2 * Math.max(0, Math.min(1, x)));
		return <Sequence key={i} from={f(p.videoStart) - (first ? 0 : XFADE)} durationInFrames={dur + (first ? 0 : XFADE)} layout="none">
			<Audio src={staticFile('audio.mp3')} trimBefore={f(p.songStart) - (first ? 0 : XFADE)} trimAfter={f(p.songStart) + dur}
				volume={(fr: number) => Math.min(first ? 1 : eq((fr + 1) / (2 * XFADE)), last ? 1 : eq((dur + (first ? 0 : XFADE) - fr) / (2 * XFADE)))}/>
		</Sequence>;
	})}
	{/* Shield finale effects (shing, whooshes, blocks); timed against SHIELD_HITS, see make-shield-sfx.mjs. */}
	<Sequence from={f(videoMsAt(END_MS))} durationInFrames={f(SHIELD_HITS[SHIELD_HITS.length - 1] + 650)} layout="none">
		<Audio src={staticFile('shield-sfx.wav')}/>
	</Sequence>
	<Sequence from={f(videoMsAt(JINGLE_AT))} durationInFrames={f(JINGLE_MS)} layout="none">
		<Audio src={staticFile('end-jingle.wav')}/>
	</Sequence>
</>;

const SafeGuides: React.FC = () => <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
	<rect x={0} y={0} width={W} height={SAFE.top} fill="rgba(255,0,80,0.25)"/>
	<rect x={0} y={SAFE.bottom} width={W} height={H - SAFE.bottom} fill="rgba(255,0,80,0.25)"/>
	<rect x={SAFE.buttonsLeft} y={SAFE.buttonsTop} width={W - SAFE.buttonsLeft} height={SAFE.bottom - SAFE.buttonsTop} fill="rgba(255,0,80,0.25)"/>
</svg>;

/** atMs (dev contact sheets) is video time. Everything below runs on song time (ms). */
export const VerticalAd: React.FC<{safeGuides?: boolean; atMs?: number}> = ({safeGuides = false, atMs}) => {
	const frame = useCurrentFrame(), videoMs = atMs ?? frame / FPS * 1000, ms = songMsAt(videoMs);
	const pose = videoPoseAt(videoMs);
	const mouth = mouthAt(ms, vocalAt(ms));
	const blink = pose.eyes === 'open' || pose.eyes === 'wide' ? blinkAt(ms) : 0;
	const wobble = wobbleAt(videoMs, videoPoseAt);
	const e = endProgress(ms);
	const place = {x: LUCA.x, y: lerp(LUCA.groundY, END.lucaGround, e), s: lerp(LUCA.scale, END.lucaScale, e)};

	const b = beatAt(ms);
	const punch = inRange(ms, CHORUS) ? 0.028 * Math.exp(-barPhase(b) * 3) + 0.006 * (0.5 + 0.5 * Math.cos(2 * Math.PI * b)) ** 4 : 0;
	const lyricVisible = (1 - Math.max(0, Math.min(1, (ms - END_MS) / 220))) * (1 - [-80, -40, 0, 40, 80].reduce((s, d) => s + busy(ms + d), 0) / 5);

	return <AbsoluteFill style={{background: '#03060A', overflow: 'hidden', width: W, height: H}}>
		{atMs === undefined && <Soundtrack/>}
		<AbsoluteFill style={{transform: `scale(${1 + punch})`, transformOrigin: '540px 1150px'}}>
			<Stage ms={ms}/>
			<Lyrics ms={ms} visible={lyricVisible}/>
			<ZdrStamps ms={ms}/>
			<EndDim ms={ms}/>
			<Effects ms={ms} pose={pose} place={place} layer="back"/>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				<g transform={`translate(${place.x} ${place.y}) scale(${place.s})`}>
					<Luca pose={pose} mouth={mouth} blink={blink} wobble={wobble} id={`luca${Math.round(ms)}`}/>
				</g>
			</svg>
			<Effects ms={ms} pose={pose} place={place} layer="front"/>
		</AbsoluteFill>
		<EndCard ms={ms}/>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}}/>
		<Curtain videoMs={videoMs}/>
		<Header ms={ms}/>
		<EndCard ms={ms} front/>
		{safeGuides && <SafeGuides/>}
	</AbsoluteFill>;
};
