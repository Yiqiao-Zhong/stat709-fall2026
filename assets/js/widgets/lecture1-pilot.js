import { createRecall } from '../primitives/recall.js';
import { createCard, createSvg, svgEl, scaleLinear, linePath, range, format } from './common.js';
import { nextSeed } from '../primitives/random.mjs';
import { gaussianSample, projectedParameters, checkNumericValue } from './projection-model.mjs';

const target = label => document.getElementById(label.replace(/:/g, '-'));
const paragraph = label => target(label)?.closest('p, li, .statement') || target(label);
function excerpt(label) {
  const template = document.getElementById(`excerpt-${label}`);
  if (!template) throw new Error(`Missing canonical excerpt: ${label}`);
  return template.content.cloneNode(true);
}
function typeset(node) {
  const ready = window.MathJax?.startup?.promise;
  if (ready) ready.then(() => window.MathJax.typesetPromise?.([node])).catch(console.error);
}
function identify(node, instance) {
  node.id = instance.instanceId;
  node.dataset.component = instance.component;
  node.dataset.sourceLabel = instance.source.label;
  node.dataset.componentPriority = instance.source.priority;
}

function gaussianProjection(instance) {
  const settings = instance.settings;
  const {card, body, reset} = createCard('A Gaussian stays Gaussian under projection', 'Predict with the source formula, then rotate the same sample and compare its projection.');
  identify(card, instance);
  body.innerHTML = `<div class="pilot-plots"><div data-scatter></div><div data-projection></div></div>
    <div class="pilot-controls">
      <div><label for="projection-angle">Direction θ (degrees)</label><input id="projection-angle" type="range" min="${settings.angle.min}" max="${settings.angle.max}" step="${settings.angle.step}" value="${settings.angle.value}"><label class="sr-only" for="projection-angle-number">Direction θ in degrees, numeric</label><input id="projection-angle-number" type="number" min="${settings.angle.min}" max="${settings.angle.max}" step="${settings.angle.step}" value="${settings.angle.value}"></div>
      <div><label for="projection-count">Sample count</label><input id="projection-count" type="range" min="${settings.n.min}" max="${settings.n.max}" step="${settings.n.step}" value="${settings.n.value}"><label class="sr-only" for="projection-count-number">Sample count, numeric</label><input id="projection-count-number" type="number" min="${settings.n.min}" max="${settings.n.max}" step="${settings.n.step}" value="${settings.n.value}"></div>
    </div><div class="exercise-toolbar"><button type="button" class="action-button" data-new-sample>New sample</button><button type="button" class="action-button" data-fit>Fit axes</button><span data-seed></span></div>
    <div class="readout" data-parameters></div><p class="control-note" data-clipped></p><p class="control-note" role="status" data-input-status></p>`;
  let seed = settings.randomness.seed, count = settings.n.value, angle = settings.angle.value;
  let scatterDomain = [...settings.projectedDomain], domain = [...settings.projectedDomain];
  let sample = gaussianSample(settings.mean, settings.covariance, seed, count);
  const angleSlider = body.querySelector('#projection-angle'), angleNumber = body.querySelector('#projection-angle-number');
  const countSlider = body.querySelector('#projection-count'), countNumber = body.querySelector('#projection-count-number');
  const status = body.querySelector('[data-input-status]');

  function axes(svg, xDomain, yDomain, xLabel, yLabel) {
    const sx = scaleLinear(...xDomain, 48, 312), sy = scaleLinear(...yDomain, 290, 26);
    for (const x of range(...xDomain, 5)) {
      svg.append(svgEl('line', {x1:sx(x), x2:sx(x), y1:26, y2:290, class:'grid-line'}));
      svg.append(svgEl('text', {x:sx(x), y:307, 'text-anchor':'middle'}, format(x, 1)));
    }
    for (const y of range(...yDomain, 5)) {
      svg.append(svgEl('line', {x1:48, x2:312, y1:sy(y), y2:sy(y), class:'grid-line'}));
      svg.append(svgEl('text', {x:43, y:sy(y)+4, 'text-anchor':'end'}, format(y, 2)));
    }
    svg.append(svgEl('text', {x:180, y:332, 'text-anchor':'middle'}, xLabel));
    svg.append(svgEl('text', {x:48, y:16}, yLabel));
    return [sx, sy];
  }
  function draw() {
    const p = projectedParameters(settings.mean, settings.covariance, angle);
    const projections = sample.map(([x,y]) => x*p.u[0]+y*p.u[1]);
    const scatter = createSvg('Fixed Gaussian sample and projection direction', 'Equal scales on both coordinates. The line passes through the origin in the selected unit direction.', '0 0 350 345');
    const [sx, sy] = axes(scatter, scatterDomain, scatterDomain, 'X₁', 'X₂');
    const [lo, hi] = scatterDomain;
    const extent = Math.min(...p.u.filter(x => x!==0).map(x => Math.min(Math.abs(lo/x), Math.abs(hi/x))));
    scatter.append(svgEl('line', {x1:sx(-extent*p.u[0]), y1:sy(-extent*p.u[1]), x2:sx(extent*p.u[0]), y2:sy(extent*p.u[1]), stroke:'#ad7210', 'stroke-width':2, 'stroke-dasharray':'6 4'}));
    let scatterExcluded = 0;
    for (const [x,y] of sample) {
      if (x<lo || x>hi || y<lo || y>hi) { scatterExcluded++; continue; }
      scatter.append(svgEl('circle',{cx:sx(x),cy:sy(y),r:2.2,fill:'#125b9a',opacity:.5}));
    }
    const histogram = createSvg('Projected observations and Gaussian reference', 'Blue bars are empirical density using the full sample denominator. The solid gold curve is the theoretical Gaussian density.', '0 0 350 345');
    const bins = 32, width = (domain[1]-domain[0])/bins, counts = Array(bins).fill(0);
    let excluded = 0;
    projections.forEach(x => {
      if (x<domain[0] || x>domain[1]) excluded++;
      else counts[Math.min(bins-1, Math.floor((x-domain[0])/width))]++;
    });
    // A fixed vertical density scale makes comparisons meaningful as θ changes.
    const maxDensity = 1.2;
    const [hx, hy] = axes(histogram, domain, [0,maxDensity], 'uᵀX', 'Density');
    counts.forEach((n,i) => histogram.append(svgEl('rect',{x:hx(domain[0]+i*width)+.5,y:hy(Math.min(maxDensity,n/(count*width))),width:264/bins-1,height:290-hy(Math.min(maxDensity,n/(count*width))),fill:'#125b9a',opacity:.45})));
    let densityClipped = counts.some(n => n/(count*width)>maxDensity);
    if (p.variance===0) {
      if(p.mean>=domain[0] && p.mean<=domain[1]) histogram.append(svgEl('line',{x1:hx(p.mean),x2:hx(p.mean),y1:290,y2:45,stroke:'#ad7210','stroke-width':3}));
      histogram.append(svgEl('text',{x:180,y:55,'text-anchor':'middle'},'Point mass (no density)'));
    } else {
      const density = x => Math.exp(-.5*((x-p.mean)/p.sd)**2)/(p.sd*Math.sqrt(2*Math.PI));
      densityClipped ||= density(p.mean)>maxDensity;
      histogram.append(svgEl('path',{d:linePath(range(...domain,180).map(x=>[hx(x),hy(Math.min(maxDensity,density(x)))])),fill:'none',stroke:'#ad7210','stroke-width':2.5}));
    }
    body.querySelector('[data-scatter]').replaceChildren(scatter);
    body.querySelector('[data-projection]').replaceChildren(histogram);
    body.querySelector('[data-seed]').textContent = `Seed ${seed} · n = ${count}`;
    body.querySelector('[data-parameters]').textContent = `u = (${format(p.u[0],4)}, ${format(p.u[1],4)}); theoretical mean = ${format(p.mean,4)}; variance = ${format(p.variance,4)}; standard deviation = ${format(p.sd,4)}.`;
    body.querySelector('[data-clipped]').textContent = `Blue bars: sampled density; gold line: Gaussian reference. Outside axes: ${scatterExcluded} two-dimensional points, ${excluded} projections. Histogram denominator: all ${count} observations.${densityClipped?' Density exceeds the fixed vertical scale.':''}`;
    card.dataset.samplePrefix = JSON.stringify(sample.slice(0,5));
    card.dataset.projectedVariance = String(p.variance);
    card.dataset.projectedDomain = JSON.stringify(domain);
    card.dataset.seed = String(seed);
  }
  function bind(slider, numeric, specification, change) {
    slider.addEventListener('input',()=>{numeric.value=slider.value;change(Number(slider.value));status.textContent='';draw();});
    numeric.addEventListener('input',()=>{
      const value=Number(numeric.value);
      const valid=numeric.value.trim()!=='' && Number.isFinite(value) && value>=specification.min && value<=specification.max && Math.abs((value-specification.min)/specification.step-Math.round((value-specification.min)/specification.step))<1e-8;
      numeric.setAttribute('aria-invalid',String(!valid));
      if(!valid) {status.textContent=`Enter a value from ${specification.min} to ${specification.max} in steps of ${specification.step}; the last valid plot is retained.`;return;}
      slider.value=numeric.value;change(value);status.textContent='';draw();
    });
  }
  bind(angleSlider,angleNumber,settings.angle,value=>{angle=value;});
  bind(countSlider,countNumber,settings.n,value=>{count=value;sample=gaussianSample(settings.mean,settings.covariance,seed,count);});
  body.querySelector('[data-new-sample]').addEventListener('click',()=>{seed=nextSeed(seed);sample=gaussianSample(settings.mean,settings.covariance,seed,count);draw();status.textContent=`New sample, seed ${seed}.`;});
  body.querySelector('[data-fit]').addEventListener('click',()=>{
    const p=projectedParameters(settings.mean,settings.covariance,angle);
    const limit=Math.max(1,...sample.flat().map(Math.abs))*1.08;
    scatterDomain=[-limit,limit];
    const projected=sample.map(([x,y])=>x*p.u[0]+y*p.u[1]);
    const lower=Math.min(...projected,p.mean-4*p.sd), upper=Math.max(...projected,p.mean+4*p.sd), pad=Math.max(.25,(upper-lower)*.08);
    domain=[lower-pad,upper+pad];draw();status.textContent='Axes fitted; these limits remain fixed until Fit axes or Reset.';
  });
  reset.addEventListener('click',()=>{
    seed=settings.randomness.seed;count=settings.n.value;angle=settings.angle.value;
    scatterDomain=[...settings.projectedDomain];domain=[...settings.projectedDomain];
    angleSlider.value=angleNumber.value=angle;countSlider.value=countNumber.value=count;
    [angleNumber,countNumber].forEach(n=>n.removeAttribute('aria-invalid'));
    sample=gaussianSample(settings.mean,settings.covariance,seed,count);draw();status.textContent='Authored settings and sample restored.';
  });
  paragraph(instance.source.label).after(card);draw();
}

function recall(instance) {
  const prompt=paragraph(instance.settings.linkTextLabel);
  const link=[...prompt.querySelectorAll('a')].find(a=>a.hash===`#${instance.settings.targetLabel}`);
  const title=link?.textContent.trim() || target(instance.settings.targetLabel)?.closest('.statement')?.querySelector('.statement-heading')?.textContent.trim();
  if(!title)throw new Error(`Missing canonical recall title: ${instance.instanceId}`);
  const {wrapper,panel}=createRecall({id:instance.instanceId,title,priority:instance.source.priority,
    content:excerpt(instance.settings.excerptLabel || instance.settings.targetLabel),href:`#${instance.settings.targetLabel}`,presentation:instance.settings.presentation});
  identify(wrapper,instance);paragraph(instance.source.label).after(wrapper);typeset(panel);
}

function answerCheck(instance) {
  const box=document.createElement('section');identify(box,instance);box.className='answer-check readout';
  box.innerHTML=`<label for="projection-answer-input">Your projected variance at 45°</label><p class="control-note">Use decimal or scientific notation, in squared units. Absolute tolerance: ${instance.settings.absoluteTolerance}; relative tolerance: ${instance.settings.relativeTolerance}.</p><input id="projection-answer-input" type="text" inputmode="decimal" autocomplete="off" aria-describedby="projection-answer-feedback"><div class="exercise-toolbar"><button type="button" class="action-button" data-check>Check</button><button type="button" class="action-button" data-retry>Retry / clear</button><a href="#${instance.settings.solutionLabel}">Reveal explanation</a></div><p id="projection-answer-feedback" role="status"></p><div data-source-feedback hidden></div>`;
  const input=box.querySelector('input'), feedback=box.querySelector('[role=status]'), sourceFeedback=box.querySelector('[data-source-feedback]');
  sourceFeedback.append(excerpt(instance.settings.feedbackLabel));
  function check() {
    const result=checkNumericValue(input.value,instance.settings);
    feedback.textContent={invalid:'Enter a finite decimal or scientific number (for example, 2.25 or 2.25e0). Fractions and empty responses are not checked.',domain:'A variance cannot be negative. The last plot remains unchanged.',correct:'Correct within the stated tolerance. Compare your calculation with the source explanation.',incorrect:'This value is outside the stated tolerance. Review the covariance cross term, or reveal the explanation.'}[result];
    box.dataset.result=result;input.setAttribute('aria-invalid',String(result==='invalid'||result==='domain'));
    sourceFeedback.hidden=result!=='incorrect';
  }
  box.querySelector('[data-check]').addEventListener('click',check);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')check();});
  box.querySelector('[data-retry]').addEventListener('click',()=>{input.value='';input.removeAttribute('aria-invalid');feedback.textContent='';sourceFeedback.hidden=true;delete box.dataset.result;input.focus();});
  paragraph(instance.source.label).after(box);typeset(sourceFeedback);
}

function proofWalkthrough(instance) {
  const solution=target(instance.source.label).closest('.solution');
  // Pandoc may put several labeled source passages in one paragraph. Move
  // sibling nodes into separate spans; do not duplicate or re-typeset a proof.
  function segment(label) {
    const anchor=target(label);
    if(!solution.contains(anchor))return paragraph(label);
    const wrapper=document.createElement('span');wrapper.className='source-segment';
    anchor.before(wrapper);
    let node=anchor;
    do {
      const next=node.nextSibling;wrapper.append(node);node=next;
    } while(node && !(node.nodeType===1 && node.classList.contains('source-anchor')));
    return wrapper;
  }
  const toolbar=document.createElement('div');identify(toolbar,instance);toolbar.className='proof-toolbar requires-js';
  toolbar.innerHTML='<button type="button" class="action-button" data-guided>Guided view</button> <button type="button" class="action-button" data-back disabled>Back</button> <button type="button" class="action-button" data-next disabled>Next</button> <button type="button" class="action-button" data-complete>Show complete argument</button><p role="status">Continuous view: the complete solution is available below.</p>';
  solution.querySelector('.solution-body').prepend(toolbar);
  let index=-1;
  const steps=instance.settings.steps.map(step=>({paragraph:segment(step.label),reasons:step.reasonLabels.map(segment)}));
  function show(next) {
    index=next;solution.querySelectorAll('.guided-current, .guided-reason').forEach(n=>n.classList.remove('guided-current','guided-reason'));
    toolbar.querySelector('[data-back]').disabled=index<=0;
    toolbar.querySelector('[data-next]').disabled=index<0||index===steps.length-1;
    toolbar.querySelector('[role=status]').textContent=index<0?'Continuous view: the complete solution is available below.':`Step ${index+1} of ${steps.length} highlighted. All assumptions and the full argument remain visible.`;
    if(index>=0)steps[index].paragraph.classList.add('guided-current');
    toolbar.dataset.view=index<0?'continuous':'guided';
  }
  steps.forEach((step,i)=>{
    const why=document.createElement('button');why.type='button';why.className='why-button requires-js';why.textContent=`Why step ${i+1}?`;
    why.addEventListener('click',()=>{show(i);step.reasons.filter(p=>solution.contains(p)).forEach(p=>p.classList.add('guided-reason'));toolbar.querySelector('[role=status]').textContent=`Reason for step ${i+1} highlighted in the complete solution.`;});
    step.paragraph.append(document.createTextNode(' '),why);
  });
  toolbar.querySelector('[data-guided]').addEventListener('click',()=>show(0));
  toolbar.querySelector('[data-next]').addEventListener('click',()=>show(Math.min(steps.length-1,index+1)));
  toolbar.querySelector('[data-back]').addEventListener('click',()=>show(Math.max(0,index-1)));
  toolbar.querySelector('[data-complete]').addEventListener('click',()=>show(-1));
}

export function mountLecturePilot() {
  const manifest=JSON.parse(document.getElementById('lecture-components').textContent);
  const implementations={'gaussian-projection':gaussianProjection,'reference-preview':recall,'answer-check':answerCheck,'proof-walkthrough':proofWalkthrough};
  for(const instance of manifest.instances) {
    if(instance.selection!=='selected')continue;
    // The retained convexity card reads its own selected manifest settings.
    if(instance.component==='convexity-chord')continue;
    if(!implementations[instance.component])throw new Error(`Unimplemented component: ${instance.component}`);
    implementations[instance.component](instance);
  }
}
