import React from 'react';
import {useCurrentFrame,interpolate} from 'remotion';
export const TokenCoins=()=>{
 const f=useCurrentFrame(),out=interpolate(f,[78,93],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <svg width="740" height="1080" viewBox="0 0 740 1080" style={{position:'absolute',left:1050,top:0,overflow:'hidden',opacity:interpolate(f,[0,9,139,149],[.4,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>
 <defs><linearGradient id="coinGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe5a0"/><stop offset=".5" stopColor="#efb642"/><stop offset="1" stopColor="#cc8723"/></linearGradient></defs>
 {Array.from({length:11},(_,i)=>{const t=((f+i*19)%94)/94,y=-110+1320*t*t,x=145+(i%4)*128+Math.sin(i*2.4)*30+out*Math.sin(i*3)*t*75,sx=.28+.72*Math.abs(Math.cos(f*.067+i*1.7));return <g key={i} transform={`translate(${x} ${y}) rotate(${i*17+f*(i%2?-.6:.5)}) scale(${sx} 1)`} opacity={Math.min(1,t*6)}>
 <ellipse cx="6" cy="4" rx="52" ry="52" fill="#96642b"/><circle r="52" fill="url(#coinGold)" stroke="#9b6929" strokeWidth="3"/><circle r="40" fill="none" stroke="#fff0b9" strokeWidth="3" opacity=".9"/><path d="M-17 -19H17M0 -19V23" stroke="#8c5c23" strokeWidth="7" strokeLinecap="round"/><path d="M-34 -21Q-24 -39 -6 -41" stroke="#fff7d7" strokeWidth="4" fill="none" strokeLinecap="round"/>
 </g>})}
 </svg>;
};
