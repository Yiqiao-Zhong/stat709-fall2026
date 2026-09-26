// Exact Pareto tail integrals; no simulation or random input.
export function paretoAreas(alpha, logCutoff) {
  if (!Number.isFinite(alpha) || alpha < 1.1 || alpha > 1.9 ||
      !Number.isFinite(logCutoff) || logCutoff < 0 || logCutoff > 4)
    throw new RangeError('Use 1.1 ≤ α ≤ 1.9 and 0 ≤ log10 R ≤ 4.');
  const cutoff = 10 ** logCutoff;
  const first = 1 - Math.expm1((1 - alpha) * Math.log(cutoff)) / (alpha - 1);
  const second = 1 + 2 * Math.expm1((2 - alpha) * Math.log(cutoff)) / (2 - alpha);
  return {alpha, logCutoff, cutoff, first, second, mean: alpha / (alpha - 1),
    firstBeyondWindow: Math.max(0, first - (1 + (1 - 10 ** (1 - alpha)) / (alpha - 1))),
    secondBeyondWindow: Math.max(0, second - (1 + 2 * (10 ** (2 - alpha) - 1) / (2 - alpha)))};
}
export function paretoIntegrand(t, alpha, order) {
  if (!(t >= 0) || !(alpha > 1 && alpha < 2) || ![1, 2].includes(order)) throw new RangeError('Invalid tail integrand input');
  const survival = t <= 1 ? 1 : t ** -alpha;
  return order === 1 ? survival : 2 * t * survival;
}
// Exact discrepancy at both sides of every empirical or population jump.
export function ecdfGap(sample, model) {
  const sorted=[...sample].sort((a,b)=>a-b), n=sorted.length;
  if (!n || !['uniform','bernoulli'].includes(model)) throw new RangeError('Invalid ECDF fixture');
  const F=x=>model==='uniform'?Math.max(0,Math.min(1,x)):(x<0?0:x<1?.6:1);
  const left=x=>model==='uniform'?F(x):(x<=0?0:x<=1?.6:1);
  let gap=0,at=0,side='right';
  for(const x of new Set([...sorted,0,1]))for(const [s,a,b] of [['left',sorted.filter(y=>y<x).length/n,left(x)],['right',sorted.filter(y=>y<=x).length/n,F(x)]])if(Math.abs(a-b)>gap){gap=Math.abs(a-b);at=x;side=s;}
  return {gap,at,side};
}
