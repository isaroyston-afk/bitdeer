import React from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate,Easing} from 'remotion';
import {TechGraphics} from './TechGraphics';
export const BreakScene=({duration,p,stage}:{duration:number,p:any,stage?:string})=>{
 const f=useCurrentFrame(),q=Math.min(1,f/Math.max(1,duration-16));
 const entry=interpolate(f,[0,18],[0,1],{extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)}),exit=interpolate(f,[duration-5,duration+6],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const kind=stage||'loading';const title=({loading:'PROCESSING',packets:'ROUTING OUTPUT',memory:'CLEARING MEMORY',address:'RELEASING CONTEXT',reset:'RESETTING SESSION',logs:'REMOVING HISTORY',done:'SESSION CLOSED'} as any)[kind]||'PROCESSING';
 return <AbsoluteFill style={{opacity:entry*(1-exit),overflow:'hidden'}}>
 <div style={{position:'absolute',left:150,top:225,fontFamily:'Nimbus Sans Narrow,sans-serif',fontSize:130,fontWeight:900,color:p.fg,translate:`${(1-entry)*-180}px 0px`}}>{title}</div>
 {kind==='logs'?<div style={{position:'absolute',left:160,top:425,width:1570,fontFamily:'Nimbus Mono PS,monospace',fontSize:32,color:p.fg}}>{['/prompt_history','/session_cache','/temporary_outputs','/conversation_state'].map((s,i)=><div key={s} style={{display:'flex',justifyContent:'space-between',padding:'18px 0',borderBottom:`1px solid ${p.accent}`,opacity:f>i*duration/5?1:.18}}><span>{s}</span><span style={{color:p.accent}}>{q>(i+1)/5?'DELETED ✓':'PENDING'}</span></div>)}</div>:kind==='done'?<div style={{position:'absolute',left:750,top:420}}><TechGraphics kind="power" f={f} d={duration} p={p}/></div>:<div style={{position:'absolute',left:170,top:465}}><TechGraphics kind={kind==='loading'?'meter':kind==='memory'?'release':kind==='packets'?'nodes':kind} f={f} d={duration} p={p}/></div>}
 <div style={{position:'absolute',left:0,right:0,bottom:145,height:70,overflow:'hidden',opacity:.4}}><div style={{position:'absolute',whiteSpace:'nowrap',fontFamily:'Nimbus Mono PS,monospace',fontSize:33,letterSpacing:6,color:p.fg,translate:`${-f*2.4}px 0px`}}>INPUT → COMPUTE → OUTPUT → CLEAR → INPUT → COMPUTE → OUTPUT → CLEAR</div></div>
 </AbsoluteFill>;
};
