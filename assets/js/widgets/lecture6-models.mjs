import {mulberry32,assertSeed,nextSeed} from '../primitives/random.mjs';

// Exact normal quantiles evaluated with Python statistics.NormalDist; validated
// against CDF powers. See assets/figures/lect-6/v1/README.md.
export const normalReference=[
  {
    "n": 2,
    "q05": -0.6455428105934257,
    "median": 0.4628397288933372,
    "q95": 1.660006531147312
  },
  {
    "n": 5,
    "q05": 0.0690271463553451,
    "median": 0.629275585260381,
    "q95": 1.2923750240180252
  },
  {
    "n": 10,
    "q05": 0.3014245281877161,
    "median": 0.6984114645796783,
    "q95": 1.1966057883184464
  },
  {
    "n": 20,
    "q05": 0.44299275908124897,
    "median": 0.7452419429957273,
    "q95": 1.1435870072003416
  },
  {
    "n": 50,
    "q05": 0.5614470090122184,
    "median": 0.7878928969818456,
    "q95": 1.102119330093195
  },
  {
    "n": 100,
    "q05": 0.6221052910207108,
    "median": 0.8112540597255261,
    "q95": 1.081899575831465
  },
  {
    "n": 200,
    "q05": 0.6677264713111885,
    "median": 0.8296436083094423,
    "q95": 1.067182977007928
  },
  {
    "n": 500,
    "q05": 0.7130041803109648,
    "median": 0.8486996569893418,
    "q95": 1.053060105886478
  },
  {
    "n": 1000,
    "q05": 0.739520206048004,
    "median": 0.8602788363383707,
    "q95": 1.0450575244379308
  },
  {
    "n": 2000,
    "q05": 0.7613347854548627,
    "median": 0.8700608173335903,
    "q95": 1.0386535790791356
  },
  {
    "n": 5000,
    "q05": 0.7848696213649502,
    "median": 0.8808934216379735,
    "q95": 1.0319613273017216
  },
  {
    "n": 10000,
    "q05": 0.79964945352403,
    "median": 0.8878540909307764,
    "q95": 1.0278934839600489
  }
];
export const sampleSizes=normalReference.map(row=>row.n);
export function maximaBank(seed=709,trials=200) {
  assertSeed(seed);if(trials!==200)throw new RangeError('The teaching preset uses 200 trials.');
  const draw=mulberry32(seed),bank=[];
  for(let trial=0;trial<trials;trial++){
    const row=[];let maximum=-Infinity,checkpoint=0;
    for(let j=0;j<10000;j+=2){
      const u=(draw()+.5)/4294967296,v=(draw()+.5)/4294967296;
      const r=Math.sqrt(-2*Math.log(u)),angle=2*Math.PI*v;
      const pair=[r*Math.cos(angle),r*Math.sin(angle)];
      for(let k=0;k<2;k++){
        maximum=Math.max(maximum,pair[k]);
        if(j+k+1===sampleSizes[checkpoint]){row.push(maximum);checkpoint++;}
      }
    }
    bank.push(row);
  }
  return bank;
}
export function maximaSummary(bank,n) {
  const index=sampleSizes.indexOf(n);if(index<0||bank.length!==200)throw new RangeError('Unsupported sample size or trial bank.');
  const values=bank.map(row=>row[index]/Math.sqrt(2*Math.log(n))),bins=Array(50).fill(0);
  let below=0,above=0;
  for(const value of values){if(value< -2)below++;else if(value>3)above++;else bins[Math.min(49,Math.floor((value+2)/.1))]++;}
  const sorted=[...values].sort((a,b)=>a-b);
  return {n,values,bins,below,above,median:(sorted[99]+sorted[100])/2,...normalReference[index],empiricalMedian:(sorted[99]+sorted[100])/2};
}
export function advancedSeed(seed){return nextSeed(seed);}
export function normalRisks(mu) {
  if(!Number.isFinite(mu)||mu< -3||mu>3)throw new RangeError('Mean must be between -3 and 3.');
  return {observed:1,zero:mu*mu};
}
export function countGroups(p,count) {
  if(!Number.isFinite(p)||p<0||p>1||!Number.isInteger(count)||count<0||count>4)throw new RangeError('Invalid Bernoulli probability or count.');
  const sizes=[1,4,6,4,1],masses=sizes.map((size,k)=>size*p**k*(1-p)**(4-k));
  const strings=Array.from({length:16},(_,i)=>i.toString(2).padStart(4,'0')).filter(s=>s.split('1').length-1===count);
  return {sizes,masses,strings,conditional:1/sizes[count],selectedMass:masses[count]};
}
