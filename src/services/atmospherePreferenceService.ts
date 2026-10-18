export type Palette = 'ocean' | 'sunset' | 'forest' | 'violet' | 'mono';
export type Atmosphere = { palette: Palette; complexity: number; speed: number };
export type Choice = { a: Atmosphere; b: Atmosphere; winner: 0 | 1 };
export type PreferenceProfile = { version: 1; choices: Choice[]; applied: Atmosphere | null };
export const PALETTES: Palette[] = ['ocean','sunset','forest','violet','mono'];
export const DEFAULT_ATMOSPHERE: Atmosphere = { palette:'ocean', complexity:5, speed:3 };
export const EMPTY_PROFILE = (): PreferenceProfile => ({version:1,choices:[],applied:null});
export const storageKey = (uid: string) => 'aim:atmosphere:v1:' + encodeURIComponent(uid);
const valid = (x: unknown): x is Atmosphere => {
  if (!x || typeof x !== 'object') return false;
  const a=x as Atmosphere;
  return PALETTES.includes(a.palette) && Number.isInteger(a.complexity) && a.complexity>=1 && a.complexity<=10 && Number.isInteger(a.speed) && a.speed>=0 && a.speed<=10;
};
export function loadProfile(uid: string): PreferenceProfile {
  try {
    const x=JSON.parse(localStorage.getItem(storageKey(uid))||'null');
    if (!x || x.version!==1 || !Array.isArray(x.choices)) return EMPTY_PROFILE();
    const choices=x.choices.filter((c: Choice)=>c && valid(c.a) && valid(c.b) && (c.winner===0||c.winner===1)).slice(-300);
    return {version:1,choices,applied:valid(x.applied)?x.applied:null};
  } catch {return EMPTY_PROFILE();}
}
export function saveProfile(uid:string, profile:PreferenceProfile):void {
  localStorage.setItem(storageKey(uid),JSON.stringify({...profile,choices:profile.choices.slice(-300)}));
}
export function deleteProfile(uid:string):void {localStorage.removeItem(storageKey(uid));}
export function features(a:Atmosphere):number[] {
  return [...PALETTES.map(p=>a.palette===p?1:0), (a.complexity-5.5)/4.5, (a.speed-5)/5];
}
const dot=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+x*b[i],0);
const difference=(a:Atmosphere,b:Atmosphere)=>features(a).map((v,i)=>v-features(b)[i]);
export function train(choices:Choice[]):number[] {
  const weights=Array(7).fill(0) as number[];
  // Regularized logistic Bradley-Terry, decayed observations for evolving preferences.
  for(let epoch=0;epoch<120;epoch++){
    const grad=weights.map(w=>-0.1*w);
    choices.slice(-300).forEach((c,i,arr)=>{
      const d=difference(c.a,c.b);
      const y=c.winner===0?1:0;
      const p=1/(1+Math.exp(-Math.max(-20,Math.min(20,dot(weights,d)))));
      const ageWeight=Math.pow(0.995,arr.length-1-i);
      d.forEach((v,j)=>{grad[j]+=ageWeight*(y-p)*v/Math.max(1,arr.length);});
    });
    weights.forEach((w,j)=>{weights[j]=w+0.3*grad[j];});
  }
  return weights;
}
export function score(a:Atmosphere,w:number[]):number {return dot(features(a),w);}
export function recommend(choices:Choice[]):Atmosphere {
  const w=train(choices);
  let best=DEFAULT_ATMOSPHERE, value=-Infinity;
  for(const palette of PALETTES) for(let complexity=1;complexity<=10;complexity++)
    for(let speed=0;speed<=10;speed++){
      const a={palette,complexity,speed};
      const s=score(a,w)-0.001*(Math.abs(complexity-5)+Math.abs(speed-3));
      if(s>value){best=a;value=s;}
    }
  return best;
}
export function nextPair(choices:Choice[], random:()=>number=Math.random):[Atmosphere,Atmosphere] {
  const w=train(choices);
  const pool:Atmosphere[]=[];
  for(let i=0;i<75;i++)pool.push({palette:PALETTES[Math.floor(random()*5)],complexity:1+Math.floor(random()*10),speed:Math.floor(random()*11)});
  if(choices.length===0)return [DEFAULT_ATMOSPHERE,{palette:'violet',complexity:8,speed:6}];
  const recent=new Set(choices.slice(-12).flatMap(c=>[JSON.stringify(c.a),JSON.stringify(c.b)]));
  const candidatePairs:{a:Atmosphere;b:Atmosphere;utility:number}[]=[];
  for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
    const a=pool[i],b=pool[j],d=difference(a,b);
    const distance=Math.sqrt(dot(d,d));
    if(distance<0.55 || recent.has(JSON.stringify(a)) || recent.has(JSON.stringify(b)))continue;
    const uncertainty=1/(1+Math.abs(score(a,w)-score(b,w)));
    const utility=uncertainty+0.08*Math.min(distance,3)+0.05*random();
    candidatePairs.push({a,b,utility});
  }
  candidatePairs.sort((a,b)=>b.utility-a.utility);
  const pick=random()<0.12?candidatePairs[Math.floor(random()*Math.min(20,candidatePairs.length))]:candidatePairs[0];
  return pick?[pick.a,pick.b]:[DEFAULT_ATMOSPHERE,{palette:'sunset',complexity:7,speed:5}];
}
