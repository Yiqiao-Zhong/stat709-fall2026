import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {drawingFor,readoutFor,settingFor} from './lecture8-views.mjs';
export function mountLecture8(){
 mountSourceReadingAids();
 const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
 for(const i of instances.filter(i=>i.selection==='selected'&&i.component!=='reference-preview')){
  const card=document.getElementById(i.instanceId),c=i.component,s=i.settings[settingFor[c]],inputs=[...card.querySelectorAll('[data-l8-input]')],error=card.querySelector('.l8-error');let value=s.value;
  const render=()=>{card.querySelector('[data-l8-drawing]').innerHTML=drawingFor[c](value);card.querySelector('[data-l8-readout]').innerHTML=readoutFor[c](value);card.dataset.value=String(value);};
  const sync=()=>{for(const el of inputs){el.value=value;el.removeAttribute('aria-invalid');}error.textContent='';};
  for(const input of inputs)input.addEventListener('input',()=>{const v=Number(input.value);if(!input.value.trim()||!Number.isFinite(v)||v<s.min||v>s.max||(c!=='gaussian-likelihood'&&!Number.isInteger(v))){input.setAttribute('aria-invalid','true');error.textContent=`Enter ${c==='gaussian-likelihood'?'a value':'a whole number'} from ${s.min} to ${s.max}. The figure keeps its last valid value.`;return;}value=v;sync();render();});
  card.querySelector('[data-l8-reset]').addEventListener('click',()=>{value=s.value;sync();render();});render();card.dataset.mounted='true';
 }
}
