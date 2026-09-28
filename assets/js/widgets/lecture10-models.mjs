// Exact binomial probabilities, evaluated in floating point. No random samples.
export function normalCdf(x) {
  if (!Number.isFinite(x)) throw new RangeError('Finite Normal argument required.');
  if (Math.abs(x) > 8) return x < 0 ? 0 : 1;
  // Integrate the Normal density by the positive-term expansion; no cancellation.
  const a=Math.abs(x); let term=a,sum=a;
  for(let k=1;k<400;k++){term*=a*a/(2*k+1);sum+=term;if(term<=Number.EPSILON*sum)break;}
  const area=sum*Math.exp(-a*a/2)/Math.sqrt(2*Math.PI);
  return Math.max(0,Math.min(1,.5+(x<0?-area:area)));
}
export function signSum(n) {
  if (!Number.isInteger(n)||n<1||n>200) throw new RangeError('Enter a whole number from 1 to 200.');
  const width=2/Math.sqrt(n),points=[];let p=2**(-n),cdf=0,gap=0,mean=0,variance=0,fourth=0,outside=0,barOutside=0;
  for(let k=0;k<=n;k++){
    const x=(2*k-n)/Math.sqrt(n),left=cdf;cdf+=p;
    points.push({x,p,left,right:cdf,height:p/width});
    const phi=normalCdf(x);gap=Math.max(gap,Math.abs(left-phi),Math.abs(cdf-phi));
    mean+=x*p;variance+=x*x*p;fourth+=x**4*p;
    if(x < -4||x > 4) outside+=p;
    const visible=Math.max(0,Math.min(4,x+width/2)-Math.max(-4,x-width/2));
    barOutside+=p*(1-visible/width);
    p*= (n-k)/(k+1);
  }
  return {n,width,points,total:cdf,mean,variance,fourth,gap,outside,barOutside:Math.max(0,barOutside)};
}
