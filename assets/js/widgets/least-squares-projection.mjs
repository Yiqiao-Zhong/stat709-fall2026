// Original course diagram. A rank-one model in observation space, not a data scatterplot.
export const projectionDefaults = Object.freeze({x1:1,x2:3,b:1});
export function projectionState({x1,x2,b}) {
  for (const v of [x1,x2,b]) if (!Number.isFinite(v)||v < -3||v > 3) throw new RangeError('Coordinates and coefficient must be between -3 and 3.');
  const beta=(x1+x2)/2, fit=[beta,beta], residual=[x1-beta,x2-beta];
  const rss=residual[0]**2+residual[1]**2, extra=2*(beta-b)**2;
  return {x1,x2,b,beta,fit,residual,rss,extra,loss:(x1-b)**2+(x2-b)**2,dot:fit[0]*residual[0]+fit[1]*residual[1]};
}
const navy='#173753',teal='#087f83',gold='#b26419',purple='#80549a',gray='#677989';
const fmt=v=>Math.abs(v)<1e-9?'0':String(Number(v.toFixed(3)));
function text(x,y,s,color=navy,size=15,anchor='start'){return `<text x="${x}" y="${y}" fill="${color}" font-family="Helvetica,Arial,sans-serif" font-size="${size}" text-anchor="${anchor}">${s}</text>`;}
function line(x1,y1,x2,y2,color,width=2,dash=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;}
function arrow(a,b,color,dash=''){
 const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.01)return '';
 const ux=dx/len,uy=dy/len,sz=Math.min(10,len*.35),end=[b[0]-sz*ux,b[1]-sz*uy];
 return line(...a,...b,color,3,dash)+`<polygon points="${b.join(',')} ${end[0]-sz*.4*uy},${end[1]+sz*.4*ux} ${end[0]+sz*.4*uy},${end[1]-sz*.4*ux}" fill="${color}"/>`;
}
export function projectionDrawing(input=projectionDefaults){
 const s=projectionState(input),W=480,H=460,scale=48,xy=([a,b])=>[240+scale*a,225-scale*b],O=xy([0,0]),F=xy(s.fit),X=xy([s.x1,s.x2]),B=xy([s.b,s.b]);
 let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Observation (${fmt(s.x1)}, ${fmt(s.x2)}), fitted vector (${fmt(s.beta)}, ${fmt(s.beta)}), perpendicular residual (${fmt(s.residual[0])}, ${fmt(s.residual[1])}). Candidate (${fmt(s.b)}, ${fmt(s.b)})."><rect x="0" y="0" width="480" height="460" fill="#fffdf8"/>`;
 for(let i=-3;i<=3;i++){
  out+=line(...xy([i,-3.5]),...xy([i,3.5]),'#e5e9e9',1)+line(...xy([-3.5,i]),...xy([3.5,i]),'#e5e9e9',1);
  if(i)out+=text(xy([i,0])[0],245,i,gray,12,'middle')+text(226,xy([0,i])[1]+4,i,gray,12,'end');
 }
 out+=line(...xy([-3.5,0]),...xy([3.5,0]),gray,1.2)+line(...xy([0,-3.5]),...xy([0,3.5]),gray,1.2);
 out+=line(...xy([-3.5,-3.5]),...xy([3.5,3.5]),'#8cb8b8',8)+text(252,35,'span(Z): x2 = x1',teal,16);
 if(Math.abs(s.b-s.beta)>1e-8){out+=line(...X,...B,purple,1.8,'3 5')+`<circle cx="${B[0]}" cy="${B[1]}" r="5" fill="#fffdf8" stroke="${purple}" stroke-width="2"/>`;}
 out+=arrow(O,X,navy)+arrow(O,F,teal)+arrow(F,X,gold,'7 4');
 // The right-angle marker uses the line direction and the actual residual side.
 if(Math.hypot(...s.residual)>.12){const sign=Math.sign(s.residual[1]),u=[-1/Math.SQRT2,1/Math.SQRT2],v=[-sign/Math.SQRT2,-sign/Math.SQRT2],d=10;
 out+=`<polyline points="${F[0]+d*u[0]},${F[1]+d*u[1]} ${F[0]+d*(u[0]+v[0])},${F[1]+d*(u[1]+v[1])} ${F[0]+d*v[0]},${F[1]+d*v[1]}" fill="none" stroke="${gold}" stroke-width="1.6"/>`;}
 out+=`<circle cx="${X[0]}" cy="${X[1]}" r="4" fill="${navy}"/><circle cx="${F[0]}" cy="${F[1]}" r="4" fill="${teal}"/>`;
 out+=text(424,230,'x1',gray)+text(248,59,'x2',gray)+text(240,432,'Observation coordinates; equal axis scales',gray,14,'middle');
 return out+'</svg>';
}
export function gaussianProjectionDrawing(compact=false){
 if(compact){
  let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 420" role="img" aria-label="Independent Gaussian coordinates in model and residual directions."><rect width="340" height="420" fill="#fffdf8"/>';
  out+=text(170,27,'Standardized Gaussian noise',navy,18,'middle')+text(170,56,'G = (X - Z beta) / sigma',navy,18,'middle');
  out+=arrow([170,70],[170,99],gray)+text(170,122,'Rotate to orthogonal coordinates',gray,17,'middle');
  out+='<rect x="12" y="141" width="316" height="95" fill="#e5f3f2" stroke="#087f83"/>';
  out+=text(170,165,'MODEL: p coordinates',teal,18,'middle')+text(170,193,'g1, ..., gp',teal,24,'middle')+text(170,219,'Determine fitted noise',teal,17,'middle');
  out+='<rect x="12" y="250" width="316" height="106" fill="#fff0df" stroke="#b26419"/>';
  out+=text(170,274,'RESIDUAL: n - p coordinates',gold,18,'middle')+text(170,302,'g(p+1), ..., gn',gold,24,'middle')+text(170,332,'Squares sum to chi-square(n - p)',gold,17,'middle');
  return out+text(170,390,'All coordinates: independent N(0,1)',navy,18,'middle')+'</svg>';
 }
 let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 270" role="img" aria-label="Rotate standardized Gaussian noise into an orthonormal basis. The first p independent standard Normal coordinates describe fitted noise; the remaining n minus p describe the residual. Squaring and adding only the latter gives chi-square n minus p."><rect x="0" y="0" width="720" height="270" fill="#fffdf8"/>';
 out+=text(360,27,'Rotate standardized Gaussian noise into model and residual directions',navy,17,'middle');
 out+=text(360,60,'G = (X - Z beta) / sigma',navy,18,'middle');
 out+=arrow([360,72],[360,99],gray)+text(384,90,'orthogonal coordinates',gray,14);
 out+='<rect x="18" y="110" width="326" height="90" rx="7" fill="#e5f3f2" stroke="#087f83"/><rect x="376" y="110" width="326" height="90" rx="7" fill="#fff0df" stroke="#b26419"/>';
 out+=text(181,137,'MODEL DIRECTIONS: p coordinates',teal,15,'middle')+text(181,169,'g1, ..., gp',teal,23,'middle');
 out+=text(539,137,'RESIDUAL DIRECTIONS: n - p coordinates',gold,14,'middle')+text(539,169,'g(p+1), ..., gn',gold,23,'middle');
 out+=text(360,220,'All coordinates are independent N(0,1).',navy,17,'middle');
 out+=text(181,249,'Determine the fitted noise',teal,15,'middle')+text(539,249,'Sum of squares: chi-square(n - p)',gold,15,'middle');
 return out+'</svg>';
}
export function projectionReadout(input=projectionDefaults){
 const s=projectionState(input);return `<dl class="projection-values"><div><dt>Fitted coefficient β̂</dt><dd>${fmt(s.beta)}</dd></div><div><dt>Fitted vector Zβ̂</dt><dd>(${fmt(s.beta)}, ${fmt(s.beta)})</dd></div><div><dt>Residual r</dt><dd>(${s.residual.map(fmt).join(', ')})</dd></div><div><dt>Fit · residual</dt><dd>${fmt(s.dot)}</dd></div></dl><p class="projection-loss">Squared error at b: <strong>${fmt(s.loss)}</strong> = minimum <strong>${fmt(s.rss)}</strong> + extra <strong>${fmt(s.extra)}</strong>.</p>`;
}
export function projectionMarkup(i){
 const id=i.instanceId,s=i.settings.initial;projectionState(s);
 return `<figure id="${id}" class="projection-activity requires-js" data-component="least-squares-projection" data-initial='${JSON.stringify(s)}'><figcaption>Least squares as an orthogonal projection</figcaption><div class="projection-legend"><span class="projection-observed">Solid navy: observation X</span><span class="projection-fit">Solid teal: fitted Zβ̂</span><span class="projection-residual">Dashed amber: residual r</span><span class="projection-candidate">Dotted purple: candidate error</span></div><div class="projection-layout"><div class="projection-graph" data-projection-drawing>${projectionDrawing(s)}</div><div><div class="projection-controls requires-js">${[['x1','Observation x₁'],['x2','Observation x₂'],['b','Candidate coefficient b']].map(([key,label])=>`<div class="projection-control"><label for="${id}-${key}">${label}</label><output for="${id}-${key}" data-projection-value="${key}">${s[key]}</output><input id="${id}-${key}" data-projection-input="${key}" type="range" min="-3" max="3" step="${key==='b'?.05:.1}" value="${s[key]}"></div>`).join('')}<div class="projection-actions"><button type="button" data-projection-fit>Use least-squares fit</button><button type="button" data-projection-reset>Reset</button></div></div><div data-projection-readout>${projectionReadout(s)}</div></div></div><p><a href="#${i.source.explanationLabel}">Why the perpendicular residual is shortest</a> · <a href="#${i.source.fallbackLabel}">Static example</a></p><p role="status" aria-live="polite" class="sr-only" data-projection-status></p></figure>`;
}
export function mountLeastSquaresProjections(){
 for(const card of document.querySelectorAll('[data-component="least-squares-projection"]')){
  const initial=JSON.parse(card.dataset.initial);let state={...initial};
  const render=()=>{const s=projectionState(state);for(const input of card.querySelectorAll('[data-projection-input]')){input.value=state[input.dataset.projectionInput];card.querySelector(`[data-projection-value="${input.dataset.projectionInput}"]`).value=fmt(state[input.dataset.projectionInput]);}card.querySelector('[data-projection-drawing]').innerHTML=projectionDrawing(state);card.querySelector('[data-projection-readout]').innerHTML=projectionReadout(state);card.dataset.state=JSON.stringify(s);};
  const announce=()=>{const s=projectionState(state);card.querySelector('[data-projection-status]').textContent=`Fitted coefficient ${fmt(s.beta)}. Minimum squared error ${fmt(s.rss)}; candidate squared error ${fmt(s.loss)}.`;};
  for(const input of card.querySelectorAll('[data-projection-input]')){input.addEventListener('input',()=>{const v=Number(input.value);if(!Number.isFinite(v)||v< -3||v>3)return;state[input.dataset.projectionInput]=v;render();});input.addEventListener('change',announce);}
  card.querySelector('[data-projection-fit]').addEventListener('click',()=>{state.b=projectionState(state).beta;render();announce();});
  card.querySelector('[data-projection-reset]').addEventListener('click',()=>{state={...initial};render();announce();});render();card.dataset.mounted='true';
 }
}
