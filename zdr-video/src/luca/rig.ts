// Joint positions for Luca, in puppet units: ground at y = 0, up is negative.
// Proportions are measured from the official Welcome art at the traced head scale
// (head 528 wide): hoodie from the chin to y -178, shorts to -117, stub legs, big feet.
import {Pose, Arm} from './pose';

export type Pt = {x: number; y: number};
export const DIM = {
	hemY: -178, shortsH: 61, hipX: 53, ankleH: 50, footX: 53, footOut: 19, legW: 75,
	// The shoulder joint sits just inside the hoodie so the sleeve always grows out of the body.
	shoulder: {x: 132, y: -338}, neckY: -380, headDY: -215, upper: 96, fore: 78,
	/** How far down the upper arm the short sleeve reaches (0..1). */
	sleeve: 0.6,
};

const rad = (d: number) => d * Math.PI / 180;
const rot = (p: Pt, deg: number): Pt => {const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return {x: p.x * c - p.y * s, y: p.x * s + p.y * c};};
const add = (a: Pt, b: Pt): Pt => ({x: a.x + b.x, y: a.y + b.y});
const scale = (a: Pt, k: number): Pt => ({x: a.x * k, y: a.y * k});

/** Unit direction for a mirrored arm angle: 0 down, 90 outwards, 180 up. */
export const armDir = (deg: number, side: number, lean: number): Pt => rot({x: side * Math.sin(rad(deg)), y: Math.cos(rad(deg))}, lean);

export type ArmRig = {shoulder: Pt; elbow: Pt; wrist: Pt; angle: number; arm: Arm; side: number};
/** footRot: degrees the foot turns about the ankle (toes point down and out in the air). */
export type LegRig = {hip: Pt; ankle: Pt; side: number; lift: number; footRot: number};
export type Rig = {pelvis: Pt; neck: Pt; head: Pt; headAngle: number; arms: [ArmRig, ArmRig]; legs: LegRig[]};

/** All joints for a pose, before the whole-body squash/spin transform. pelvis = hoodie hem centre. */
export const rig = (p: Pose): Rig => {
	// The legs are stubs with no visible knee; a squat lowers the body and shortens them a little.
	const pelvis = {x: p.x, y: p.y + DIM.hemY + p.drop * 0.5};
	const toWorld = (local: Pt) => add(pelvis, rot(local, p.lean));
	const neck = toWorld({x: 0, y: DIM.neckY - DIM.hemY});
	const headAngle = p.lean + p.headTilt;
	const head = add(neck, rot({x: 0, y: DIM.headDY + p.headY}, headAngle));
	const arms = ([-1, 1] as const).map(side => {
		const arm = side < 0 ? p.armL : p.armR;
		const shoulder = toWorld({x: side * DIM.shoulder.x, y: DIM.shoulder.y - DIM.hemY});
		const elbow = add(shoulder, scale(armDir(arm.a, side, p.lean), DIM.upper));
		const fd = armDir(arm.a + arm.b, side, p.lean);
		const wrist = add(elbow, scale(fd, DIM.fore));
		return {shoulder, elbow, wrist, angle: Math.atan2(fd.y, fd.x) * 180 / Math.PI, arm, side};
	}) as [ArmRig, ArmRig];
	// In the air the legs spread and the toes point down; a deep landing squat splays them a little.
	const air = Math.max(0, Math.min(1, -p.y / 90));
	const splay = 30 * air + 0.45 * Math.max(0, p.drop - 12);
	const legs = ([-1, 1] as const).map(side => {
		const leg = side < 0 ? p.legL : p.legR;
		const hip = {x: pelvis.x + side * DIM.hipX, y: pelvis.y + DIM.shortsH};
		const ankle = {x: p.x + side * (DIM.footX + leg.x * 0.6 + splay), y: Math.max(p.y - DIM.ankleH - leg.lift * 0.8 - 10 * air, hip.y + 16)};
		const legDeg = Math.atan2(ankle.x - hip.x, ankle.y - hip.y) * 180 / Math.PI;
		const tuck = Math.min(1, air + leg.lift / 40);
		// Toes point down and out in the air (a star jump), partly following the leg's angle.
		return {hip, ankle, side, lift: leg.lift, footRot: -0.3 * legDeg * tuck + side * 24 * air};
	});
	return {pelvis, neck, head, headAngle, arms, legs};
};
