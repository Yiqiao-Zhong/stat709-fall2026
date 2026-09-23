import {psdProjection,gaussianFit,networkPartition,networkEdges,partitions,weightedWhitening} from './lecture8-models.mjs';
const navy='#18384e',teal='#087e83',gold='#a16b12',plum='#85456d';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x.toFixed(4)).toString();
const text=(x,y,s,a='')=>`<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
const line=(x,y,X,Y,a='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" ${a}/>`;
const dot=(x,y,c,r=5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const svg=(title,b,w=520,h=365)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:system-ui,sans-serif;font-size:18px;fill:${navy}"><title>${esc(title)}</title>${b}</svg>`;
const dl=items=>`<dl class="l8-readout">${items.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`;
function frame(title,xd,yd,xt,yt,xlabel,ylabel){
 const x=v=>65+(v-xd[0])*420/(xd[1]-xd[0]),y=v=>290-(v-yd[0])*230/(yd[1]-yd[0]);
 let b=text(65,27,title,'font-weight="650"')+`<rect x="65" y="60" width="420" height="230" fill="#fffdf8" stroke="#cfd7d8"/>`;
 for(const t of xt)b+=line(x(t),60,x(t),290,'stroke="#e1e5e3"')+text(x(t),314,t,'text-anchor="middle"');
 for(const t of yt)b+=line(65,y(t),485,y(t),'stroke="#e1e5e3"')+text(55,y(t)+5,t,'text-anchor="end"');
 b+=text(275,349,xlabel,'text-anchor="middle"')+`<text transform="translate(20 180) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text>`;return {x,y,b};
}
export function psdDrawing(k){const r=psdProjection(k);return '<div class="l8-panels">'+[r.before,r.after].map((values,j)=>{
 const f=frame(j?'After: PSD and rank ≤ K':'Before: empirical spectrum',[.5,3.5],[-1,3.5],[1,2,3],[-1,0,1,2,3],'Eigenvalue index','Eigenvalue');let b=f.b+line(65,f.y(0),485,f.y(0),`stroke="${navy}" stroke-width="2"`);
 values.forEach((v,i)=>{const x=f.x(i+1),y=f.y(v),zero=f.y(0);b+=`<rect x="${x-25}" y="${Math.min(y,zero)}" width="50" height="${Math.max(2,Math.abs(y-zero))}" fill="${j?teal:plum}"/>`+text(x,v>=0?y-10:y+25,fmt(v),'text-anchor="middle"');});return svg((j?'Projected':'Original')+' eigenvalues '+values.join(', '),b);
 }).join('')+'</div>';}
export function psdReadout(k){const r=psdProjection(k);return dl([['Rank bound K',k],['Projected diagonal',r.after.join(', ')],['Actual rank',r.rank],['Squared Frobenius error',fmt(r.errorSquared)]])+`<p class="l8-small">Synthetic diagonal matrix. Increasing K to 3 still discards the negative eigenvalue.</p>`;}
export function gaussianDrawing(sigma){return '<div class="l8-panels">'+[false,true].map(rel=>{
 const f=frame(rel?'Relative likelihood':'Residual sum of squares',[-1,3],rel?[0,1.1]:[0,15],[-1,0,1,2,3],rel?[0,.5,1]:[0,5,10,15],'Candidate mean θ',rel?'L(θ) / L(1)':'RSS(θ)');
 const points=Array.from({length:161},(_,i)=>{const theta=-1+i/40,r=gaussianFit(sigma,theta);return [f.x(theta),f.y(rel?r.relativeLikelihood:r.rss)];});
 let b=f.b+`<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ')}" fill="none" stroke="${teal}" stroke-width="3"/>`+line(f.x(1),60,f.x(1),290,`stroke="${gold}" stroke-width="2" stroke-dasharray="5 4"`)+dot(f.x(1),f.y(rel?1:2),gold,6);
 return svg(rel?`Relative likelihood at sigma ${sigma}, maximized at theta 1. This is not a density over theta.`:'RSS curve, minimized at theta 1 with value 2.',b);
 }).join('')+'</div>';}
export function gaussianReadout(sigma){return dl([['Noise σ',fmt(sigma)],['Fitted mean',1],['Minimum RSS',2]])+'<p class="l8-small">Synthetic observations: 0, 1, 2. RSS(θ) = 3(θ − 1)² + 2. Relative likelihood = exp{−3(θ − 1)² / (2σ²)}. Changing σ changes the width, while the best-fitting mean stays at 1. The likelihood curve is not a density over θ.</p>';}
export function networkDrawing(index){
 const r=networkPartition(index),coords=[[100,85],[100,275],[230,180],[350,180],[455,85],[455,275]];let b=text(35,30,'Two groups of three: A and B','font-weight="650"');
 for(const [i,j] of networkEdges){const same=r.a.includes(i)===r.a.includes(j),[x,y]=coords[i-1],[X,Y]=coords[j-1];b+=line(x,y,X,Y,`stroke="${same?teal:plum}" stroke-width="3" ${same?'':'stroke-dasharray="6 4"'}`);}
 coords.forEach(([x,y],j)=>{const a=r.a.includes(j+1);b+=a?`<circle cx="${x}" cy="${y}" r="25" fill="#e1f0ed" stroke="${teal}" stroke-width="2"/>`:`<rect x="${x-24}" y="${y-24}" width="48" height="48" fill="#f4e6ef" stroke="${plum}" stroke-width="2"/>`;b+=text(x,y+6,j+1,'text-anchor="middle" font-weight="650"')+text(x,y+47,a?'A':'B','text-anchor="middle"');});
 b+=text(35,353,'Solid: within-group. Dashed: between-group.','font-size="16"');
 const order=[...r.a,...r.b],matrix=`<table class="l8-matrix"><caption>Adjacency matrix, ordered by group</caption><thead><tr><th scope="col">Node</th>${order.map(n=>`<th scope="col">${n} (${r.a.includes(n)?'A':'B'})</th>`).join('')}</tr></thead><tbody>${order.map(n=>`<tr><th scope="row">${n} (${r.a.includes(n)?'A':'B'})</th>${order.map(m=>{const edge=networkEdges.some(([i,j])=>i===Math.min(n,m)&&j===Math.max(n,m));return `<td class="${edge?'l8-edge':''} ${r.a.includes(n)===r.a.includes(m)?'l8-within':'l8-between'}">${edge?1:0}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
 return `<div class="l8-panels">${svg(`A: ${r.a.join(', ')}; B: ${r.b.join(', ')}. ${r.within} within-group edges and ${r.between} between-group edges.`,b)}<div class="l8-matrix-wrap">${matrix}</div></div>`;
}
export function networkReadout(index){const r=networkPartition(index);return dl([['Group A',r.a.join(', ')],['Group B',r.b.join(', ')],['Within edges / pairs',`${r.within} / 6`],['Between edges / pairs',`${r.between} / 9`],['Log-likelihood',fmt(r.logLikelihood)],['θᵀYθ',r.quadratic]])+'<p class="l8-small">Fixed synthetic graph, p = 0.4 and q = 0.1. Ten balanced partitions cover all possibilities up to swapping A and B. The log-likelihood includes both edges and nonedges.</p>';}
export const drawingFor={'psd-spectrum':psdDrawing,'gaussian-likelihood':gaussianDrawing,'balanced-network':networkDrawing};
export const readoutFor={'psd-spectrum':psdReadout,'gaussian-likelihood':gaussianReadout,'balanced-network':networkReadout};
export const settingFor={'psd-spectrum':'k','gaussian-likelihood':'sigma','balanced-network':'partition'};
export function activityMarkup(i){
 const c=i.component,id=i.instanceId,s=i.settings[settingFor[c]],draw=drawingFor[c],values=readoutFor[c],network=c==='balanced-network';
 const [title,question,label]=c==='psd-spectrum'?['Keep the positive signal directions','What changes when we allow one more direction?','Rank bound K']:c==='gaussian-likelihood'?['One best mean, different likelihood widths','What does changing the noise level do to the likelihood?','Noise standard deviation σ']:['Try balanced community assignments','Which division gives the observed graph the largest likelihood?','Balanced partition'];
 const control=network?`<select id="${id}-input" data-l8-input>${partitions.map((a,k)=>`<option value="${k}">${a.join(', ')} | ${[1,2,3,4,5,6].filter(n=>!a.includes(n)).join(', ')}</option>`).join('')}</select>`:`<input id="${id}-input" data-l8-input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}"><label class="sr-only" for="${id}-number">${label}, numeric value</label><input id="${id}-number" data-l8-input type="number" min="${s.min}" max="${s.max}" step="${c==='psd-spectrum'?1:'any'}" value="${s.value}" aria-describedby="${id}-error">`;
 return `<section class="lecture8-explorer" id="${id}" data-component="${c}" aria-labelledby="${id}-title"><h3 id="${id}-title">${title}</h3><p>${question}</p><div class="l8-static">${draw(s.value)}${values(s.value)}</div><div class="l8-live"><div data-l8-drawing>${draw(s.value)}</div><div class="l8-controls"><label for="${id}-input">${label}</label>${control}<button type="button" class="action-button" data-l8-reset>Reset</button></div><p class="l8-error" id="${id}-error" role="status"></p><div data-l8-readout aria-live="polite">${values(s.value)}</div></div><a href="#${i.source.label.replaceAll(':','-')}">Read the source explanation</a></section>`;
}
export function staticFigures(){
 const figures=[];const push=(suffix,label,title,body,caption,w=520,h=365)=>figures.push({id:'lec08-fig-'+suffix,sourceLabel:label,title,drawing:svg(title,body,w,h),caption});
 const scale=x=>65+(x-.2)*390/3.6,center=2,half=Math.sqrt(2),lo=center-half,hi=center+half;
 let b=text(35,35,'Center ± half-width','font-weight="650"')+line(scale(.2),180,scale(3.8),180,`stroke="${navy}" stroke-width="2"`)+`<rect x="${scale(lo)}" y="125" width="${scale(hi)-scale(lo)}" height="55" fill="#e1f0ed" stroke="${teal}"/>`;
 [1,2,3].forEach(v=>{b+=dot(scale(v),210,plum,6)+text(scale(v),242,v,'text-anchor="middle"');});
 b+=line(scale(center),95,scale(center),185,`stroke="${gold}" stroke-width="3"`)+text(scale(center),78,'Mean = 2','text-anchor="middle"')+text(scale(lo),115,'â ≈ 0.586','text-anchor="middle"')+text(scale(hi),115,'b̂ ≈ 3.414','text-anchor="middle"')+text(260,298,'Half-width = √(3 × 2/3) = √2','text-anchor="middle"');
 push('uniform','lec08-uniform','Moments choose an interval',b,'Synthetic observations 1, 2, 3: the empirical variance uses denominator n. The fitted interval has the same mean and variance.');
 b=text(35,35,'Word × context counts','font-weight="650"');const labels=['royal','person','travel'],rows=['king','queen','train'],counts=[[18,10,1],[17,11,1],[1,2,20]];
 labels.forEach((l,j)=>b+=text(195+110*j,80,l,'text-anchor="middle"'));
 rows.forEach((r,i)=>{b+=text(115,128+65*i,r,'text-anchor="end"');counts[i].forEach((v,j)=>b+=`<rect x="${150+110*j}" y="${94+65*i}" width="90" height="54" fill="${teal}" fill-opacity="${.1+.8*v/20}"/>`+text(195+110*j,128+65*i,v,'text-anchor="middle"'));});
 b+=text(260,320,'Similar count patterns → similar representations','text-anchor="middle" font-size="17"');
 push('counts','lec08-glove','A pair-count matrix',b,'Illustrative counts, not corpus data or a covariance matrix. GloVe fits weighted log co-occurrence counts; these raw counts show the input structure.');
 b=text(260,40,'One hidden topic h','text-anchor="middle" font-weight="650"')+`<rect x="190" y="65" width="140" height="60" rx="12" fill="#f4e6ef" stroke="${plum}"/>`+text(260,103,'Topic h','text-anchor="middle"');
 [100,260,420].forEach((x,j)=>{b+=line(260,125,x,230,`stroke="${navy}" stroke-width="2"`)+`<rect x="${x-50}" y="230" width="100" height="60" rx="8" fill="#e1f0ed" stroke="${teal}"/>`+text(x,268,`Word x${j+1}`,'text-anchor="middle"');});
 b+=text(260,175,'Independent draws given h','text-anchor="middle" font-size="16"')+text(260,335,'Each word is drawn from the same μₕ.','text-anchor="middle"');
 push('topic','lec08-topic-model','A shared hidden cause',b,'Words are independent conditional on the topic. Without conditioning, the shared topic generally makes the words dependent.');
 const white=weightedWhitening();let combined='';
 [white.before,white.after].forEach((vs,j)=>{const ox=135+j*270,oy=190,unit=88;combined+=text(ox,30,j?'After whitening':'Weighted topics','text-anchor="middle" font-weight="650"')+line(ox-105,oy,ox+105,oy,`stroke="${navy}"`)+line(ox,oy-110,ox,oy+110,`stroke="${navy}"`);vs.forEach(([x,y],k)=>{combined+=line(ox,oy,ox+x*unit,oy-y*unit,`stroke="${k?plum:teal}" stroke-width="4"`)+dot(ox+x*unit,oy-y*unit,k?plum:teal,6)+text(ox+x*unit+8,oy-y*unit,j?(k?'v₂':'v₁'):(k?'2':'1'));});combined+=text(ox,327,j?'√wⱼ Wᵀμⱼ':'√wⱼ μⱼ','text-anchor="middle"');});
 push('whitening','lec08-whitening','Weighted directions become orthonormal',combined,'Exact two-topic example: weights (0.25, 0.75), topics (0.8, 0.2) and (0.2, 0.8). Equal axis scales; the transformed weighted vectors have unit length and zero inner product.',550);
 b=text(35,35,'Two population directions','font-weight="650"');
 [1,-1].forEach((type,j)=>{const y=112+j*118;b+=text(35,y-30,j?'Community direction θ':'Constant direction 1','font-weight="650"');for(let k=0;k<6;k++){const v=j&&k>=3?-1:1,x=60+k*80;b+=`<rect x="${x-23}" y="${y-8}" width="46" height="46" fill="${v>0?'#e1f0ed':'#f4e6ef'}" stroke="${v>0?teal:plum}"/>`+text(x,y+22,v>0?'+1':'−1','text-anchor="middle"');}});
 push('network-directions','lec08-network-relaxation','Separate density from communities',b,'For balanced communities, the label vector is orthogonal to the constant vector. The population decomposition motivates a constrained spectral relaxation; it does not guarantee recovery from every observed graph.');
 return figures;
}
