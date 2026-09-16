import {markovDrawing,markovReadout} from './markov-tail-view.mjs';

export function mountMarkov(instance) {
 if(!instance)return;
 const card=document.getElementById(instance.instanceId);
 if(!card||card.dataset.mounted==='true')return;
 const settings=instance.settings.threshold,controls=[...card.querySelectorAll('[data-markov-threshold]')];
 const svg=card.querySelector('.markov-live svg'),readout=card.querySelector('[data-markov-readout]'),error=card.querySelector('.markov-error');
 let a=settings.value;
 const render=()=>{
  const drawing=new DOMParser().parseFromString(markovDrawing(a),'image/svg+xml').documentElement;
  svg.innerHTML=drawing.innerHTML;svg.setAttribute('aria-label',drawing.getAttribute('aria-label'));
  readout.innerHTML=markovReadout(a);
 };
 const clear=()=>{error.textContent='';controls.forEach(c=>c.removeAttribute('aria-invalid'));};
 for(const input of controls)input.addEventListener('input',()=>{
  const value=Number(input.value);
  if(input.value.trim()===''||!Number.isFinite(value)||value<settings.min||value>settings.max){
   input.setAttribute('aria-invalid','true');error.textContent=`Enter a number from ${settings.min} to ${settings.max}. The picture keeps the last valid value.`;return;
  }
  a=value;controls.filter(c=>c!==input).forEach(c=>c.value=a);clear();render();
 });
 card.querySelector('[data-markov-reset]').addEventListener('click',()=>{a=settings.value;controls.forEach(c=>c.value=a);clear();render();});
 card.dataset.mounted='true';
}
