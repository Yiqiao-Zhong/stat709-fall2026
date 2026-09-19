import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {maximaBank,sampleSizes,advancedSeed} from './lecture6-models.mjs';
import {normalDrawing,normalReadout,riskDrawing,riskReadout,sufficiencyDrawing,sufficiencyReadout} from './lecture6-views.mjs';
export function mountLecture6(){
 mountSourceReadingAids();
 const instances=JSON.parse(document.getElementById('lecture-components').textContent).instances;
 for(const i of instances.filter(i=>i.selection==='selected'&&i.component!=='reference-preview')){
  const card=document.getElementById(i.instanceId),s=i.settings;
  let state={n:100,seed:709,mu:.5,p:.5,count:2},bank=i.component==='normal-sample-maxima'?JSON.parse(document.getElementById('lecture6-maxima-bank').textContent):null;
  const drawing=card.querySelector('[data-l6-drawing]'),readout=card.querySelector('[data-l6-readout]'),error=card.querySelector('.l6-error'),inputs=[...card.querySelectorAll('[data-l6-key]')];
  const render=()=>{
   if(bank){drawing.innerHTML=normalDrawing(bank,state.n);readout.innerHTML=normalReadout(bank,state.n,state.seed);}
   else if(i.component==='normal-risk-comparison'){drawing.innerHTML=riskDrawing(state.mu);readout.innerHTML=riskReadout(state.mu);}
   else{drawing.innerHTML=sufficiencyDrawing(state.p,state.count);readout.innerHTML=sufficiencyReadout(state.p,state.count);}
   card.dataset.seed=String(state.seed);card.dataset.n=String(state.n);
  };
  const sync=()=>{inputs.forEach(input=>{input.value=input.dataset.l6Key==='sizeIndex'?sampleSizes.indexOf(state.n):state[input.dataset.l6Key];input.removeAttribute('aria-invalid');if(input.dataset.l6Key==='sizeIndex')input.setAttribute('aria-valuetext',`${state.n} observations`);});error.textContent='';};
  for(const input of inputs)input.addEventListener('input',()=>{
   const key=input.dataset.l6Key,v=Number(input.value),valid=key==='n'?sampleSizes.includes(v):key==='sizeIndex'?Number.isInteger(v)&&v>=0&&v<13:Number.isFinite(v)&&v>=s[key].min&&v<=s[key].max&&(key!=='count'||Number.isInteger(v));
   if(!input.value.trim()||!valid){input.setAttribute('aria-invalid','true');error.textContent=key==='count'?'Choose a whole count from 0 to 4. The figure keeps the last valid value.':`Choose a valid ${key} within the displayed range. The figure keeps the last valid value.`;return;}
   if(key==='sizeIndex')state.n=sampleSizes[v];else state[key]=v;
   sync();render();
  });
  card.querySelector('[data-l6-new]')?.addEventListener('click',()=>{state.seed=advancedSeed(state.seed);bank=maximaBank(state.seed);render();});
  card.querySelector('[data-l6-reset]').addEventListener('click',()=>{state={n:100,seed:709,mu:.5,p:.5,count:2};if(bank)bank=JSON.parse(document.getElementById('lecture6-maxima-bank').textContent);sync();render();});
  render();card.dataset.mounted='true';
 }
}
