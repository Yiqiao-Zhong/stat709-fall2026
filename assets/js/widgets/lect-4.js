import {mountSourceReadingAids} from '../primitives/reading-aids.js';
import {chordDrawing,chordReadout,chordCoordinates} from './quadratic-chord-view.mjs';
import {mountMarkov} from './markov-tail.js';

export function mountLecture4() {
 mountSourceReadingAids();
 mountMarkov(JSON.parse(document.getElementById('lecture-components').textContent).instances.find(i=>i.component==='markov-tail-rectangle'&&i.selection==='selected'));
 const instance=JSON.parse(document.getElementById('lecture-components').textContent).instances.find(i=>i.component==='convexity-chord'&&i.selection==='selected');
 if(!instance)return;
 const card=document.getElementById(instance.instanceId),settings=instance.settings;
 const state={x:settings.x.value,y:settings.y.value,weight:settings.weight.value};
 const svg=card.querySelector('.chord-live svg'),readout=card.querySelector('[data-chord-readout]'),error=card.querySelector('.chord-error');
 const controls=[...card.querySelectorAll('[data-chord-key]')];
 const render=()=>{
  // Keep the SVG root (and pointer capture/focus) alive while its drawing changes.
  const d=new DOMParser().parseFromString(chordDrawing(state.x,state.y,state.weight),'image/svg+xml').documentElement;
  svg.innerHTML=d.innerHTML;svg.setAttribute('aria-label',d.getAttribute('aria-label'));
  readout.innerHTML=chordReadout(state.x,state.y,state.weight);
 };
 const sync=()=>controls.forEach(input=>{input.value=state[input.dataset.chordKey];input.removeAttribute('aria-invalid');});
 controls.forEach(input=>input.addEventListener('input',()=>{
  const key=input.dataset.chordKey,n=Number(input.value),bounds=settings[key];
  if(input.value.trim()===''||!Number.isFinite(n)||n<bounds.min||n>bounds.max){
   input.setAttribute('aria-invalid','true');error.textContent=`Enter a number from ${bounds.min} to ${bounds.max}. The graph keeps the last valid value.`;return;
  }
  state[key]=n;controls.filter(other=>other!==input&&other.dataset.chordKey===key).forEach(other=>{other.value=n;other.removeAttribute('aria-invalid');});
  input.removeAttribute('aria-invalid');error.textContent='';render();
 }));
 card.querySelector('[data-chord-reset]').addEventListener('click',()=>{for(const key of Object.keys(state))state[key]=settings[key].value;sync();error.textContent='';render();});
 let dragging=null;
 const move=event=>{
  if(!dragging)return;
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()),c=chordCoordinates;
  const v=c.xMin+(point.x-c.left)*(c.xMax-c.xMin)/(c.right-c.left),bounds=settings[dragging];
  state[dragging]=Math.min(bounds.max,Math.max(bounds.min,v));sync();error.textContent='';render();
 };
 svg.addEventListener('pointerdown',event=>{const key=event.target.closest('[data-chord-endpoint]')?.dataset.chordEndpoint;if(!key)return;dragging=key;readout.setAttribute('aria-live','off');svg.setPointerCapture(event.pointerId);event.preventDefault();move(event);});
 svg.addEventListener('pointermove',move);
 const release=event=>{dragging=null;readout.setAttribute('aria-live','polite');render();if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);};
 svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',()=>{dragging=null;});
 card.dataset.mounted='true';
}
