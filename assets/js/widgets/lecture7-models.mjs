// Fixed source-authored teaching examples. No random draws or exercise answers.
export function ridgeCoordinate(lambda){
 if(!Number.isFinite(lambda)||lambda<0||lambda>4)throw new RangeError('λ must be between 0 and 4.');
 const factor=1/(1+lambda),estimate=-2*factor;
 return {lambda,factor,estimate,dataLoss:(estimate+2)**2,penalty:lambda*estimate**2,objective:(estimate+2)**2+lambda*estimate**2};
}
export const knnData=Array.from({length:21},(_,j)=>{const i=j-10,x=i/10;return {i,x,mean:x*x,y:x*x+.3*(i%2===0?1:-1)};});
export function nearestNeighbors(k){
 if(!Number.isInteger(k)||k<1||k>21)throw new RangeError('K must be a whole number from 1 to 21.');
 const selected=[...knnData].sort((a,b)=>Math.abs(2*a.i-5)-Math.abs(2*b.i-5)||a.i-b.i).slice(0,k);
 const estimate=selected.reduce((s,p)=>s+p.y,0)/k,mean=selected.reduce((s,p)=>s+p.mean,0)/k;
 const biasSquared=(mean-.25**2)**2,variance=.09/k;
 return {k,selected,estimate,mean,target:.0625,noise:.09,biasSquared,variance,risk:.09+biasSquared+variance};
}
