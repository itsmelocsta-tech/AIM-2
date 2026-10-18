import React,{useEffect,useRef,useState} from 'react';
import {Atmosphere,Choice,DEFAULT_ATMOSPHERE,EMPTY_PROFILE,PALETTES,PreferenceProfile,deleteProfile,loadProfile,nextPair,recommend,saveProfile} from '../../services/atmospherePreferenceService';
const colors:Record<string,[string,string]>={ocean:['#00b6c7','#12326a'],sunset:['#ffad54','#ac3175'],forest:['#4ce5a1','#0a5449'],violet:['#b994ff','#51258b'],mono:['#e5e7eb','#475569']};
function Preview({config}:{config:Atmosphere}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const ctx=el.getContext('2d');if(!ctx)return;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||config.speed===0;
  let frame=0,id=0;
  const draw=()=>{
   const w=el.width,h=el.height;ctx.clearRect(0,0,w,h);
   const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#070d20');bg.addColorStop(1,colors[config.palette][1]);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
   const t=reduced?0:frame*0.003*config.speed;
   for(let k=0;k<config.complexity*2;k++){
    ctx.beginPath();ctx.strokeStyle=colors[config.palette][0];ctx.globalAlpha=0.12+0.45*(1-k/(config.complexity*2));
    ctx.lineWidth=1.2;
    for(let i=0;i<=250;i++){
     const a=i/250*Math.PI*2*3;
     const r=10+i/250*(50+k*4);
     const x=w/2+Math.cos(a+t+k*0.24)*r;
     const y=h/2+Math.sin(a*1.5-t*0.5+k*0.18)*r*0.65;
     if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
   }
   ctx.globalAlpha=1;
   if(!reduced){frame++;id=requestAnimationFrame(draw);}
  };
  draw();return()=>cancelAnimationFrame(id);
 },[config]);
 return <canvas ref={canvas} width={320} height={190} aria-label={`${config.palette} atmosphere preview`} className="w-full rounded-xl border border-slate-700" />;
}
export function AtmosphereCalibration({userId}:{userId:string}){
 const [profile,setProfile]=useState<PreferenceProfile>(()=>loadProfile(userId));
 const [pair,setPair]=useState<[Atmosphere,Atmosphere]>(()=>nextPair(loadProfile(userId).choices));
 const [custom,setCustom]=useState<Atmosphere>(DEFAULT_ATMOSPHERE);
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{const p=loadProfile(userId);setProfile(p);setPair(nextPair(p.choices));},[userId]);
 const update=(p:PreferenceProfile)=>{setProfile(p);saveProfile(userId,p);window.dispatchEvent(new Event('aim:atmosphere-changed'));};
 const vote=(winner:0|1)=>{const choices=[...profile.choices,{a:pair[0],b:pair[1],winner} as Choice].slice(-300);update({...profile,choices});setPair(nextPair(choices));};
 const suggested=recommend(profile.choices);
 const apply=(a:Atmosphere)=>update({...profile,applied:a});
 const exportData=()=>{const blob=new Blob([JSON.stringify(profile,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='aim-atmosphere-preferences.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 text-slate-100" aria-label="Personalize My Atmosphere">
  <div><h2 className="font-bold text-base">Personalize My Atmosphere</h2><p className="text-xs text-slate-400">Adaptive Atmosphere™ · Powered by Fractal Atmospheres. Optional, local-only visual preferences.</p></div>
  <p className="text-xs text-slate-300">Which environment do you prefer? {profile.choices.length} comparisons saved.</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{pair.map((a,i)=><div key={i} className="space-y-2"><Preview config={a}/><p className="text-xs capitalize">{a.palette} · Detail {a.complexity} · Motion {a.speed}</p><button type="button" onClick={()=>vote(i as 0|1)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm w-full">Choose {i===0?'A':'B'}</button></div>)}</div>
  <div className="border-t border-slate-700 pt-3 space-y-2"><h3 className="font-semibold text-sm">Recommended atmosphere</h3><Preview config={suggested}/><p className="text-xs capitalize">{suggested.palette} · Detail {suggested.complexity} · Motion {suggested.speed}</p><button type="button" onClick={()=>apply(suggested)} className="bg-emerald-700 rounded-lg px-3 py-2 text-xs">Apply recommendation</button></div>
  <div className="border-t border-slate-700 pt-3 space-y-3"><h3 className="font-semibold text-sm">Manual override</h3><label className="block text-xs">Color palette<select className="block mt-1 w-full bg-slate-950 p-2 rounded-lg" value={custom.palette} onChange={e=>setCustom({...custom,palette:e.target.value as Atmosphere['palette']})}>{PALETTES.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
  <label className="block text-xs">Fractal complexity: {custom.complexity}<input className="block w-full" type="range" min="1" max="10" value={custom.complexity} onChange={e=>setCustom({...custom,complexity:Number(e.target.value)})}/></label>
  <label className="block text-xs">Animation speed: {custom.speed}<input className="block w-full" type="range" min="0" max="10" value={custom.speed} onChange={e=>setCustom({...custom,speed:Number(e.target.value)})}/></label>
  <Preview config={custom}/><button type="button" onClick={()=>apply(custom)} className="bg-indigo-600 px-3 py-2 rounded-lg text-xs">Apply manual settings</button></div>
  <p className="text-xs text-slate-400">Applied: {profile.applied?`${profile.applied.palette}, detail ${profile.applied.complexity}, speed ${profile.applied.speed}`:'None (default AIM appearance)'}. Settings stay on this device.</p>
  <div className="flex flex-wrap gap-2 text-xs"><button type="button" onClick={exportData} className="bg-slate-700 px-3 py-2 rounded-lg">Export JSON</button><button type="button" onClick={()=>{update({...EMPTY_PROFILE(),applied:profile.applied});setPair(nextPair([]));}} className="bg-slate-700 px-3 py-2 rounded-lg">Reset calibration</button><button type="button" onClick={()=>setEnabled(true)} className="bg-red-900 px-3 py-2 rounded-lg">Delete profile</button></div>
  {enabled&&<div className="text-xs space-x-2"><span>Delete all atmosphere preferences on this device?</span><button type="button" className="bg-red-700 px-2 py-1 rounded" onClick={()=>{deleteProfile(userId);setProfile(EMPTY_PROFILE());setPair(nextPair([]));setEnabled(false);window.dispatchEvent(new Event('aim:atmosphere-changed'));}}>Confirm delete</button><button type="button" onClick={()=>setEnabled(false)}>Cancel</button></div>}
 </section>;
}
