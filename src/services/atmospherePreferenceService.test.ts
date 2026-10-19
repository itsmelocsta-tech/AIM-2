import {describe,it,expect} from 'vitest';
import {DEFAULT_ATMOSPHERE,EMPTY_PROFILE,features,train,recommend,nextPair,loadProfile,saveProfile,deleteProfile} from './atmospherePreferenceService';
describe('atmosphere preference learning',()=>{
 it('has finite features and weights',()=>{expect(features(DEFAULT_ATMOSPHERE)).toHaveLength(7);expect(train([])).toHaveLength(7);});
 it('learns a preferred palette from comparisons',()=>{
  const a={...DEFAULT_ATMOSPHERE,palette:'forest' as const},b={...DEFAULT_ATMOSPHERE,palette:'sunset' as const};
  const weights=train(Array.from({length:30},()=>({a,b,winner:0 as const})));
  expect(features(a).reduce((s,v,i)=>s+v*weights[i],0)).toBeGreaterThan(features(b).reduce((s,v,i)=>s+v*weights[i],0));
 });
 it('recommends valid settings',()=>{const a=recommend([]);expect(a.complexity).toBeGreaterThanOrEqual(1);expect(a.speed).toBeLessThanOrEqual(10);});
 it('provides deterministic comparison with seeded random source',()=>{
  const choices=[{a:DEFAULT_ATMOSPHERE,b:{...DEFAULT_ATMOSPHERE,palette:'forest' as const},winner:0 as const}];
  const make=()=>{let x=12;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};};
  expect(nextPair(choices,make())).toEqual(nextPair(choices,make()));
 });
 it('starts with empty profile',()=>{expect(EMPTY_PROFILE().choices).toEqual([]);});
 it('persists, resets and deletes account-scoped preferences',()=>{
  const store=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>store.get(k)||null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)}});
  const p={...EMPTY_PROFILE(),applied:DEFAULT_ATMOSPHERE};saveProfile('test-user',p);
  expect(loadProfile('test-user').applied).toEqual(DEFAULT_ATMOSPHERE);
  expect(loadProfile('other-user').applied).toBeNull();
  store.set('aim:atmosphere:v1:bad','{broken');
  expect(loadProfile('bad').choices).toEqual([]);
  deleteProfile('test-user');expect(loadProfile('test-user').applied).toBeNull();
 });
});
