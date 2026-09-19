import { mountDiscussion } from './discussion.js';
import { mountLectureWidgets, addLectureCrossLinks } from './widgets/lect-1.js';
import { mountLecturePilot } from './widgets/lecture1-pilot.js';
import { mountLecture2 } from './widgets/lect-2.js';
import { mountLecture4 } from './widgets/lect-4.js';
import { mountLecture3 } from './widgets/lect-3.js';
import { mountLecture5 } from './widgets/lect-5.js';

const body = document.body;
let practiceMode = 'exam';
const readingBlocks = () => [...document.querySelectorAll('.priority-block[data-priority]')].filter(block => !block.closest('.exercises-shell'));
const practiceBlocks = () => [...document.querySelectorAll('.exercises-shell .priority-block[data-priority]')];

function setPriorityMode(mode) {
  document.dispatchEvent(new Event('stat709:reading-change'));
  body.dataset.priorityView = mode;
  const descriptions = {
    core: 'High reading only. High and mid material are both examined; practice selection is independent.',
    supporting: 'High and mid reading are visible; both are in examination scope. Optional summaries remain available.',
    all: 'Optional reading is expanded. Practice selection and solution choices are preserved.',
  };
  document.getElementById('priority-description').textContent = descriptions[mode];
  document.querySelectorAll('[data-priority-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.priorityMode===mode)));
  readingBlocks().forEach(block => {
    block.classList.toggle('reading-hidden',mode==='core' && block.dataset.priority!=='high');
    if(block.tagName==='DETAILS') block.open=mode==='all';
  });
}

function setExerciseMode(mode) {
  practiceMode=mode;
  const visible = priority => mode==='all' || (mode==='exam' && priority!=='low') || priority==='high';
  document.querySelectorAll('[data-exercise-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exerciseMode===mode)));
  practiceBlocks().forEach(block=>block.classList.toggle('exercise-priority-hidden',!visible(block.dataset.priority)));
  const rows=[...document.querySelectorAll('[data-practice-priority]')];
  rows.forEach(row=>row.hidden=!visible(row.dataset.practicePriority));
  document.getElementById('practice-count').textContent=`${rows.filter(row=>!row.hidden).length} exercises in ${mode} practice`;
}

function openHashTarget() {
  if(!location.hash) return;
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);
  if(!target) return;
  const priority=target.closest('.priority-block');
  if(target.closest('.exercises-shell')) {
    if(priority?.dataset.priority==='low' && practiceMode!=='all') setExerciseMode('all');
    else if(priority?.dataset.priority==='mid' && practiceMode==='core') setExerciseMode('exam');
  } else if(priority && priority.dataset.priority!=='high' && body.dataset.priorityView==='core') setPriorityMode('supporting');
  let node=target;
  while(node) {if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}
  document.getElementById('navigation-status').textContent='Linked content is visible; other solution choices are preserved.';
  requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}

function setupSidebar() {
  const panel=document.querySelector('.learning-panel');
  const compact=window.matchMedia('(max-width: 1120px)');
  panel.open=!compact.matches;
  compact.addEventListener?.('change',event=>{panel.open=!event.matches;});
  if('IntersectionObserver' in window) {
    const navigation=document.getElementById('section-navigation');
    const links=new Map([...navigation.querySelectorAll('a')].map(link=>[link.hash.slice(1),link]));
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(!visible)return;
      links.forEach((link,id)=>{if(id===visible.target.id)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
    },{rootMargin:'-15% 0px -70% 0px'});
    document.querySelectorAll('.lecture-content > h2').forEach(heading=>observer.observe(heading));
  }
}

function setupPrint() {
  let state=null;
  window.addEventListener('beforeprint',()=>{
    if(state)return;
    state={details:[...document.querySelectorAll('details')].map(node=>[node,node.open]),hidden:[...document.querySelectorAll('[hidden]')].map(node=>node)};
    document.body.classList.add('printing');
    state.details.forEach(([node])=>{node.open=true;});
    // Hidden tab panels are interactive only and omitted from print. Keep them
    // hidden; the complete canonical source and static worked examples print.
  });
  window.addEventListener('afterprint',()=>{
    if(!state)return;
    state.details.forEach(([node,open])=>{node.open=open;});
    document.body.classList.remove('printing');state=null;
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.classList.add('js-enabled');
  const status=document.createElement('p');status.id='navigation-status';status.className='sr-only';status.setAttribute('role','status');body.append(status);
  setupSidebar();
  document.querySelectorAll('[data-priority-mode]').forEach(button=>button.addEventListener('click',()=>setPriorityMode(button.dataset.priorityMode)));
  document.querySelectorAll('[data-exercise-mode]').forEach(button=>button.addEventListener('click',()=>setExerciseMode(button.dataset.exerciseMode)));
  document.querySelector('[data-reveal-solutions]').addEventListener('click',event=>{
    const button=event.currentTarget,opening=button.getAttribute('aria-pressed')!=='true';
    document.querySelectorAll('.exercises-shell details.solution').forEach(solution=>{solution.open=opening;});
    button.setAttribute('aria-pressed',String(opening));button.textContent=opening?'Hide all solutions':'Reveal all solutions';
  });
  if (body.dataset.lecture === '1') { mountLectureWidgets();mountLecturePilot();addLectureCrossLinks(); }
  if (body.dataset.lecture === '2') mountLecture2();
  if (body.dataset.lecture === '3') mountLecture3();
  if (body.dataset.lecture === '4') mountLecture4();
  if (body.dataset.lecture === '5') mountLecture5();
  mountDiscussion();
  setPriorityMode('supporting');setExerciseMode('exam');setupPrint();openHashTarget();
  window.addEventListener('hashchange',openHashTarget);
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(link && link.hash===location.hash)openHashTarget();
  });
});
