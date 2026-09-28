import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {sumDrawing,sumReadout} from './lecture10-views.mjs';
export function mountLecture10(){
 mountSourceReadingAids();
 const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
 for(const i of instances.filter(i=>i.selection==='selected'&&i.component==='clt-rademacher-sums')){
  const card=document.getElementById(i.instanceId),inputs=[...card.querySelectorAll('[data-l10-n]')],view=card.querySelector('[data-l10-view]'),error=card.querySelector('.l10-error');
  let state={n:i.settings.n.value,view:i.settings.initialView};
  const render=()=>{card.querySelector('[data-l10-drawing]').innerHTML=sumDrawing(state.n,state.view);card.querySelector('[data-l10-readout]').innerHTML=sumReadout(state.n,state.view);card.dataset.n=state.n;card.dataset.view=state.view;};
  const sync=()=>{for(const input of inputs){input.value=state.n;input.removeAttribute('aria-invalid');}view.value=state.view;error.textContent='';};
  for(const input of inputs)input.addEventListener('input',()=>{const n=Number(input.value);if(!input.value.trim()||!Number.isInteger(n)||n<1||n>200){input.setAttribute('aria-invalid','true');error.textContent='Enter a whole number from 1 to 200. The figure keeps its last valid value.';return;}state.n=n;sync();render();});
  view.addEventListener('change',()=>{state.view=view.value;render();});
  card.querySelector('[data-l10-reset]').addEventListener('click',()=>{state={n:i.settings.n.value,view:i.settings.initialView};sync();render();});
  render();card.dataset.mounted='true';
 }
}
