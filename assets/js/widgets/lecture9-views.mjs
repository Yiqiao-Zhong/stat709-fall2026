import {paretoAreas,paretoIntegrand,ecdfGap} from './lecture9-models.mjs';
const navy='#18384e',teal='#087e83',gold='#a16b12',plum='#85456d';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x.toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3});
const text=(x,y,s,a='')=>`<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
const line=(x,y,X,Y,a='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" ${a}/>`;
const path=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
const svg=(title,b,w=520,h=355)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:system-ui,sans-serif;font-size:18px;fill:${navy}"><title>${esc(title)}</title>${b}</svg>`;
function frame(title,xd,yd,xt,yt,xlabel,ylabel){
 const x=v=>65+(v-xd[0])*420/(xd[1]-xd[0]),y=v=>285-(v-yd[0])*225/(yd[1]-yd[0]);
 let b=text(65,28,title,'font-weight="650"')+`<rect x="65" y="60" width="420" height="225" fill="#fffdf8" stroke="#cfd7d8"/>`;
 for(const t of xt)b+=line(x(t),60,x(t),285,'stroke="#e1e5e3"')+text(x(t),311,t,'text-anchor="middle"');
 for(const t of yt)b+=line(65,y(t),485,y(t),'stroke="#e1e5e3"')+text(55,y(t)+5,t,'text-anchor="end"');
 b+=text(275,342,xlabel,'text-anchor="middle"')+`<text transform="translate(20 175) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text>`;return {x,y,b};
}
export function paretoDrawing(alpha=1.5,u=1){
 const r=paretoAreas(alpha,u),end=Math.min(10,r.cutoff);
 return '<div class="l9-panels">'+[1,2].map(k=>{
  const f=frame(k===1?'First moment: tail area':'Second moment: weighted tail area',[0,10],[0,k===1?1.1:2.2],[0,1,5,10],k===1?[0,.5,1]:[0,1,2],'Threshold t (linear scale)',k===1?'P(X > t)':'2t P(X > t)');
  const pts=Array.from({length:301},(_,i)=>[i/30,paretoIntegrand(i/30,alpha,k)]);
  const shade=Array.from({length:241},(_,i)=>{const t=end*i/240;return[f.x(t),f.y(paretoIntegrand(t,alpha,k))];});
  let b=f.b+`<path d="M ${f.x(0)} ${f.y(0)} L ${path(shade).slice(1)} L ${f.x(end)} ${f.y(0)} Z" fill="${k===1?'#b9dbd6':'#ead5ad'}" opacity=".8"/>`;
  b+=`<path d="${path(pts.map(([x,y])=>[f.x(x),f.y(y)]))}" fill="none" stroke="${k===1?teal:gold}" stroke-width="3"/>`;
  b+=line(f.x(end),60,f.x(end),285,`stroke="${plum}" stroke-width="2" stroke-dasharray="6 4"`);
  b+=text(478,49,r.cutoff<=10?'Cutoff R = '+fmt(r.cutoff):'R = '+fmt(r.cutoff)+' extends past this window','text-anchor="end" font-size="15"');
  return svg(`${k===1?'First':'Second'} moment integrand for Pareto shape ${alpha}. Shading runs to ${fmt(end)} in the fixed window 0 to 10. Full area to R=${fmt(r.cutoff)} is ${fmt(k===1?r.first:r.second)}.`,b);
 }).join('')+'</div>';
}
export function paretoReadout(alpha=1.5,u=1){
 const r=paretoAreas(alpha,u);return `<dl class="l9-readout"><div><dt>Cutoff R = 10ᵘ</dt><dd>${fmt(r.cutoff)}</dd></div><div><dt>First capped moment A₁(R)</dt><dd>${fmt(r.first)}</dd></div><div><dt>Second capped moment A₂(R)</dt><dd>${fmt(r.second)}</dd></div><div><dt>Population mean α/(α − 1)</dt><dd>${fmt(r.mean)}</dd></div></dl><p class="l9-small">${r.cutoff>10?`The plots stop at t = 10. The readouts include all the area to R; beyond the plotted window there is ${fmt(r.firstBeyondWindow)} more first-moment area and ${fmt(r.secondBeyondWindow)} more second-moment area.`:'The shaded regions show the full areas from 0 to R, including the contribution on [0, 1].'} Readouts are rounded; the formulas in the explanation are exact.</p>`;
}
export function activityMarkup(i){
 const id=i.instanceId,controls=[['alpha','Shape α',i.settings.alpha],['logCutoff','Logarithmic cutoff u = log₁₀ R',i.settings.logCutoff]];
 return `<section class="lecture9-explorer" id="${id}" data-component="pareto-moment-area" aria-labelledby="${id}-title"><h3 id="${id}-title">A finite mean, an infinite second moment</h3><p>As the cutoff grows, which accumulated moment approaches a finite limit?</p><div class="l9-static">${paretoDrawing()}${paretoReadout()}</div><div class="l9-live"><div data-l9-drawing>${paretoDrawing()}</div><div class="l9-controls">${controls.map(([key,label,s])=>`<div><label for="${id}-${key}">${label}</label><input id="${id}-${key}" data-l9-key="${key}" type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}"><label class="sr-only" for="${id}-${key}-number">${label}, numeric value</label><input id="${id}-${key}-number" data-l9-key="${key}" type="number" min="${s.min}" max="${s.max}" step="any" value="${s.value}" aria-describedby="${id}-error"></div>`).join('')}<button type="button" class="action-button" data-l9-reset>Reset</button></div><p class="l9-error" id="${id}-error" role="status"></p><div data-l9-readout aria-live="polite">${paretoReadout()}</div></div><p class="l9-small">The figure uses exact tail integrals, not samples. <a href="#lec09-pareto-picture">How to read the figure and static values</a> · <a href="#lec09-sol-pareto">Complete moment calculation</a></p></section>`;
}
export function staticFigures(){
 const figures=[];const add=(suffix,label,title,drawing,caption)=>figures.push({id:'lec09-fig-'+suffix,sourceLabel:label,title,drawing,caption});
 let b=text(35,28,'One column: a fixed sample size','font-weight="650"');
 for(let row=0;row<5;row++){b+=text(30,93+row*36,'Path '+(row+1));for(let col=0;col<10;col++){const bad=col<(5-row)&&((row+col)%2===0);b+=`<rect x="${112+col*35}" y="${70+row*36}" width="29" height="28" rx="3" fill="${bad?'#ead5ad':'#e5eeec'}" stroke="${bad?gold:'#bacac6'}"/>`;if(bad)b+=text(126+col*35,91+row*36,'×','text-anchor="middle"');}}
 b+=text(32,276,'n','font-size="18"')+Array.from({length:10},(_,j)=>text(126+j*35,276,j+1,'text-anchor="middle" font-size="18"')).join('')+text(35,316,'One row: follow an outcome across sample sizes','font-size="17"')+text(35,343,'× marks an error outside a fixed tolerance.','font-size="16"');
 add('paths','lec09-instructor-paths','Convergence: columns and sample paths',svg('A schematic grid of five outcomes and ten sample sizes. A column represents error probability at a fixed n; a row follows one outcome across n.',b),'In probability: each fixed tolerance is exceeded with probability tending to zero. Almost surely: almost every whole path eventually stays within each fixed tolerance. A finite grid illustrates the quantifiers; it does not prove a limit.');
 const normal=[.4,1,2].map(sd=>{const f=frame('Normal errors: σ = '+sd,[-4,4],[0,1.05],[-4,-2,0,2,4],[0,.5,1],'Error','Density'),pts=Array.from({length:161},(_,j)=>{const x=-4+j/20;return[f.x(x),f.y(Math.exp(-x*x/(2*sd*sd))/(sd*Math.sqrt(2*Math.PI)))];});return svg(`Normal density with standard deviation ${sd}, on the same axes as the other panels.`,f.b+`<path d="${path(pts)}" fill="none" stroke="${teal}" stroke-width="3"/>`);}).join('');
 add('normal-scales','lec09-sol-gaussian','Normal errors at three scales',`<div class="l9-panels">${normal}</div>`,'The same horizontal and vertical scales show narrowing, unit-scale, and wider Normal distributions. The complete limit calculations remain in this solution; finite curves alone do not specify a sequence.');
 b=text(35,30,'The tail question survives finite changes','font-weight="650"');
 for(let row=0;row<3;row++){b+=text(32,95+row*70,'Start '+(row+1));for(let j=0;j<8;j++){b+=`<rect x="${118+j*42}" y="${66+row*70}" width="34" height="36" rx="4" fill="${j<row?'#e7e7e7':'#dcece7'}" stroke="#9baead"/>`+text(135+j*42,91+row*70,'X'+(j+1),'text-anchor="middle" font-size="16"');}b+=text(465,92+row*70,'…');}
 b+=text(35,319,'Discard a finite prefix; ask the same limiting question.','font-size="16"');
 add('tail-prefix','lec09-instructor-tail','Tail events ignore a finite beginning',svg('Three strips remove increasingly long finite prefixes while preserving the infinite tail.',b),'For the limiting-average event in the text, a finite deleted sum divided by n tends to zero. The limiting question is unchanged.');
 const samples={uniform:[.05,.18,.22,.4,.55,.59,.68,.8,.9,.96],bernoulli:[0,0,0,0,0,0,0,1,1,1]};
 const cdfs=Object.entries(samples).map(([model,sample])=>{const f=frame(model==='uniform'?'Uniform[0, 1]':'Bernoulli(0.4)',[-.1,1.1],[0,1.05],[0,.5,1],[0,.5,1],'Threshold x','Cumulative probability');let pts=[[-.1,0]],count=0;for(const x of [...new Set(sample)].sort((a,b)=>a-b)){pts.push([x,count/10]);count+=sample.filter(y=>y===x).length;pts.push([x,count/10]);}pts.push([1.1,1]);const truth=model==='uniform'?[[-.1,0],[0,0],[1,1],[1.1,1]]:[[-.1,0],[0,0],[0,.6],[1,.6],[1,1],[1.1,1]];let b=f.b;for(const [p,c,dash] of [[truth,gold,'6 4'],[pts,teal,'']])b+=`<path d="${path(p.map(([x,y])=>[f.x(x),f.y(y)]))}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/>`;b+=text(475,49,'Maximum gap: '+fmt(ecdfGap(sample,model).gap),'text-anchor="end" font-size="16"');return svg(`${model} empirical and population CDFs for ten fixed synthetic observations. Solid line is empirical; dashed is population. Exact maximum gap ${fmt(ecdfGap(sample,model).gap)}.`,b);}).join('');
 add('ecdf','lec09-instructor-cdf','Comparing the empirical and population CDFs',`<div class="l9-panels">${cdfs}</div>`,'Solid: empirical CDF for ten synthetic observations. Dashed: population CDF. The largest vertical discrepancy uses both sides of every jump, including for the discrete example. One finite sample illustrates the comparison, not convergence.');
 const f=frame('A separated minimum with uniform error',[-1.5,1.5],[-.2,2.4],[-1,0,1],[0,1,2],'Parameter θ','Objective');
 const xs=Array.from({length:151},(_,i)=>-1.5+i/50),pts=xs.map(x=>[f.x(x),f.y(x*x)]),band=[...xs.map(x=>[f.x(x),f.y(x*x+.1)]),...xs.toReversed().map(x=>[f.x(x),f.y(x*x-.1)])];
 b=f.b+`<path d="${path(band)} Z" fill="#bdd9d3" opacity=".7"/><path d="${path(pts)}" stroke="${teal}" stroke-width="3" fill="none"/>`+line(f.x(-.8),f.y(0),f.x(-.8),f.y(.64),`stroke="${gold}" stroke-width="3" stroke-dasharray="6 4"`)+line(f.x(.8),f.y(0),f.x(.8),f.y(.64),`stroke="${gold}" stroke-width="3" stroke-dasharray="6 4"`)+text(475,49,'Q(θ) = θ²; shaded band ±0.1','text-anchor="end" font-size="16"');
 add('argmin','lec09-instructor-argmin','Uniform error and a separated minimum',svg('The quadratic population objective theta squared, with a uniform band of plus or minus 0.1. At distance at least 0.8, the population gap is at least 0.64.',b),'Outside |θ| < 0.8 the population gap is at least 0.64. Two errors of size 0.1 leave a positive gap. This is the comparison in the proof; an approximate minimizer also requires its optimization error to vanish.');
 return figures;
}
