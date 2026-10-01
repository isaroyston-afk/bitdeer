import React from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate,Easing,Img,staticFile} from 'remotion';
import {TechGraphics} from './TechGraphics';
const sans='Nimbus Sans Narrow, sans-serif',serif='P052, serif',mono='Nimbus Mono PS, monospace';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)} as const;
export const LyricScene=({cue,index,p}:{cue:any,index:number,p:any})=>{
 const f=useCurrentFrame(),d=(cue.endMs-cue.startMs)*.06,ending=cue.mode==='end';
 const enter=(delay=0)=>interpolate(f,[delay,delay+Math.min(25,d*.32)],[0,1],clamp);
 const leave=interpolate(f,[d-7,d+9],[0,1],clamp);
 const reveal=(text:string,x:number,y:number,size:number,delay=0,opts:any={})=>{
  delay=opts.sync??delay;const v=opts.instant?1:enter(delay),font=opts.serif?serif:opts.mono?mono:sans;
  const width=opts.width||1600;
  const fit=Math.min(size,width/(Math.max(1,text.length)*(opts.serif?.63:opts.mono?.62:.55)));
  if(f<delay||(f===delay&&!opts.instant))return null;
  const strike=opts.strike?interpolate(f,[delay+Math.min(25,d*.32),Math.max(delay+Math.min(25,d*.32)+1,d-12)],[0,100],clamp):0;
  return <div key={`${text}-${x}`} style={{position:'absolute',left:x,top:y,width,height:fit*1.27+20,overflow:'hidden',clipPath:'inset(0)',rotate:`${opts.tilt||0}deg`,transformOrigin:'left center'}}><div style={{display:'inline-block',position:'relative',fontFamily:font,fontStyle:opts.serif?'italic':'normal',fontWeight:opts.mono?400:800,fontSize:fit,lineHeight:1.04,letterSpacing:opts.tracking??-2,color:opts.color||p.fg,whiteSpace:'nowrap',translate:`${opts.side?(1-v)*-160:0}px ${(1-v)*(fit*1.35+30)}px`,...opts.style}}>{text}{opts.strike&&<span style={{position:'absolute',left:0,top:'38%',height:8,width:`${strike}%`,background:p.accent}}/>}</div></div>;

 };
 const lines=cue.text.split('|'),secondDelay=(cue.lineOffsetsMs?.[1]??100)*.06,chorus=cue.text.startsWith('ZERO DATA');
 let body:React.ReactNode;
 if(index===0||index===1){body=<>
  {reveal('TOKENS',145,225,200,0,{width:1250})}
  {reveal(index===0?'IN':'OUT',145,425,300,4,{color:p.accent,width:1150})}

 </>}
 else if(chorus){
  const hit=(cue.zeroHitMs??400)*.06;
  const kick=interpolate(f,[hit,hit+4,hit+17],[0,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.2,.8,.3,1)});
  const variant=[21,23,29,31,34].indexOf(index)%3;
  const ink=index===34?'#f5bb43':variant===0?'#582548':variant===1?'#00665e':'#5a348f';
  body=<>
  <div style={{position:'absolute',inset:0,transformOrigin:'290px 310px',scale:1+kick*.13,rotate:`${kick*(variant===1?-3:2)}deg`}}>
   {reveal('ZERO',145,265,100,0,{tracking:7,width:400,instant:index===34,color:f>=hit?ink:p.fg})}
  </div>
  {f>=hit&&f<hit+24&&<div style={{position:'absolute',left:145,top:265,fontFamily:sans,fontSize:100,fontWeight:800,letterSpacing:7,color:'transparent',WebkitTextStroke:`2px ${ink}`,opacity:interpolate(f,[hit,hit+24],[.55,0]),translate:`${(f-hit)*(variant===1?-2:2)}px ${-(f-hit)*1.3}px`}}>ZERO</div>}
  {reveal('DATA',500,265,100,(cue.dataOffsetMs??350)*.06,{tracking:7,width:700,color:p.fg})}
  {reveal('RETENTION',135,390,225,secondDelay,{width:1630,tilt:variant===0?-3:variant===1?2:-1})}

 </>}

 else if(index===12||index===15){body=<>{['Z','D','R'].map((letter,i)=><div key={letter} style={{position:'absolute',left:300+i*520,top:355,fontFamily:sans,fontSize:275,fontWeight:900,color:i===1?p.accent:p.fg,opacity:enter(i*9),translate:`0px ${(1-enter(i*9))*150}px`,rotate:`${i===1?-6:3}deg`}}>{letter}</div>)}</>}
 else if(index===11||index===13){body=<>
  {reveal(lines[0],145,245,95,0,{tracking:3})}
  {reveal(lines[1],145,400,190,secondDelay,{width:1560,tilt:-2,strike:index===11})}
 </>}
 else if([18,26].includes(index)){body=<>
 <div style={{position:'absolute',left:125,top:790,transformOrigin:'0 0',rotate:'-90deg',fontFamily:mono,fontSize:58,letterSpacing:3,color:p.fg,opacity:enter(),translate:`${(1-enter())*-90}px 0px`}}>{lines[0]}</div>
 {reveal(lines[1],335,380,220,secondDelay,{width:1420,color:p.accent,tilt:-3})}
 <div style={{position:'absolute',left:270,top:250,width:3,height:540,background:p.fg,opacity:.3}}/>
 </>}
 else if(index===14||index===32){const text=cue.text.replaceAll('|',' '),pos=interpolate(f,[0,Math.min(24,d*.25),Math.max(25,d-20),d+5],[1950,180,80,-1900],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:[Easing.bezier(.16,1,.3,1),Easing.linear,Easing.bezier(.7,0,1,.4)]});body=<>
 <div style={{position:'absolute',left:0,right:0,top:330,height:260,borderTop:`2px solid ${p.fg}`,borderBottom:`2px solid ${p.fg}`,rotate:'-3deg'}}><div style={{position:'absolute',top:15,fontFamily:sans,fontSize:Math.min(200,1500/(text.length*.55)),fontWeight:900,whiteSpace:'nowrap',color:p.fg,translate:`${pos}px 0px`}}>{lines[0]}{lines[1]&&<span style={{opacity:enter(secondDelay)}}> {lines[1]}</span>}</div></div>
 <div style={{position:'absolute',left:140,top:740,opacity:enter(5)}}><TechGraphics kind={index===32?'depart':'split'} f={f} d={d} p={p}/></div>
 </>}
 else if(index===30){body=<>
  {reveal('WHO ARE',150,290,155,0,{width:1150})}{reveal('YOU?',150,470,260,secondDelay,{serif:true,color:p.accent,width:1200})}
  <div style={{position:'absolute',right:220,top:150,fontFamily:serif,fontSize:600,color:p.fg,opacity:.10}}>?</div>
 </>}
 else if(index===7||index===8||index===9){body=<>
  {reveal(cue.text,160,390,195,0,{width:1600})}
  {index===9&&<div style={{position:'absolute',left:165,bottom:270,width:enter(1)*1380,height:5,background:p.accent}}/>}
 </>}
 else if(index===4&&cue.startMs>68000){body=<>
 <Img src={staticFile('bitdeer-logo.svg')} style={{position:'absolute',left:370,top:290,width:1070,opacity:enter(),translate:`0px ${(1-enter())*45}px`}}/>
 {reveal('AI MODEL STUDIO',365,540,150,secondDelay,{width:1410,tracking:3})}
 </>}
 else if(ending){body=<>
  {reveal(lines[0],160,340,100,0,{mono:true,width:1550})}
  {lines[1]&&reveal(lines[1],160,485,130,secondDelay,{width:1580,color:p.accent})}
  <div style={{position:'absolute',left:160,top:760,width:60,height:4,background:p.accent}}/>
 </>}
 else {const right=[4,18,24,32].includes(index),x=right?370:145;
  const single=lines.length===1;
  body=<>
   {reveal(lines[0],x,single?380:270,single?195:125,0,{width:right?1400:1580,tracking:single?-3:0})}
   {lines[1]&&reveal(lines[1],x-5,440,190,secondDelay,{width:right?1410:1590,tilt:[6,10,24,32].includes(index)?-3:0,serif:[2,6,10,24,32].includes(index),color:p.accent})}
   {cue.icon==='heart'&&<svg viewBox="0 0 100 100" width="120" height="120" style={{position:'absolute',right:155,bottom:180,opacity:enter(5),rotate:'-12deg'}}><path d="M50 88C42 80 8 57 8 33C8 16 20 8 32 12C41 14 47 21 50 29C53 21 59 14 68 12C80 8 92 16 92 33C92 57 58 80 50 88Z" fill="none" stroke={p.accent} strokeWidth="2.5"/></svg>}
   {index===26&&<svg width="1510" height="70" style={{position:'absolute',left:150,top:720}}><path d={`M0 35 H${700-enter(15)*80} M${730+enter(15)*80} 35 H1510`} stroke={p.accent} strokeWidth="5" fill="none"/></svg>}

  </>;
 }
 return <AbsoluteFill style={{opacity:1-leave,scale:chorus?interpolate(f,[0,Math.max(1,d)],[.99,1.025],{extrapolateRight:'clamp'}):1,transformOrigin:'20% 45%',translate:`0px ${-leave*35}px`,overflow:'hidden'}}>{body}
 {[4,7,8,16,17,18,27,28].includes(index)&&!(index===4&&cue.startMs>68000)&&<div style={{position:'absolute',left:[7,8].includes(index)?1350:170,top:[7,8].includes(index)?620:765,opacity:enter(4)}}><TechGraphics kind={index===0?'packets':index===1?'link':index===7?'receipt':index===8?'done':index===18?'key':[9,16,17,27,28].includes(index)?(index===16?'memory':index===9?'shred':index===27?'purge':index===28?'storage':'wipe'):(cue.startMs>68000?'badge':cue.startMs>10000?'orbit':'loading')} f={f} d={d} p={p}/></div>}
 {index===26&&<svg width="1350" height="90" style={{position:'absolute',left:370,top:700}}><path d={`M0 45 H${600-enter(secondDelay+12)*100} M${660+enter(secondDelay+12)*100} 45 H1350`} stroke={p.accent} strokeWidth="7" fill="none"/><circle cx={600-enter(secondDelay+12)*100} cy="45" r="12" fill={p.accent}/><circle cx={660+enter(secondDelay+12)*100} cy="45" r="12" fill={p.accent}/></svg>}
 {cue.tag&&index!==20&&<div style={{position:'absolute',right:155,bottom:155,fontFamily:mono,fontSize:30,letterSpacing:2,color:p.accent,opacity:enter((cue.tagOffsetMs??100)*.06)}}>{cue.tag}</div>}
 </AbsoluteFill>;
};
