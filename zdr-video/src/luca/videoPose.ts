// Luca's pose in video time: song time with the edit's cuts, cross-faded across each cut
// so the jump to the later part of the song never pops.
import {poseAt} from './choreography';
import {blend, Pose} from './pose';
import {CUTS, songMsAt, videoMsAt} from '../timing';

const CUT_BLEND_MS = 320;
const ease = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

const rawPoseAt = (videoMs: number): Pose => {
	const p = poseAt(songMsAt(videoMs));
	for (const [a] of CUTS) {
		const since = videoMs - videoMsAt(a);
		// Continue the pre-cut move for a moment and fade into the post-cut one.
		if (since >= 0 && since < CUT_BLEND_MS) return blend(poseAt(a + since), p, ease(since / CUT_BLEND_MS));
	}
	return p;
};

/**
 * Gaussian-weighted average of the pose over a short window (sigma 40 ms, 9 samples across
 * +-100 ms). This is the "motion clean-up" pass: it rounds off any corner a move or move boundary
 * leaves behind (a joint changing direction in one frame, a hand or layer switch) so everything
 * reads as one continuous performance, while beat-sized gestures (~420 ms) keep their snap.
 * Discrete fields (hand shape, eyes, which arm is in front) come from the nearest sample.
 */
const SIGMA = 40, TAPS = [-100, -75, -50, -25, 0, 25, 50, 75, 100];
const WEIGHTS = TAPS.map(t => Math.exp(-(t * t) / (2 * SIGMA * SIGMA)));
export const videoPoseAt = (videoMs: number): Pose => {
	let acc = rawPoseAt(videoMs), wsum = WEIGHTS[4];
	for (let i = 0; i < TAPS.length; i++) {
		if (TAPS[i] === 0) continue;
		const w = WEIGHTS[i];
		acc = blend(acc, rawPoseAt(videoMs + TAPS[i]), w / (wsum + w));
		wsum += w;
	}
	// blend() takes discrete fields from whichever side has t >= 0.5; restore the centre frame's.
	const c = rawPoseAt(videoMs);
	return {...acc, eyes: c.eyes, expression: c.expression,
		armL: {...acc.armL, hand: c.armL.hand, front: c.armL.front}, armR: {...acc.armR, hand: c.armR.hand, front: c.armR.front}};
};
