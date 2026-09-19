// Exact teaching models. The fixed Gaussian fixture is supplied by the build.
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const sumCdf = z => z <= 0 ? 0 : z <= 1 ? z*z/2 : z < 2 ? 1-(2-z)**2/2 : 1;
export const sumSlice = (z, y) => clamp(z-y,0,1);
export function sumRegion(z) {
  if(z<=0)return [[0,0]];
  if(z<=1)return [[0,0],[z,0],[0,z]];
  if(z<2)return [[0,0],[1,0],[1,z-1],[z-1,1],[0,1]];
  return [[0,0],[1,0],[1,1],[0,1]];
}
export const annuli = {all:[0,Infinity],inner:[.5,1.5],outer:[1.5,2.5]};
export function directionStats(points, shell, angle) {
  if(!annuli[shell] || !Number.isFinite(angle) || angle<0 || angle>360)throw new Error('Invalid direction settings');
  const [a,b]=annuli[shell], selected=points.filter(p=>p.r>=a&&p.r<b);
  const count=selected.filter(p=>p.theta<angle*Math.PI/180).length;
  const mass=Math.exp(-a*a/2)-Math.exp(-b*b/2);
  return {n:selected.length,count,fraction:selected.length?count/selected.length:null,exact:angle/360,mass,joint:mass*angle/360};
}
export const groupValues = [0,2,2,4,6,8];
export const groupWeights = [1,1,2,2,1,1].map(v=>v/8);
export function conditionalPredictions(mode) {
  if(mode==='none')return Array(6).fill(3.5);
  if(mode==='group')return [1.5,1.5,1.5,5.5,5.5,5.5];
  if(mode==='outcome')return [...groupValues];
  throw new Error('Unknown information view');
}
export const weightedMean = values => values.reduce((total,v,i)=>total+groupWeights[i]*v,0);
export function regressionLoss(z,c) {
  if(![0,1,2].includes(z)||!Number.isFinite(c))throw new Error('Invalid regression settings');
  const errors=[z-1-c,z+1-c], contributions=errors.map(v=>v*v/2);
  return {errors,contributions,noise:1,excess:(c-z)**2,total:1+(c-z)**2};
}
