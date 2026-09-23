import {ridgeCoordinate,nearestNeighbors,knnData} from './lecture7-models.mjs';
const navy='#18384e',teal='#087e83',gold='#a16b12',plum='#85456d';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const format=x=>Number(x.toFixed(5)).toString();
const text=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
const line=(a,b,c,d,attrs='')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" ${attrs}/>`;
const dot=(x,y,color=teal,r=5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const svg=(title,body,w=520,h=390)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:system-ui,sans-serif;font-size:18px;fill:${navy}"><title>${esc(title)}</title>${body}</svg>`;
const path=(ps,x,y)=>ps.map(([a,b],i)=>`${i?'L':'M'}${x(a).toFixed(3)},${y(b).toFixed(3)}`).join(' ');
function frame(title,xd,yd,xt,yt,xlabel,ylabel,square=false){
 const width=square?250:430,right=65+width;
 const x=v=>65+(v-xd[0])*width/(xd[1]-xd[0]),y=v=>305-(v-yd[0])*250/(yd[1]-yd[0]);
 let body=text(65,26,title,'font-weight="650"')+`<rect x="65" y="55" width="${width}" height="250" fill="#fffdf8" stroke="#cfd7d8"/>`;
 for(const t of xt)body+=line(x(t),55,x(t),305,'stroke="#e1e5e3"')+text(x(t),329,t,'text-anchor="middle"');
 for(const t of yt)body+=line(65,y(t),right,y(t),'stroke="#e1e5e3"')+text(55,y(t)+5,t,'text-anchor="end"');
 body+=text(65+width/2,360,xlabel,'text-anchor="middle"')+`<text transform="translate(18 180) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text>`;
 return {x,y,body};
}
export function ridgeDrawing(lambda){
 const r=ridgeCoordinate(lambda),f=frame('Data fit + penalty',[-2.5,.5],[0,32],[-2,-1,0],[0,8,16,24,32],'Coefficient b','Objective value');let b=f.body;
 const grid=Array.from({length:121},(_,i)=>-2.5+i/40);
 for(const [fun,color,dash] of [[v=>(v+2)**2,navy,'7 4'],[v=>lambda*v*v,plum,'2 4'],[v=>(v+2)**2+lambda*v*v,teal,'']])b+=`<path d="${path(grid.map(v=>[v,fun(v)]),f.x,f.y)}" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/>`;
 b+=line(f.x(r.estimate),f.y(0),f.x(r.estimate),f.y(r.objective),`stroke="${gold}" stroke-width="2"`)+dot(f.x(r.estimate),f.y(r.objective),gold,6)+text(f.x(r.estimate)+10,f.y(r.objective)-14,'Minimum');
 let n=text(65,28,'The same data, a shorter coefficient','font-weight="650"');const x=v=>80+(v+2.5)*400/3;
 n+=line(x(-2.5),135,x(.5),135,`stroke="${navy}" stroke-width="2"`);
 for(const t of [-2,-1,0])n+=line(x(t),128,x(t),142,`stroke="${navy}"`)+text(x(t),163,t,'text-anchor="middle"');
 n+=dot(x(-2),135,navy,6)+line(x(0),115,x(0),145,`stroke="${navy}" stroke-width="3"`)+line(x(-2),105,x(r.estimate),105,`stroke="${teal}" stroke-width="4"`)+dot(x(r.estimate),105,teal,7);
 n+=text(x(-2),195,'OLS = −2','text-anchor="middle"')+text(x(0),195,'Zero','text-anchor="middle"')+text(260,245,`Ridge = ${format(r.estimate)}`,'text-anchor="middle" font-weight="650"')+text(260,278,`Shrinkage factor = ${format(r.factor)}`,'text-anchor="middle"')+text(260,330,'Increase λ to pull the estimate toward zero.','text-anchor="middle"');
 return `<div class="l7-panels">${svg('Ridge objective: dashed data loss, dotted penalty, solid total. Gold marks the minimum.',b)}${svg('Fixed OLS coefficient minus two and ridge coefficient '+format(r.estimate)+' on the same number line.',n)}</div><p class="l7-legend"><span>Dashed navy: data loss</span><span>Dotted plum: penalty</span><span>Solid teal: total</span><span>Gold: minimum</span></p>`;
}
const readout=items=>`<dl class="l7-readout">${items.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`;
export function ridgeReadout(lambda){const r=ridgeCoordinate(lambda);return readout([['λ',format(lambda)],['Shrinkage factor',format(r.factor)],['Fitted coefficient',format(r.estimate)]]);}
export function knnDrawing(k){
 const r=nearestNeighbors(k),ids=new Set(r.selected.map(p=>p.i)),f=frame('Which observations enter the average?',[-1.1,1.1],[-.35,1.35],[-1,-.5,0,.5,1],[0,.5,1],'Input x','Response / fitted value');let b=f.body;
 b+=`<path d="${path(Array.from({length:101},(_,i)=>{const x=-1+i/50;return[x,x*x];}),f.x,f.y)}" fill="none" stroke="${navy}" stroke-width="2" stroke-dasharray="6 3"/>`;
 const xs=r.selected.map(p=>p.x),lo=Math.min(...xs),hi=Math.max(...xs);
 b+=line(f.x(.25),55,f.x(.25),305,`stroke="${gold}" stroke-width="1.5" stroke-dasharray="4 4"`);
 b+=line(f.x(lo),f.y(r.estimate),f.x(hi),f.y(r.estimate),`stroke="${teal}" stroke-width="3"`)+line(f.x(lo),f.y(r.mean),f.x(hi),f.y(r.mean),`stroke="${plum}" stroke-width="2" stroke-dasharray="2 3"`);
 for(const p of knnData)b+=ids.has(p.i)?`<rect x="${f.x(p.x)-5}" y="${f.y(p.y)-5}" width="10" height="10" fill="${teal}" stroke="white"/>`:`<circle cx="${f.x(p.x)}" cy="${f.y(p.y)}" r="4" fill="white" stroke="${navy}" stroke-width="1.5"/>`;
 b+=`<path d="M${f.x(.25)} ${f.y(r.estimate)-8}l8 8 -8 8 -8 -8Z" fill="${gold}" stroke="white"/>`;
 b+=`<circle cx="${f.x(.25)}" cy="${f.y(r.mean)}" r="7" fill="none" stroke="${plum}" stroke-width="2"/>`;
 const labels=[['Fresh noise',r.noise,navy],['Squared bias',r.biasSquared,plum],['Estimator variance',r.variance,teal],['Prediction MSE',r.risk,gold]];
 let bars=text(35,26,'Exact prediction error','font-weight="650"');
 for(const [i,[name,value,color]] of labels.entries()) {const y=62+i*67;bars+=text(35,y,name)+`<rect x="35" y="${y+10}" width="360" height="22" fill="#eceee8"/><rect x="35" y="${y+10}" width="${360*value/.2}" height="22" fill="${color}"/>`+text(405,y+27,format(value));}
 bars+=text(35,358,'Fixed bar scale: 0 to 0.2.','font-size="14"');
 return `<div class="l7-panels">${svg(`${k} neighbors selected. Observed prediction ${format(r.estimate)}; expected prediction ${format(r.mean)} at input 0.25.`,b)}${svg('Prediction MSE equals fresh noise plus squared bias plus estimator variance.',bars)}</div><p class="l7-legend"><span>Squares: selected observations</span><span>Gold diamond: observed prediction</span><span>Dashed navy: true curve</span><span>Plum ring / dotted line: expected prediction</span></p>`;
}
export function knnReadout(k){const r=nearestNeighbors(k);return readout([['Neighbors K',k],['Observed average',format(r.estimate)],['Expected average',format(r.mean)],['True f(0.25)',format(r.target)]])+`<p class="l7-small">Selected inputs: ${r.selected.map(p=>format(p.x)).join(', ')}. Changing K keeps all observations fixed. Readouts are rounded.</p>`;}
export function activityMarkup(i){
 const ridge=i.component==='ridge-orthogonal',id=i.instanceId,key=ridge?'lambda':'k',s=i.settings[key],title=ridge?'Ridge shrinkage: turn the penalty':'Nearest neighbors: choose K',question=ridge?'How does a stronger penalty move the fitted coefficient?':'Which points join the neighborhood, and how does their average change?',drawing=ridge?ridgeDrawing:knnDrawing,values=ridge?ridgeReadout:knnReadout,detail=ridge?'lec07-ridge-visual-details':'lec07-knn-visual-details';
 return `<section class="lecture7-explorer" id="${id}" data-component="${i.component}" aria-labelledby="${id}-title"><h3 id="${id}-title">${title}</h3><p>${question}</p><div class="l7-static">${drawing(s.value)}${values(s.value)}</div><div class="l7-live"><div data-l7-drawing>${drawing(s.value)}</div><div class="l7-controls"><label for="${id}-range">${ridge?'Penalty λ':'Number of neighbors K'}</label><input id="${id}-range" data-l7-input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" aria-describedby="${id}-error"><label class="sr-only" for="${id}-number">${ridge?'Penalty λ':'Number of neighbors K'}, numeric value</label><input id="${id}-number" data-l7-input type="number" min="${s.min}" max="${s.max}" step="${ridge?'any':1}" value="${s.value}" aria-describedby="${id}-error"><button type="button" class="action-button" data-l7-reset>Reset</button></div><p class="l7-error" id="${id}-error" role="status"></p><div data-l7-readout aria-live="polite">${values(s.value)}</div></div><a href="#${detail}">Read the explanation</a></section>`;
}
export function staticGeometry(){
 const f=frame('GD follows the row space',[-.2,1.2],[-.2,1.2],[0,.5,1],[0,.5,1],'Coefficient b₁','Coefficient b₂',true);let b=f.body;
 b+=line(f.x(-.2),f.y(.6),f.x(1.2),f.y(-.1),`stroke="${plum}" stroke-width="3"`)+line(f.x(-.1),f.y(-.2),f.x(.6),f.y(1.2),`stroke="${teal}" stroke-width="2" stroke-dasharray="6 3"`);
 for(let t=0;t<5;t++){const a=1-2**(-t);b+=dot(f.x(.2*a),f.y(.4*a),gold,4);}
 b+=dot(f.x(.2),f.y(.4),teal,6)+text(f.x(.23),f.y(.4)+20,'Minimum norm (1/5, 2/5)')+text(f.x(.62),f.y(.16)+25,'Exact fits')+text(f.x(.31),f.y(.9),'Row space');
 let m=text(65,25,'A separator and its margin','font-weight="650"')+line(260,60,260,310,`stroke="${navy}" stroke-width="3"`)+line(190,60,190,310,`stroke="${plum}" stroke-dasharray="5 4"`)+line(330,60,330,310,`stroke="${teal}" stroke-dasharray="5 4"`);
 for(const [x,y] of [[120,105],[190,205],[145,270]])m+=text(x,y,'−','font-size="30" font-weight="bold" fill="'+plum+'"');
 for(const [x,y] of [[330,110],[405,210],[370,270]])m+=text(x,y,'+','font-size="25" font-weight="bold" fill="'+teal+'"');
 m+=line(260,285,330,285,`stroke="${gold}" stroke-width="3"`)+text(295,310,'margin','text-anchor="middle"')+text(260,350,'Decision line','text-anchor="middle"');
 return [{id:'lec07-geometry-gd',sourceLabel:'lec07-gd-picture',priority:'low',title:'The nearest exact fit lies in the row space',drawing:svg('Exact-fit line b1+2b2=1; zero-initialized GD travels on the row space toward (1/5,2/5).',b)}, {id:'lec07-geometry-margin',sourceLabel:'lec07-classification',priority:'low',title:'Geometric margin: the gap to the nearest observations',drawing:svg('Schematic separable labeled points, decision line, and equal signed-distance margin boundaries.',m)}];
}
