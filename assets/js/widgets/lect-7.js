import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {ridgeDrawing,ridgeReadout,knnDrawing,knnReadout} from './lecture7-views.mjs';
export function mountLecture7(){
 mountSourceReadingAids();
 const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
 for(const i of instances.filter(i=>i.selection==='selected'&&i.component!=='reference-preview')){
  const card=document.getElementById(i.instanceId),ridge=i.component==='ridge-orthogonal',s=i.settings[ridge?'lambda':'k'],inputs=[...card.querySelectorAll('[data-l7-input]')],error=card.querySelector('.l7-error');let value=s.value;
  const render=()=>{card.querySelector('[data-l7-drawing]').innerHTML=(ridge?ridgeDrawing:knnDrawing)(value);card.querySelector('[data-l7-readout]').innerHTML=(ridge?ridgeReadout:knnReadout)(value);card.dataset.value=String(value);};
  const sync=()=>{for(const el of inputs){el.value=value;el.removeAttribute('aria-invalid');}error.textContent='';};
  for(const input of inputs)input.addEventListener('input',()=>{const v=Number(input.value);if(!input.value.trim()||!Number.isFinite(v)||v<s.min||v>s.max||(!ridge&&!Number.isInteger(v))){input.setAttribute('aria-invalid','true');error.textContent=ridge?'Enter a penalty from 0 to 4. The figure keeps its last valid value.':'Enter a whole K from 1 to 21. The figure keeps its last valid value.';return;}value=v;sync();render();});
  card.querySelector('[data-l7-reset]').addEventListener('click',()=>{value=s.value;sync();render();});render();card.dataset.mounted='true';
 }
}
