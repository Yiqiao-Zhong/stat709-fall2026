import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {sumDrawing,sumReadout,directionDrawing,directionReadout,groupsDrawing,groupsReadout,groupsTable,regressionDrawing,regressionReadout} from './lecture5-views.mjs';

export function mountLecture5() {
  mountSourceReadingAids();
  const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
  const points=JSON.parse(document.getElementById('lecture5-gaussian-points').textContent);
  for(const instance of instances.filter(i=>i.selection==='selected'&&i.component!=='reference-preview')) {
    const card=document.getElementById(instance.instanceId),s=instance.settings;
    const initial=instance.component==='sum-cdf-slices'?{threshold:s.threshold.value,slice:s.slice.value}:instance.component==='gaussian-direction'?{shell:s.shell,angle:s.angle.value,point:0}:instance.component==='conditional-groups'?{mode:s.mode}:{group:s.group,prediction:s.prediction.value};
    let state={...initial};const drawing=card.querySelector('[data-l5-drawing]'),readout=card.querySelector('[data-l5-readout]'),error=card.querySelector('.l5-error');
    const inputs=[...card.querySelectorAll('[data-l5-key]')],buttons=[...card.querySelectorAll('[data-l5-choice]')];
    const render=()=>{
      let picture,values;
      if(instance.component==='sum-cdf-slices'){picture=sumDrawing(state.threshold,state.slice);values=sumReadout(state.threshold,state.slice);}
      if(instance.component==='gaussian-direction'){picture=directionDrawing(points,state.shell,state.angle,state.point);values=directionReadout(points,state.shell,state.angle,state.point);}
      if(instance.component==='conditional-groups'){picture=groupsDrawing(state.mode);values=groupsReadout(state.mode)+groupsTable(state.mode);}
      if(instance.component==='regression-loss'){picture=regressionDrawing(state.group,state.prediction);values=regressionReadout(state.group,state.prediction);}
      drawing.innerHTML=picture;readout.innerHTML=values;
    };
    const sync=()=>{inputs.forEach(input=>{input.value=state[input.dataset.l5Key];input.removeAttribute('aria-invalid');});buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===String(state[b.dataset.l5Choice]))));error.textContent='';};
    for(const input of inputs)input.addEventListener('input',()=>{
      const key=input.dataset.l5Key,value=Number(input.value),bounds=s[key];
      if(input.value.trim()===''||!Number.isFinite(value)||value<bounds.min||value>bounds.max){input.setAttribute('aria-invalid','true');error.textContent=`Enter a number from ${bounds.min} to ${bounds.max}. The figure keeps the last valid value.`;return;}
      state[key]=value;sync();render();
    });
    for(const b of buttons)b.addEventListener('click',()=>{state[b.dataset.l5Choice]=b.dataset.l5Choice==='group'?Number(b.dataset.value):b.dataset.value;sync();render();});
    card.querySelector('[data-l5-reset]').addEventListener('click',()=>{state={...initial};card.querySelectorAll('.l5-extra').forEach(d=>d.open=false);sync();render();});
    card.querySelector('[data-l5-next]')?.addEventListener('click',()=>{state.point=(state.point+1)%points.length;render();});
    drawing.addEventListener('click',event=>{const p=event.target.closest('[data-l5-point]');if(p){state.point=Number(p.dataset.l5Point);render();}});
    card.querySelector('[data-l5-best]')?.addEventListener('click',()=>{state.prediction=state.group;sync();render();});
    render();card.dataset.mounted='true';
  }
}
