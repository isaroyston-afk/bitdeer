import React from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate,Easing} from 'remotion';
const ease={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)} as const;
// Attack markers estimated from the instrumental's 10 ms RMS envelope.
const hits=[3,29,55,78,104,130,155,180,206,230,244,256,269,281,293,306,318];
const cards=[
 {word:'TOKENS',sub:'INPUT / 01',x:155,y:165,w:730,h:245,r:-7,bg:'#b8c8ac',fg:'#242923',type:'tokens'},
 {word:'PROMPT',sub:'TEMPORARY CONTEXT',x:965,y:205,w:690,h:265,r:8,bg:'#eee7d9',fg:'#242923',type:'prompt'},
 {word:'WEIGHTS',sub:'COMPUTE / 02',x:475,y:445,w:805,h:280,r:-3,bg:'#bcacd4',fg:'#312638',type:'chip'},
 {word:'OUTPUT',sub:'TASK COMPLETED',x:1055,y:575,w:620,h:280,r:5,bg:'#e47758',fg:'#302721',type:'done'},
 {word:'CACHE',sub:'VOLATILE MEMORY',x:165,y:650,w:710,h:240,r:-9,bg:'#e5b753',fg:'#302721',type:'cache'},
 {word:'FORGET',sub:'CLEAR / 03',x:540,y:240,w:875,h:330,r:6,bg:'#eee7d9',fg:'#242923',type:'delete'},
];
export const BuildScene=()=>{
 const f=useCurrentFrame(),phase=hits.filter(h=>f>=h).length-1;
 const clear=interpolate(f,[306,324],[0,1],ease);
 const jolt=phase>=0?interpolate(f,[hits[phase],hits[phase]+8],[1,0],ease):0;
 return <AbsoluteFill style={{background:'#242923',overflow:'hidden'}}>
 <div style={{position:'absolute',inset:70,border:'1px solid #b8c8ac',opacity:.18}}/>
 <div style={{position:'absolute',top:120,left:130,fontFamily:'Nimbus Mono PS,monospace',fontSize:26,letterSpacing:5,color:'#b8c8ac'}}>INPUT / COMPUTE / OUTPUT / CLEAR</div>
 <div style={{position:'absolute',left:0,right:0,top:430,fontFamily:'Nimbus Sans Narrow,sans-serif',fontSize:220,fontWeight:900,color:'#b8c8ac',opacity:.06,whiteSpace:'nowrap',translate:`${-f*2}px 0px`}}>TEMPORARY TEMPORARY TEMPORARY</div>
 <AbsoluteFill style={{translate:`${jolt*(phase%2?7:-7)}px ${-jolt*4}px`,scale:1+Math.min(f,280)*.00022}}>
 {cards.map((c,i)=>{
 const start=hits[i],v=interpolate(f,[start,start+14],[0,1],ease);
 if(f<start)return null;
 const active=phase>=6&&(phase-6)%6===i;
 
 const exit=interpolate(f,[293+i*3,319+i*.7],[0,1],ease);
 return <div key={c.word} style={{position:'absolute',left:c.x,top:c.y,width:c.w,height:c.h,background:c.bg,color:c.fg,padding:'24px 32px',boxSizing:'border-box',border:`3px solid ${c.fg}`,boxShadow:'10px 14px 0 #10180f70',transformOrigin:'center',rotate:`${c.r+(active?2:0)}deg`,translate:`${(1-v)*(i%2?620:-620)+(960-c.x-c.w/2)*(exit+(active?.2:0))}px ${(1-v)*100+(540-c.y-c.h/2)*(exit+(active?.2:0))}px`,scale:(.92+.08*v+(active?.18:0))*(1-exit*.75),opacity:(1-exit)*v,zIndex:active?30:10+i,overflow:'hidden'}}>
 <div style={{fontFamily:'Nimbus Mono PS,monospace',fontSize:21,letterSpacing:3}}>{c.sub}</div>
 <div style={{fontFamily:i===5?'P052,serif':'Nimbus Sans Narrow,sans-serif',fontStyle:i===5?'italic':'normal',fontSize:i===5?160:115,lineHeight:1.04,fontWeight:900,letterSpacing:-3,position:'relative',display:'inline-block'}}>{c.word}{i===5&&<span style={{position:'absolute',left:0,top:'43%',height:8,width:`${interpolate(f,[start+12,start+29],[0,100],ease)}%`,background:'#bd4937'}}/>}</div>
 <svg width="100%" height="67" viewBox="0 0 700 67" preserveAspectRatio="xMinYMid meet">
 {c.type==='tokens'?Array.from({length:10},(_,k)=><rect key={k} x={k*65+((f-start)*2%25)} y="17" width="43" height="24" rx="5" fill={c.fg}/>):c.type==='cache'?Array.from({length:18},(_,k)=><rect key={k} x={k*35} y="10" width="23" height="35" fill={c.fg} opacity={k>(f-start)%24?.7:.12}/>):c.type==='done'?<path d="M15 27L32 44L63 9M100 18H570M100 41H420" stroke={c.fg} strokeWidth="8" strokeLinecap="round" fill="none"/>:c.type==='chip'?<g stroke={c.fg} fill="none" strokeWidth="5"><rect x="20" y="5" width="58" height="50" rx="7"/><path d="M0 18H20M0 42H20M78 18H600M78 42H430"/></g>:c.type==='delete'?<path d="M15 14L49 48M49 14L15 48M85 30H560" stroke={c.fg} strokeWidth="7" fill="none"/>:<g fill={c.fg}><rect x="0" y="10" width="480" height="8"/><rect x="0" y="34" width="325" height="8"/><rect x="340" y="28" width="5" height="20"/></g>}
 </svg>
 </div>})}
 </AbsoluteFill>
 {f>=306&&<div style={{position:'absolute',left:0,right:0,top:410,textAlign:'center',fontFamily:'Nimbus Sans Narrow,sans-serif',fontWeight:900,fontSize:185,letterSpacing:10,color:'#eee7d9',opacity:clear,scale:.85+clear*.15}}>CLEARED<span style={{color:'#e47758'}}>.</span></div>}
 </AbsoluteFill>;
};
