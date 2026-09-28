import {normalCdf,signSum} from './lecture10-models.mjs';
const navy='#18384e',teal='#087e83',gold='#a16b12',plum='#85456d';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s,a='')=>`<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
const line=(x,y,X,Y,a='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" ${a}/>`;
const path=p=>p.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
const svg=(title,b,w=600,h=370)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:system-ui,sans-serif;font-size:18px;fill:${navy}"><title>${esc(title)}</title>${b}</svg>`;
const fmt=x=>Math.abs(x)<1e-12?'0':Math.abs(x)<.0001?x.toExponential(3):Number(x.toFixed(5)).toString();
function frame(title,xd,yd,xt,yt,xlabel,ylabel){
 const x=v=>90+(v-xd[0])*470/(xd[1]-xd[0]),y=v=>300-(v-yd[0])*240/(yd[1]-yd[0]);
 let b=text(90,28,title,'font-weight="650"')+`<rect x="90" y="60" width="470" height="240" fill="#fffdf8" stroke="#cfd7d8"/>`;
 for(const t of xt)b+=line(x(t),60,x(t),300,'stroke="#e1e5e3"')+text(x(t),326,t,'text-anchor="middle"');
 for(const t of yt)b+=line(90,y(t),560,y(t),'stroke="#e1e5e3"')+text(79,y(t)+5,t,'text-anchor="end"');
 b+=text(325,358,xlabel,'text-anchor="middle"')+`<text transform="translate(22 185) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text>`;return {x,y,b};
}
export function sumDrawing(n=20,view='cdf'){
 if(!['cdf','bars'].includes(view))throw new RangeError('Unknown sum view');
 const s=signSum(n),f=frame(`Sign sum: n = ${n}`,[-4,4],[0,view==='cdf'?1:.6],[-4,-2,0,2,4],view==='cdf'?[0,.5,1]:[0,.3,.6],'Normalized sum',view==='cdf'?'CDF':'Bar height');
 let b=f.b;
 if(view==='cdf'){
  let level=s.points.filter(p=>p.x<=-4).reduce((a,p)=>a+p.p,0),pts=[[-4,level]];
  for(const p of s.points.filter(p=>p.x>-4&&p.x<=4)){pts.push([p.x,level],[p.x,p.right]);level=p.right;}
  pts.push([4,level]);
  b+=`<path d="${path(pts.map(([x,y])=>[f.x(x),f.y(y)]))}" fill="none" stroke="${teal}" stroke-width="3"/>`;
  if(n<=40)for(const p of s.points.filter(p=>p.x>=-4&&p.x<=4))b+=`<circle cx="${f.x(p.x)}" cy="${f.y(p.left)}" r="3" fill="#fffdf8" stroke="${teal}"/><circle cx="${f.x(p.x)}" cy="${f.y(p.right)}" r="3" fill="${teal}"/>`;
 }else{
  for(const p of s.points){const lo=Math.max(-4,p.x-s.width/2),hi=Math.min(4,p.x+s.width/2);if(hi>lo)b+=`<rect x="${f.x(lo)}" y="${f.y(p.height)}" width="${f.x(hi)-f.x(lo)}" height="${f.y(0)-f.y(p.height)}" fill="#b9dbd6" stroke="${teal}" stroke-width="1"/>`;}
 }
 const normal=Array.from({length:321},(_,j)=>{const x=-4+j/40;return[f.x(x),f.y(view==='cdf'?normalCdf(x):Math.exp(-x*x/2)/Math.sqrt(2*Math.PI))];});
 b+=`<path d="${path(normal)}" fill="none" stroke="${gold}" stroke-width="3" stroke-dasharray="7 5"/>`;
 return svg(`${view==='cdf'?'Step CDF':'Area-normalized bars'} of a normalized sum of ${n} independent equally likely signs, compared with the dashed standard Normal ${view==='cdf'?'CDF':'density'}. Mean zero, variance one. Full-distribution maximum CDF gap ${fmt(s.gap)}.`,b);
}
export function sumReadout(n=20,view='cdf'){
 const s=signSum(n);return `<dl class="l10-readout"><div><dt>Mean / variance</dt><dd>${fmt(s.mean)} / ${fmt(s.variance)}</dd></div><div><dt>Largest CDF gap</dt><dd>${fmt(s.gap)}</dd></div><div><dt>Total probability</dt><dd>${fmt(s.total)}</dd></div><div><dt>Probability outside [−4, 4]</dt><dd>${fmt(s.outside)}</dd></div></dl><p class="l10-small">${view==='bars'?`Bar width = ${fmt(s.width)}. The bars distribute each atom’s probability over an interval; the sum itself is discrete. Bar area beyond the window = ${fmt(s.barOutside)}.`:'The solid steps are the exact discrete CDF. At a jump, the closed point gives the CDF value; the open point shows its left limit.'} The CDF gap uses both sides of every jump in the full distribution. Tails are not renormalized. Readouts and the Normal curve are numerical evaluations.</p>`;
}
export function activityMarkup(i){const id=i.instanceId;return `<section class="lecture10-explorer" id="${id}" data-component="clt-rademacher-sums" aria-labelledby="${id}-title"><h3 id="${id}-title">Discrete sums and a Normal limit</h3><p>How does the distribution change as we add more independent signs?</p><div class="l10-static">${sumDrawing()}${sumReadout()}</div><div class="l10-live"><div data-l10-drawing>${sumDrawing()}</div><div class="l10-controls"><label for="${id}-n">Number of terms n</label><input id="${id}-n" data-l10-n type="range" min="1" max="200" step="1" value="20"><label class="sr-only" for="${id}-number">Number of terms, numeric value</label><input id="${id}-number" data-l10-n type="number" min="1" max="200" step="1" value="20" aria-describedby="${id}-error"><label for="${id}-view">Comparison</label><select id="${id}-view" data-l10-view><option value="cdf">Cumulative probabilities</option><option value="bars">Bar areas and Normal density</option></select><button type="button" class="action-button" data-l10-reset>Reset</button></div><p class="l10-error" id="${id}-error" role="status"></p><div data-l10-readout aria-live="polite">${sumReadout()}</div></div><p class="l10-legend"><span>Solid teal: exact sign sum</span><span>Dashed gold: standard Normal</span></p><p class="l10-small"><a href="#lec10-clt-picture">Distribution and n = 4 table</a> · <a href="#lec10-clt-picture-explanation">Reading the comparison</a>. This finite picture illustrates the CLT; its proof follows in Section 3.</p></section>`;}

export function staticFigures(){
 const result=[];const add=(name,label,title,b,caption)=>result.push({id:'lec10-fig-'+name,sourceLabel:label,title,drawing:b,caption});
 // Exercise 1 only: no solution disclosed beside the first main prompt.
 let panels=[1,4,16].map(n=>{const f=frame('Moving point mass: n = '+n,[-.25,1.25],[0,1.05],[0,.5,1],[0,.5,1],'Threshold x','CDF');let b=f.b;
  for(const [loc,c,dash] of [[0,gold,'7 5'],[1/n,teal,'']]){b+=`<path d="${path([[-.25,0],[loc,0],[loc,1],[1.25,1]].map(([x,y])=>[f.x(x),f.y(y)]))}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/><circle cx="${f.x(loc)}" cy="${f.y(0)}" r="4" fill="white" stroke="${c}"/><circle cx="${f.x(loc)}" cy="${f.y(1)}" r="4" fill="${c}"/>`;}
  return svg(`Solid CDF jumps at 1/${n}; dashed limiting CDF jumps at zero. Both CDFs are right-continuous.`,b);}).join('');
 add('point-mass','lec10-sol-dirac','Moving jumps and continuity points',`<div class="l10-panels">${panels}</div>`,'Solid: point mass at 1/n. Dashed: point mass at zero. At the limiting jump x = 0, the CDF values differ for every n.');
 let b=text(32,30,'Same pmf under shuffling','font-weight="650"');
 const left=[-2,-1,1,2],right=[1,-2,2,-1];
 for(let j=0;j<4;j++){const y=100+j*48;b+=text(40,y,'Row '+(j+1))+text(220,y,left[j],'text-anchor="middle"')+text(420,y,right[j],'text-anchor="middle"');}
 b+=text(220,62,'Before','text-anchor="middle"')+text(420,62,'After shuffling','text-anchor="middle"')+text(40,326,'Both columns: each of −2, −1, 1, 2 appears once.');
 add('laws','lec10-instructor-laws','A shuffle preserves the distribution',svg('Four equal-weight observations before and after a row shuffle. Frequencies stay the same; paired values change.',b),'The marginal distribution stays fixed while the pairing changes.');
 const f=frame('Continuous upper and lower ramps',[-1.5,1.5],[0,1.1],[-1,0,1],[0,.5,1],'Threshold relative to x = 0','Test function');b=f.b;
 for(const [pts,c,dash] of [[[[-1.5,1],[-1,1],[0,0],[1.5,0]],teal,''],[[[-1.5,1],[0,1],[1,0],[1.5,0]],plum,'7 5'],[[[-1.5,1],[0,1],[0,0],[1.5,0]],gold,'2 4']])b+=`<path d="${path(pts.map(([x,y])=>[f.x(x),f.y(y)]))}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/>`;
 add('ramps','lec10-sol-tests','A continuous sandwich for an indicator',svg('At x=0 and delta=1, solid lower ramp is below the dotted indicator, which is below the dashed upper ramp.',b),'Solid teal: lower ramp. Dotted gold: indicator of (−∞,0]. Dashed plum: upper ramp. The complete limiting argument is in this solution.');
 b=text(32,30,'The quadratic term survives','font-weight="650"');
 for(const [j,title,formula,reason] of [[0,'Linear term','it E[X] / √n','Centering makes it zero.'],[1,'Quadratic term','−t² / (2n)','n contributions remain at order one.'],[2,'Remainder','o(1/n)','n contributions tend to zero.']]){const y=60+j*94;b+=`<rect x="30" y="${y}" width="540" height="78" rx="7" fill="#eef3ef" stroke="#bdcfcf"/>`+text(45,y+25,title,'font-weight="650"')+text(315,y+25,formula)+text(45,y+57,reason);}
 add('quadratic','lec10-instructor-quadratic','Centering, scaling and the Gaussian exponent',svg('Three rows identify the zero linear term, surviving quadratic term and vanishing remainder in the characteristic-function expansion.',b),'This is the expansion of one factor ψ(t/√n). The product of n factors tends to exp(−t²/2).');
 b=text(32,30,'Six positions: one leading pairing','font-weight="650"');
 for(let j=0;j<6;j++)b+=`<circle cx="${65+j*92}" cy="120" r="20" fill="#e0efeb" stroke="${teal}"/>`+text(65+j*92,126,j+1,'text-anchor="middle"');
 for(const [a,c,y] of [[0,3,200],[1,5,260],[2,4,230]])b+=`<path d="M${65+a*92} 145 V${y} H${65+c*92} V145" stroke="${a===0?teal:a===1?gold:plum}" stroke-width="3" fill="none"/>`;
 b+=text(32,305,'Index labels: i, j, k, i, k, j')+text(32,339,'Three distinct indices; each appears twice.');
 add('pairings','lec10-instructor-pairings','Pairing six positions',svg('Positions 1 and 4 share index i, 2 and 6 share j, and 3 and 5 share k.',b),'For a sixth moment, pairings have three free indices. Their order n³ balances the normalization n⁻³. A singleton would contribute a zero mean.');
 b=text(32,30,'Replace one observation at a time','font-weight="650"');
 for(const [row,k] of [[0,0],[1,3],[2,6]]){const y=82+row*85;b+=text(30,y+24,'i = '+k);for(let j=0;j<6;j++)b+=`<rect x="${100+j*77}" y="${y}" width="66" height="42" rx="6" fill="${j<k?'#e0efeb':'#f2e5ca'}" stroke="${j<k?teal:gold}"/>`+text(133+j*77,y+27,(j<k?'X':'Y')+(j+1),'text-anchor="middle"');}
 b+=text(30,345,'Both inputs: mean 0, variance σ²; compare smooth tests.');
 add('replacement','lec10-instructor-swapping','Intermediate sums in the replacement proof',svg('The proof starts with six Gaussian Y terms, then three X and three Y terms, then six X terms. The displayed six slots illustrate the general n-step argument.',b),'The proof runs from all Gaussian inputs to all original inputs. For one replacement, remove the changing slot to form Tₙ,ᵢ; matching means and variances cancels the first two Taylor terms.');
 return result;
}
