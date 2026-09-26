import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {paretoDrawing,paretoReadout} from './lecture9-views.mjs';
export function mountLecture9(){
 mountSourceReadingAids();
 const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
 for(const i of instances.filter(i=>i.selection==='selected'&&i.component==='pareto-moment-area')){
  const card=document.getElementById(i.instanceId),inputs=[...card.querySelectorAll('[data-l9-key]')],error=card.querySelector('.l9-error');
  let state={alpha:i.settings.alpha.value,logCutoff:i.settings.logCutoff.value};
  const render=()=>{card.querySelector('[data-l9-drawing]').innerHTML=paretoDrawing(state.alpha,state.logCutoff);card.querySelector('[data-l9-readout]').innerHTML=paretoReadout(state.alpha,state.logCutoff);card.dataset.alpha=state.alpha;card.dataset.logCutoff=state.logCutoff;};
  const sync=()=>{for(const input of inputs){input.value=state[input.dataset.l9Key];input.removeAttribute('aria-invalid');}error.textContent='';};
  for(const input of inputs)input.addEventListener('input',()=>{const key=input.dataset.l9Key,v=Number(input.value),s=i.settings[key];if(!input.value.trim()||!Number.isFinite(v)||v<s.min||v>s.max){input.setAttribute('aria-invalid','true');error.textContent=`Enter a value from ${s.min} to ${s.max}. The figure keeps its last valid values.`;return;}state[key]=v;sync();render();});
  card.querySelector('[data-l9-reset]').addEventListener('click',()=>{state={alpha:i.settings.alpha.value,logCutoff:i.settings.logCutoff.value};sync();render();});
  render();card.dataset.mounted='true';
 }
}
