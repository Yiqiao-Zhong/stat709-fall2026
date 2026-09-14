import {createRecall,createExplanation} from '../primitives/recall.js';

export function mountLecture3() {
  const recalls=JSON.parse(document.getElementById('lecture-components').textContent).instances;
  const explanations=JSON.parse(document.getElementById('lecture-explanations').textContent).requests;
  const rows=[...recalls.filter(i=>i.selection==='selected').map(i=>({id:i.instanceId,priority:i.source.priority,kind:'recall',presentation:i.settings.presentation})),
    ...explanations.map(i=>({id:i.instanceId+'-control',priority:i.source.priority,kind:'explanation',presentation:i.presentation}))];
  for(const r of rows) {
    const slot=document.getElementById(r.id),template=document.getElementById(r.id+'-excerpt');
    if(!slot||!template)throw new Error(`Missing Lecture 3 reading aid ${r.id}`);
    const create=r.kind==='recall'?createRecall:createExplanation;
    const {wrapper,panel}=create({id:r.id,title:slot.dataset.title,priority:r.priority,
      content:template.content.cloneNode(true),href:'#'+slot.dataset.target,presentation:r.presentation});
    const trigger=wrapper.querySelector('.recall-trigger');trigger.textContent=slot.dataset.title;
    trigger.setAttribute('aria-label',`${r.kind==='recall'?'Quick Recall':'Quick Explanation'}: ${slot.dataset.title}`);
    slot.append(wrapper);slot.querySelector('.term-source-link').hidden=true;slot.dataset.mounted='true';
    window.MathJax?.startup?.promise?.then(()=>window.MathJax.typesetPromise?.([panel])).catch(console.error);
  }
}
