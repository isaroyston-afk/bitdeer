import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame,interpolate,interpolateColors,Easing} from 'remotion';
import {Audio} from '@remotion/media';
import lines from './scroll-lyrics.json';
const smooth={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.2,.85,.25,1)} as const;
const clock=(t:number)=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export const ScrollingLyrics=()=>{
 const frame=useCurrentFrame(),ms=frame/60*1000;
 let idx=0;for(let i=0;i<lines.length;i++)if(ms>=lines[i].startMs)idx=i;
 // Anticipate each line by 100 ms; one spring-like eased scroll, no periodic pulse.
 let scroll=2;
 for(let i=3;i<lines.length-2;i++)scroll+=interpolate(ms,[lines[i].startMs-100,lines[i].startMs+340],[0,1],smooth);
 const gap=ms>lines[idx].endMs+400&&(lines[idx+1]?.startMs??81000)-lines[idx].endMs>1500;
 const gapFade=gap?interpolate(ms,[lines[idx].endMs+400,lines[idx].endMs+750],[1,.62],smooth):1;
 const green='#36D0AC',amber='#FFC66A';
 return <AbsoluteFill style={{transform:'translateZ(0)',backgroundColor:'#050606',color:'#f6f7f4',fontFamily:'Nimbus Sans,Arial,sans-serif',overflow:'hidden'}}>
 <Audio src={staticFile('audio.mp3')}/>
 <div style={{position:'absolute',left:140,top:76,zIndex:10,display:'flex',alignItems:'center',gap:34}}><Img src={staticFile('bitdeer-logo.svg')} style={{width:246}}/><div style={{width:1,height:30,background:'#323735'}}/><span style={{fontSize:22,fontWeight:500,letterSpacing:3,color:'#a9b0ac'}}>AI MODEL STUDIO</span></div>
 <div style={{position:'absolute',right:140,top:87,zIndex:10,fontSize:18,letterSpacing:4,color:'#66716c'}}>ZERO DATA RETENTION</div>
 <div style={{position:'absolute',left:120,right:100,top:205,height:680,overflow:'hidden'}}>
 {lines.map((line,i)=>{
 const offset=i-scroll,y=285+offset*130;
 if(y<-160||y>760)return null;
 const next=lines[i+1]?.startMs??82000;
 const enter=interpolate(ms,[line.startMs-100,line.startMs+120],[0,1],smooth);
 const exit=interpolate(ms,[next,next+240],[0,1],smooth);
 const focus=enter*(1-exit);
 const size=Math.min(81,1480/(line.text.length*.51));
 const c=interpolateColors(focus,[0,1],['#68716b','#989f9a']);
 return <div key={i} style={{position:'absolute',top:y,left:22,width:1560,height:116,display:'flex',alignItems:'center',fontSize:size,fontWeight:700,letterSpacing:-1.6,whiteSpace:'pre',transformOrigin:'left center',scale:1+focus*.035,translate:`${focus*18}px 0px`,opacity:(Math.max(.22,1-Math.abs(offset)*.18)*(1-focus)+focus)*(i===idx?gapFade:1)}}>
 <div style={{position:'absolute',left:-30,width:5,height:49,borderRadius:4,background:green,opacity:focus}}/>
 {line.words.map((w,k)=>{
 const amount=interpolate(ms,[w.startMs,Math.max(w.startMs+1,w.endMs)],[0,100],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 // One gentle raised-cosine lift; zero velocity at both ends.
 const duration=Math.max(320,Math.min(520,w.endMs-w.startMs));
 const phase=Math.max(0,Math.min(1,(ms-w.startMs)/duration));
 const lift=-1.5*Math.sin(Math.PI*phase)**2;
 return <span key={k} style={{position:'relative',display:'inline-block',translate:`0px ${lift*focus}px`,color:c}}>
 {w.text}
 <span style={{position:'absolute',inset:0,color:amber,opacity:focus,clipPath:`inset(0 ${100-amount}% 0 0)`}}>{w.text}</span>
 </span>})}
 </div>})}
 <div style={{position:'absolute',left:0,right:0,top:0,height:30,background:'linear-gradient(#050606,transparent)',pointerEvents:'none'}}/>
 <div style={{position:'absolute',left:0,right:0,bottom:0,height:45,background:'linear-gradient(transparent,#050606)',pointerEvents:'none'}}/>
 </div>
 <div style={{position:'absolute',left:143,top:918,height:24,display:'flex',alignItems:'center',gap:9,opacity:gap?.75:0}}>{[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:'50%',background:green,opacity:.25+.75*(.5+.5*Math.sin(frame*.12-i*1.5))}}/>)}<span style={{marginLeft:14,fontSize:16,letterSpacing:3,color:'#68756e'}}>INSTRUMENTAL</span></div>
 <div style={{position:'absolute',left:140,right:140,top:984,height:3,background:'#242b27'}}><div style={{height:'100%',width:`${frame/4853*100}%`,background:green}}/></div>
 <div style={{position:'absolute',left:140,right:140,top:1008,display:'flex',justifyContent:'space-between',fontFamily:'Nimbus Mono PS,monospace',fontSize:18,color:'#737d77'}}><span>{clock(ms/1000)}</span><span>1:21</span></div>
 </AbsoluteFill>;
};
