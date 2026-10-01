import React from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate,interpolateColors,Easing} from 'remotion';
export const sections=[
 {t:0,bg:'#eee7d9',fg:'#252722',accent:'#c64b2c'},
 {t:9.04,bg:'#b94b31',fg:'#fff1db',accent:'#f3c68f'},
 {t:14.43,bg:'#242923',fg:'#eee7d9',accent:'#adc09b'},
 {t:21.28,bg:'#b6c5a6',fg:'#222b24',accent:'#485f45'},
 {t:29.752,bg:'#df7454',fg:'#2d2925',accent:'#fff0d5'},
 {t:37.2,bg:'#eee7d9',fg:'#252722',accent:'#c64b2c'},
 {t:43.85,bg:'#c9b7d4',fg:'#312638',accent:'#734467'},
 {t:52.203,bg:'#252a25',fg:'#eee7d9',accent:'#b6c5a6'},
 {t:59.2,bg:'#b6c5a6',fg:'#222b24',accent:'#485f45'},
 {t:65.4,bg:'#eee7d9',fg:'#252722',accent:'#c64b2c'},
 {t:71.5,bg:'#242923',fg:'#eee7d9',accent:'#b6c5a6'},
];
export function palette(t:number){let k=0;for(let i=0;i<sections.length;i++)if(t>=sections[i].t)k=i;const a=sections[Math.max(0,k-1)],b=sections[k];const p=interpolate(t,[b.t,b.t+.55],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.4,0,.2,1)});return {bg:interpolateColors(p,[0,1],[a.bg,b.bg]),fg:interpolateColors(p,[0,1],[a.fg,b.fg]),accent:interpolateColors(p,[0,1],[a.accent,b.accent]),chapter:k};}
export const Backdrop=()=>{const t=useCurrentFrame()/60,p=palette(t);return <AbsoluteFill style={{background:p.bg}}>
 <div style={{position:'absolute',inset:36,border:`1px solid ${p.fg}`,opacity:.10}}/>
 <svg width="1920" height="1080" style={{position:'absolute',opacity:.055}}><circle cx={1710+Math.sin(t*.1)*35} cy="850" r="400" stroke={p.fg} strokeWidth="1" fill="none"/><circle cx={1710+Math.sin(t*.1)*35} cy="850" r="430" stroke={p.fg} strokeWidth="1" fill="none"/></svg>
 </AbsoluteFill>};
