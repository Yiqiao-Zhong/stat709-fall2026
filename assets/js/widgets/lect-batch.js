import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {presets,drawing,readout} from './batch-views.mjs';
export function mountLectureBatch(){
 mountSourceReadingAids();
 for(const card of document.querySelectorAll('.batch-activity')){const kind=card.dataset.preset,s=presets[kind],input=card.querySelector('input'),output=card.querySelector('output');let state=s.value;
 const render=()=>{input.value=state;output.value=state;card.dataset.value=state;card.querySelector('[data-batch-drawing]').innerHTML=drawing(kind,state);card.querySelector('[data-batch-readout]').innerHTML=readout(kind,state);card.querySelector('.batch-state').textContent=`${s.parameter} = ${state}. Curves and value table updated.`;};
 input.addEventListener('input',()=>{const p=Number(input.value);if(!Number.isFinite(p)||p<s.min||p>s.max)return;state=p;render();});card.querySelector('[data-batch-reset]').addEventListener('click',()=>{state=s.value;render();});render();card.dataset.mounted='true';
 }
}
