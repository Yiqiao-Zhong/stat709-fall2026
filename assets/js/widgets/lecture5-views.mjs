import {sumCdf,sumSlice,sumRegion,annuli,directionStats,groupValues,groupWeights,conditionalPredictions,weightedMean,regressionLoss} from './lecture5-models.mjs';

const navy='#18384e',teal='#087e83',gold='#b77b18',plum='#85456d',gray='#7a8187';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const number = x => x===null?'—':Math.abs(x)<1e-10?'0':Number(x.toFixed(4)).toString();
const text=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
const line=(x1,y1,x2,y2,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
const circle=(x,y,r,attrs='')=>`<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/>`;
const svg=(title,body,width=360,height=350)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" style="font-family:system-ui,sans-serif;font-size:14px;fill:${navy}"><title>${esc(title)}</title>${body}</svg>`;
function frame(title,xDomain,yDomain,xTicks,yTicks,xLabel,yLabel) {
  const x=v=>60+(v-xDomain[0])*264/(xDomain[1]-xDomain[0]);
  const y=v=>294-(v-yDomain[0])*264/(yDomain[1]-yDomain[0]);
  let body=text(60,18,title,'font-weight="650"')+`<rect x="60" y="30" width="264" height="264" fill="#fffdf8" stroke="#d8d9d5"/>`;
  for(const t of xTicks)body+=line(x(t),30,x(t),294,'stroke="#e7e8e3"')+text(x(t),315,number(t),'text-anchor="middle"');
  for(const t of yTicks)body+=line(60,y(t),324,y(t),'stroke="#e7e8e3"')+text(51,y(t)+5,number(t),'text-anchor="end"');
  body+=text(194,342,xLabel,'text-anchor="middle"')+`<text transform="translate(17 164) rotate(-90)" text-anchor="middle">${esc(yLabel)}</text>`;
  return {x,y,body};
}
const path=(points,x,y,close=false)=>points.map((p,i)=>`${i?'L':'M'}${x(p[0])},${y(p[1])}`).join(' ')+(close?' Z':'');
const panel=(caption,drawing)=>`<div class="l5-panel"><p class="l5-panel-caption">${caption}</p>${drawing}</div>`;
const value=(label,v,key)=>`<div><dt>${label}</dt><dd data-l5-value="${key}">${v}</dd></div>`;

export function sumSquare(z,probe=.25) {
  const a=frame('Probability in the unit square',[0,1],[0,1],[0,.5,1],[0,.5,1],'x','y');
  const boundary=z<=1?[[0,z],[z,0]]:[[z-1,1],[1,z-1]];
  const body=a.body+`<path d="${path(sumRegion(z),a.x,a.y,true)}" fill="${teal}" fill-opacity=".2"/>`+
    `<path d="${path(boundary,a.x,a.y)}" fill="none" stroke="${navy}" stroke-width="2.5"/>`+
    line(a.x(0),a.y(probe),a.x(sumSlice(z,probe)),a.y(probe),`stroke="${gold}" stroke-width="5"`)+circle(a.x(sumSlice(z,probe)),a.y(probe),4,`fill="${gold}"`);
  return svg(`Independent uniform X and Y: shaded probability ${number(sumCdf(z))} below x+y=${number(z)}. Slice at y=${number(probe)} has length ${number(sumSlice(z,probe))}.`,body);
}
export function sumDrawing(z,probe) {
  const a=frame('Add the slice lengths',[0,1],[0,1],[0,.5,1],[0,.5,1],'y','q_z(y)');
  const points=Array.from({length:101},(_,i)=>[i/100,sumSlice(z,i/100)]);
  const body=a.body+`<path d="${path([[0,0],...points,[1,0]],a.x,a.y,true)}" fill="${teal}" fill-opacity=".2"/>`+
    `<path d="${path(points,a.x,a.y)}" fill="none" stroke="${navy}" stroke-width="2.5"/>`+
    line(a.x(probe),a.y(0),a.x(probe),a.y(sumSlice(z,probe)),`stroke="${gold}" stroke-width="5"`)+circle(a.x(probe),a.y(sumSlice(z,probe)),4,`fill="${gold}"`);
  return panel('Move the boundary x + y = z',sumSquare(z,probe))+panel('Same probability, added over y',svg(`Area under the slice function equals ${number(sumCdf(z))}.`,body));
}
export const sumReadout=(z,y)=>`<dl class="l5-readout">${value('Threshold z',number(z),'z')}${value('Slice length',number(sumSlice(z,y)),'slice')}${value('P(X + Y ≤ z)',number(sumCdf(z)),'cdf')}</dl>`;

function sector(x,y,r,angle,color,opacity='.1') {
  const count=Math.max(2,Math.ceil(angle/4)+1);
  const pts=[[0,0],...Array.from({length:count},(_,i)=>{const t=angle*Math.PI/180*i/(count-1);return [r*Math.cos(t),r*Math.sin(t)];})];
  return `<path d="${path(pts,x,y,true)}" fill="${color}" fill-opacity="${opacity}"/>`;
}
export function directionDrawing(points,shell,angle,selected=0) {
  const [lo,hi]=annuli[shell], selectedPoint=points[selected];
  return [false,true].map(unit=>{
    const domain=unit?[-1.2,1.2]:[-4,4],a=frame(unit?'Directions U = G / ‖G‖':'Gaussian points G',domain,domain,unit?[-1,0,1]:[-4,0,4],unit?[-1,0,1]:[-4,0,4],unit?'u₁':'g₁',unit?'u₂':'g₂');
    let body=a.body+sector(a.x,a.y,unit?1:4,angle,teal);
    for(const r of unit?[1]:[.5,1.5,2.5])body+=circle(a.x(0),a.y(0),Math.abs(a.x(r)-a.x(0)),`fill="none" stroke="${gray}" stroke-dasharray="4 4"`);
    for(const [i,p] of points.entries()) {
      const active=p.r>=lo&&p.r<hi,inSector=p.theta<angle*Math.PI/180,divisor=unit?p.r:1;
      body+=circle(a.x(p.x/divisor),a.y(p.y/divisor),unit?2.2:2.6,`fill="${active?(inSector?teal:navy):gray}" opacity="${active?'.7':'.12'}" data-l5-point="${i}"`);
    }
    if(selectedPoint){const p=selectedPoint,d=unit?p.r:1;body+=line(a.x(0),a.y(0),a.x(p.x/d),a.y(p.y/d),`stroke="${plum}" stroke-width="2"`)+circle(a.x(p.x/d),a.y(p.y/d),5,`fill="white" stroke="${plum}" stroke-width="2.5"`);}
    return panel(unit?'The same points, with radius removed':'Select a shell; keep the sample fixed',svg(`${unit?'Unit directions':'Gaussian cloud'}, ${shell} shell, sector ${angle} degrees. Highlighted point ${selected+1}.`,body));
  }).join('');
}
export function directionReadout(points,shell,angle,selected) {
  const s=directionStats(points,shell,angle),p=points[selected];
  const shellLabel={all:'All radii',inner:'Inner shell: 0.5 ≤ R < 1.5',outer:'Outer shell: 1.5 ≤ R < 2.5'}[shell];
  return `<p class="l5-small">${shellLabel}.</p><dl class="l5-readout">${value('Exact sector probability',number(s.exact),'exact')}${value('Observed sector fraction',`${s.count} / ${s.n} = ${number(s.fraction)}`,'sample')}${value('Shell probability',number(s.mass),'mass')}</dl><p class="l5-small">Teal: inside the sector. Faint points: outside the selected shell. Highlighted point ${selected+1}: radius ${number(p.r)}; its direction keeps the same angle.</p>`;
}
export function directionStatic() {
  const a=frame('Each shell has uniform angles',[-3,3],[-3,3],[-3,0,3],[-3,0,3],'g₁','g₂');
  let b=a.body;
  for(const r of [.5,1.5,2.5])b+=circle(a.x(0),a.y(0),a.x(r)-a.x(0),`fill="none" stroke="${navy}" stroke-width="2"`);
  b+=line(a.x(-2.5),a.y(0),a.x(2.5),a.y(0),`stroke="${gold}" stroke-width="2"`)+line(a.x(0),a.y(-2.5),a.x(0),a.y(2.5),`stroke="${gold}" stroke-width="2"`);
  for(const [x,y] of [[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7],[1.4,1.4],[-1.4,1.4],[1.4,-1.4],[-1.4,-1.4]])b+=text(a.x(x),a.y(y)+5,'¼','text-anchor="middle"');
  const c=frame('Rays map onto the unit circle',[-1.2,1.2],[-1.2,1.2],[-1,0,1],[-1,0,1],'u₁','u₂');let d=c.body+circle(c.x(0),c.y(0),c.x(1)-c.x(0),`fill="none" stroke="${teal}" stroke-width="3"`);
  for(let i=0;i<8;i++){const t=i*Math.PI/4;d+=line(c.x(0),c.y(0),c.x(Math.cos(t)),c.y(Math.sin(t)),`stroke="${gold}"`)+circle(c.x(Math.cos(t)),c.y(Math.sin(t)),4,`fill="${teal}"`);}
  return panel('¼ of each shell’s probability in each quadrant',svg('Two annuli, each divided into four equal-probability angular sectors.',b))+panel('Normalization preserves the angle',svg('Radial rays meet the unit circle at the same angles.',d));
}
export function groupsDrawing(mode) {
  const predictions=conditionalPredictions(mode),left=58,scale=530,top=36,bottom=300,y=v=>bottom-v*29;
  let b=text(left,20,'Same outcomes, different information','font-weight="650"');
  for(const t of [0,2,4,6,8])b+=line(left,y(t),left+scale,y(t),'stroke="#deded8"')+text(left-12,y(t)+5,t,'text-anchor="end"');
  let mass=0;
  for(let i=0;i<6;i++){
    const x=left+mass*scale,w=groupWeights[i]*scale;
    b+=`<rect x="${x+2}" y="${y(groupValues[i])}" width="${w-4}" height="${bottom-y(groupValues[i])}" fill="${navy}" fill-opacity=".22"/>`+
      line(x,y(predictions[i]),x+w,y(predictions[i]),`stroke="${teal}" stroke-width="4"`)+text(x+w/2,320,String(i+1),'text-anchor="middle"')+text(x+w/2,y(predictions[i])-8,number(predictions[i]),'text-anchor="middle"');
    mass+=groupWeights[i];
  }
  if(mode==='group')b+=line(left+scale/2,top,left+scale/2,bottom,`stroke="${plum}" stroke-dasharray="5 4"`)+text(left+scale/4,40,'Group A','text-anchor="middle"')+text(left+3*scale/4,40,'Group B','text-anchor="middle"');
  b+=text(left+scale/2,346,'Outcome (tile width = probability)','text-anchor="middle"');
  return svg(`Conditional expectation with ${mode} information. Predictions ${predictions.join(', ')}; weighted mean 3.5.`,b,640,358);
}
export function groupsTable(mode,all=false) {
  const row=(name,values)=>`<tr><th scope="row">${name}</th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`;
  return `<div class="l5-table-scroll"><table class="l5-values"><caption>Finite probability model</caption><thead><tr><th scope="col">Outcome</th>${groupValues.map((_,i)=>`<th scope="col">${i+1}</th>`).join('')}</tr></thead><tbody>${row('Probability',['1/8','1/8','2/8','2/8','1/8','1/8'])}${row('X',groupValues)}${all?['none','group','outcome'].map(k=>row({none:'No observation',group:'Observe group',outcome:'Observe outcome'}[k],conditionalPredictions(k).map(number))).join(''):row('Prediction',conditionalPredictions(mode).map(number))}</tbody></table></div>`;
}
export const groupsReadout=mode=>`<dl class="l5-readout">${value('Information',{none:'No observation',group:'Group A or B',outcome:'Exact outcome'}[mode],'mode')}${value('Mean prediction',number(weightedMean(conditionalPredictions(mode))),'mean')}${value('E[X]','3.5','expectation')}</dl>`;

export function regressionDrawing(z,c) {
  const a=frame('Responses and conditional means',[-.5,2.5],[-2.5,4.5],[0,1,2],[-2,0,2,4],'predictor z','response Y / prediction c');
  let b=a.body+`<path d="${path([[0,0],[1,1],[2,2]],a.x,a.y)}" stroke="${teal}" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`;
  for(const g of [0,1,2]){
    for(const response of [g-1,g+1])b+=circle(a.x(g),a.y(response),6,`fill="${navy}" opacity="${g===z?1:.35}"`);
    b+=`<rect x="${a.x(g)-5}" y="${a.y(g)-5}" width="10" height="10" fill="${teal}"/>`;
  }
  for(const [i,response] of [z-1,z+1].entries())b+=line(a.x(z+(i?1:-1)*.09),a.y(response),a.x(z+(i?1:-1)*.09),a.y(c),`stroke="${gold}" stroke-width="3"`);
  b+=line(a.x(z-.3),a.y(c),a.x(z+.3),a.y(c),`stroke="${plum}" stroke-width="3"`)+text(a.x(z+.32),a.y(c)+4,'c');
  const d=frame('Average squared residual',[-2,4],[0,17],[-2,0,2,4],[0,4,8,12,16],'prediction c','conditional loss');let e=d.body;
  for(const g of [0,1,2]){
    const pts=Array.from({length:121},(_,i)=>{const v=-2+i*.05;return [v,regressionLoss(g,v).total];});
    e+=`<path d="${path(pts,d.x,d.y)}" fill="none" stroke="${[gold,navy,plum][g]}" stroke-width="${g===z?3:1.5}" opacity="${g===z?1:.35}"/>`+circle(d.x(g),d.y(1),4,`fill="${teal}"`);
    e+=text(d.x(3.2),d.y(regressionLoss(g,3.2).total)-7,`z = ${g}`,'text-anchor="middle"');
  }
  e+=circle(d.x(c),d.y(regressionLoss(z,c).total),5,`fill="${plum}" stroke="white" stroke-width="1.5"`);
  return panel('Dots: possible Y · squares: conditional means. Dashed line: guide between the three means.',svg(`At predictor ${z}, responses are ${z-1} and ${z+1}, each with probability one half. Prediction ${number(c)}.`,b))+panel('Each curve is minimized at its group mean',svg(`Conditional losses for z=0,1,2. Selected group ${z} has loss ${number(regressionLoss(z,c).total)}.`,e));
}
export function regressionReadout(z,c) {
  const l=regressionLoss(z,c);
  return `<dl class="l5-readout">${value('Conditional mean μ(z)',z,'mu')}${value('Remaining noise',1,'noise')}${value('Excess loss',number(l.excess),'excess')}${value('Total conditional loss',number(l.total),'loss')}</dl><div class="l5-loss-bar" role="img" aria-label="Loss decomposition: noise 1 plus excess ${number(l.excess)}"><span style="width:${100/17}%" class="l5-noise"></span><span style="width:${100*l.excess/17}%" class="l5-excess"></span></div><p class="l5-small">Squared residual contributions (each weighted by ½): ${number(l.contributions[0])} + ${number(l.contributions[1])} = ${number(l.total)}. Curve labels: gold z = 0; navy z = 1; plum z = 2.</p>`;
}
const range=(id,key,label,s)=>`<div class="l5-control"><label for="${id}-${key}">${label}</label><input id="${id}-${key}" type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" data-l5-key="${key}" aria-describedby="${id}-error"><label class="sr-only" for="${id}-${key}-number">${label}, numeric value</label><input id="${id}-${key}-number" type="number" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" data-l5-key="${key}" aria-describedby="${id}-error"></div>`;
const choices=(key,label,options,current)=>`<div class="l5-choices" role="group" aria-label="${label}">${options.map(([v,t])=>`<button type="button" data-l5-choice="${key}" data-value="${v}" aria-pressed="${v===String(current)}">${t}</button>`).join('')}</div>`;
export function activityMarkup(instance,points) {
  const {instanceId:id,component,settings:s}=instance;let title,live,stat,controls,readout;
  if(component==='sum-cdf-slices'){
    title='See how the slices add up';live=sumDrawing(s.threshold.value,s.slice.value);readout=sumReadout(s.threshold.value,s.slice.value);
    stat=[.5,1,1.5].map(z=>panel(`z = ${z} · probability = ${number(sumCdf(z))}`,sumSquare(z,.25))).join('');
    controls=range(id,'threshold','Sum threshold z',s.threshold)+`<details class="l5-extra"><summary>Inspect a slice</summary>${range(id,'slice','Slice position y',s.slice)}</details>`;
  } else if(component==='gaussian-direction'){
    title='From Gaussian noise to a uniform direction';live=directionDrawing(points,s.shell,s.angle.value);readout=directionReadout(points,s.shell,s.angle.value,0);stat=directionStatic();
    controls=choices('shell','Radial shell',[['all','All points'],['inner','Inner shell'],['outer','Outer shell']],s.shell)+range(id,'angle','Sector width (degrees)',s.angle)+`<button type="button" class="action-button" data-l5-next>Next point</button>`;
  } else if(component==='conditional-groups'){
    title='What information does the prediction use?';live=groupsDrawing(s.mode);readout=groupsReadout(s.mode)+groupsTable(s.mode);stat=groupsDrawing('group')+groupsTable('group',true);
    controls=choices('mode','Available information',[['none','No observation'],['group','Observe the group'],['outcome','Observe the outcome']],s.mode);
  } else if(component==='regression-loss'){
    title='Find the best prediction within a group';live=regressionDrawing(s.group,s.prediction.value);readout=regressionReadout(s.group,s.prediction.value);stat=regressionDrawing(1,1);
    controls=choices('group','Predictor group',[['0','z = 0'],['1','z = 1'],['2','z = 2']],s.group)+range(id,'prediction','Prediction c',s.prediction)+`<button type="button" class="action-button" data-l5-best>Use the conditional mean</button>`;
  } else throw new Error('Unknown Lecture 5 visualization');
  const single=component==='conditional-groups'?' l5-single':'';
  return `<section class="lecture5-explorer" id="${id}" data-component="${component}" aria-labelledby="${id}-title"><h4 id="${id}-title">${title}</h4><div class="l5-static"><div class="l5-panels${single}">${stat}</div></div><div class="l5-live"><div class="l5-panels${single}" data-l5-drawing>${live}</div><div class="l5-controls">${controls}<button type="button" class="action-button" data-l5-reset>Reset</button></div><div data-l5-readout role="status" aria-live="polite">${readout}</div><p class="l5-error" id="${id}-error" role="status"></p></div><p class="l5-explanation-link"><a href="#${instance.source.explanationLabel}">Read the picture’s explanation</a></p></section>`;
}
