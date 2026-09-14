import { inverseImage, inverseImageReadout, inverseImageDrawing } from './inverse-image-model.mjs';
import { createRecall } from '../primitives/recall.js';

export function mountLecture2() {
  const config=JSON.parse(document.getElementById('lecture-components').textContent);
  for (const instance of config.instances.filter(i=>i.selection==='selected'&&i.component==='reference-preview')) {
    const slot=document.getElementById(instance.instanceId), template=document.getElementById(`${instance.instanceId}-excerpt`);
    if(!slot||!template)throw new Error(`Missing term help ${instance.instanceId}`);
    const {wrapper,panel}=createRecall({id:instance.instanceId,title:slot.dataset.title,
      priority:instance.source.priority,content:template.content.cloneNode(true),href:`#${slot.dataset.target}`,
      presentation:instance.settings.presentation});
    const trigger=wrapper.querySelector('.recall-trigger');
    trigger.textContent=slot.dataset.title;
    trigger.setAttribute('aria-label',`Quick Recall: ${slot.dataset.title}`);
    // Keep the ordinary definition link until a functioning control exists.
    slot.querySelector('.term-source-link').hidden=true;
    slot.append(wrapper);slot.dataset.mounted='true';
    const ready=window.MathJax?.startup?.promise;
    if(ready)ready.then(()=>window.MathJax.typesetPromise?.([panel])).catch(console.error);
  }
  for (const instance of config.instances.filter(i=>i.selection==='selected'&&i.component==='finite-inverse-image')) {
    const card=document.getElementById(instance.instanceId);
    if(!card)throw new Error(`Missing inverse-image mount ${instance.instanceId}`);
    const settings=instance.settings;
    let state=inverseImage(settings,settings.initial.lower,settings.initial.upper);
    const drawing=card.querySelector('[data-inverse-drawing]'),readout=card.querySelector('[data-inverse-readout]'),error=card.querySelector('[data-inverse-error]');
    const inputs=[...card.querySelectorAll('input')];
    const sync=()=>{
      for(const input of inputs){input.value=String(state[input.dataset.endpoint]);input.removeAttribute('aria-invalid');}
      drawing.innerHTML=inverseImageDrawing(settings,state);readout.textContent=inverseImageReadout(state);
      card.dataset.lower=state.lower;card.dataset.upper=state.upper;card.dataset.probability=state.probability;
      error.textContent='';
    };
    for (const input of inputs) input.addEventListener('input',()=>{
      const value=input.value.trim()===''?NaN:Number(input.value);
      try {
        const candidate={...state,[input.dataset.endpoint]:value};
        state=inverseImage(settings,candidate.lower,candidate.upper);sync();
      } catch (e) {input.setAttribute('aria-invalid','true');error.textContent=e.message;}
    });
    card.querySelector('[data-inverse-reset]').addEventListener('click',()=>{state=inverseImage(settings,settings.initial.lower,settings.initial.upper);sync();});
    sync();card.dataset.mounted='true';
  }
}
