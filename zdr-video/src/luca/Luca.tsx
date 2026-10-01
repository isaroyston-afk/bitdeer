import React from 'react';
import {Pose} from './pose';
import {Mouth} from './lipsync';
import {rig} from './rig';
import {Head} from './parts/Head';
import {ArmLimb, Leg, SleeveFill, SleeveOutline, Torso, TorsoOutline} from './parts/Body';

export type LucaProps = {pose: Pose; mouth: Mouth; blink: number; wobble: {sym: number; lat: number}; id?: string};

/** Luca in puppet units (ground at 0, up negative). Place with an outer <g transform>. */
export const Luca: React.FC<LucaProps> = ({pose: p, mouth, blink, wobble, id = 'luca'}) => {
	const r = rig(p);
	const spinX = Math.cos(2 * Math.PI * p.spin);
	const body = `translate(${p.x} 0) scale(${spinX * p.squash} ${1 / p.squash}) translate(${-p.x} 0)`;
	const height = Math.max(0, -p.y);
	const torso = `translate(${r.pelvis.x} ${r.pelvis.y}) rotate(${p.lean})`;
	const back = r.arms.filter(a => !a.arm.front), front = r.arms.filter(a => a.arm.front);
	return <g>
		<ellipse cx={p.x} cy={6} rx={170 * (1 - Math.min(0.5, height / 500))} ry={26 * (1 - Math.min(0.5, height / 500))} fill="#000" opacity={0.38 - Math.min(0.2, height / 800)}/>
		<g transform={body}>
			{r.legs.map(l => <Leg key={l.side} {...l}/>)}
			{/* Hoodie and sleeves share one outline pass so the sleeves grow out of the body. */}
			<g transform={torso}><TorsoOutline/></g>
			{r.arms.map(a => <SleeveOutline key={a.side} r={a}/>)}
			<g transform={torso}><Torso id={id}/></g>
			{r.arms.map(a => <SleeveFill key={a.side} r={a} id={id}/>)}
			{back.map(a => <ArmLimb key={a.side} r={a} snip={p.snip} id={id}/>)}
			<g transform={`translate(${r.head.x} ${r.head.y}) rotate(${r.headAngle})`}>
				<Head p={p} mouth={mouth} blink={blink} wobble={wobble} id={id}/>
			</g>
			{/* Raised paws come in front of the big head; the sleeves stay behind it. */}
			{front.map(a => <ArmLimb key={a.side} r={a} snip={p.snip} id={id}/>)}
		</g>
	</g>;
};
