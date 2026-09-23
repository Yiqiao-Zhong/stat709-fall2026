// Fixed synthetic examples selected by the canonical Lecture 8 plans.
export function psdProjection(k){
 if(!Number.isInteger(k)||k<1||k>3)throw new RangeError('K must be 1, 2 or 3');
 const before=[3,1,-.5],after=before.map((v,j)=>j<k?Math.max(v,0):0);
 return {before,after,k,rank:after.filter(v=>v>0).length,errorSquared:before.reduce((s,v,j)=>s+(v-after[j])**2,0)};
}
export function gaussianFit(sigma,theta){
 if(!Number.isFinite(sigma)||sigma<.5||sigma>2||!Number.isFinite(theta))throw new RangeError('Invalid Gaussian setting');
 return {rss:3*(theta-1)**2+2,relativeLikelihood:Math.exp(-3*(theta-1)**2/(2*sigma*sigma)),optimum:1};
}
export const networkEdges=[[1,2],[1,3],[2,3],[4,5],[4,6],[5,6],[3,4]];
// Fix node 1 in A: C(5,2)=10 balanced partitions, without sign duplicates.
export const partitions=[];
for(let a=2;a<=5;a++)for(let b=a+1;b<=6;b++)partitions.push([1,a,b]);
export function networkPartition(index){
 if(!Number.isInteger(index)||index<0||index>=10)throw new RangeError('Invalid partition');
 const a=partitions[index],b=[1,2,3,4,5,6].filter(x=>!a.includes(x));
 const same=(i,j)=>a.includes(i)===a.includes(j),within=networkEdges.filter(([i,j])=>same(i,j)).length,between=7-within;
 const p=.4,q=.1,logLikelihood=within*Math.log(p)+(6-within)*Math.log(1-p)+between*Math.log(q)+(9-between)*Math.log(1-q);
 const quadratic=2*(within-between);
 return {a,b,within,between,withinNonedges:6-within,betweenNonedges:9-between,logLikelihood,quadratic};
}
// Eigenbasis inverse square root of the selected 2x2 moment matrix.
export function weightedWhitening(){
 const w=[.25,.75],mu=[[.8,.2],[.2,.8]],before=mu.map((v,j)=>v.map(x=>Math.sqrt(w[j])*x));
 const a=before.reduce((s,v)=>s+v[0]**2,0),b=before.reduce((s,v)=>s+v[0]*v[1],0),d=before.reduce((s,v)=>s+v[1]**2,0);
 const angle=.5*Math.atan2(2*b,a-d),u=[Math.cos(angle),Math.sin(angle)],v=[-Math.sin(angle),Math.cos(angle)];
 const delta=Math.hypot(a-d,2*b),e=[(a+d+delta)/2,(a+d-delta)/2];
 const after=before.map(z=>[(u[0]*z[0]+u[1]*z[1])/Math.sqrt(e[0]),(v[0]*z[0]+v[1]*z[1])/Math.sqrt(e[1])]);
 return {before,after,eigenvalues:e};
}
