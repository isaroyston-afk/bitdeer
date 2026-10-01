import React from 'react';
import {staticFile} from 'remotion';

// The official Bitdeer AI lockup (public/bitdeer-ai-logo.png, 1200 x 300, the supplied
// "Bitdeer AI Logo-1200_300.png"), cropped to its artwork (rows 57-242) so it is never
// stretched or redrawn. The "AI" letters are transparent cut-outs in the PNG, so a white
// shape sits behind the pill to make them white as in the supplied artwork.
const SRC = {w: 1200, h: 300, top: 56, bottom: 244};
/** Pill bounds in the PNG (measured from its alpha channel). */
const PILL = {x0: 972, y0: 107, x1: 1199, y1: 222};
export const LOCKUP_ASPECT = (SRC.bottom - SRC.top) / SRC.w;

export const BrandLockup: React.FC<{width: number}> = ({width}) => (
	<svg width={width} height={width * LOCKUP_ASPECT} viewBox={`0 ${SRC.top} ${SRC.w} ${SRC.bottom - SRC.top}`} style={{display: 'block', overflow: 'visible'}}>
		<rect x={PILL.x0 + 14} y={PILL.y0 + 10} width={PILL.x1 - PILL.x0 - 28} height={PILL.y1 - PILL.y0 - 20} rx={40} fill="#FFFFFF"/>
		<image href={staticFile('bitdeer-ai-logo.png')} width={SRC.w} height={SRC.h} preserveAspectRatio="xMidYMid meet"/>
	</svg>
);
