// Source fragments arrive before MathJax typesetting, so previews never clone
// rendered equations or their IDs. Native popovers degrade to inline panels.
let activeRecall = null;
export function createReadingAid({id, title, priority, content, href, presentation='popover',kind='recall'}) {
  if(!['recall','explanation'].includes(kind))throw new Error('Unknown reading-aid purpose');
  const explanation=kind==='explanation',label=explanation?'Quick Explanation':'Quick Recall';
  const wrapper=document.createElement('div');wrapper.className='quick-recall';
  if(explanation)wrapper.classList.add('quick-explanation');
  wrapper.dataset.helpPurpose=explanation?'new-term':'recall';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='recall-trigger';
  trigger.textContent=`${label}: ${title}`;trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',`${id}-panel`);
  const panel=document.createElement('div');panel.id=`${id}-panel`;panel.className='recall-panel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby',`${id}-heading`);
  const heading=document.createElement('h4');heading.id=`${id}-heading`;heading.textContent=title;
  const tier=document.createElement('p');tier.className='recall-tier';tier.textContent=`${priority} priority`;
  const text=document.createElement('div');text.className='preview-body';text.append(content);
  const footer=document.createElement('div');footer.className='recall-actions';
  const link=document.createElement('a');link.href=href;link.textContent=explanation?'Full explanation':'Full statement';
  const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='action-button';closeButton.textContent=explanation?'Close explanation':'Close reminder';
  footer.append(link,closeButton);panel.append(heading,tier,text,footer);wrapper.append(trigger,panel);
  const compact=matchMedia('(max-width: 600px)');let floating=false,opened=false;
  function reflect(value){opened=value;trigger.setAttribute('aria-expanded',String(value));if(!value&&activeRecall===close)activeRecall=null;}
  function close(focus=false){
    if(!opened)return;
    if(floating){if(panel.matches(':popover-open'))panel.hidePopover();}else panel.hidden=true;
    reflect(false);if(focus)trigger.focus();
  }
  function position(){
    if(!floating||!opened)return;
    const box=trigger.getBoundingClientRect(),padding=12;
    const width=panel.offsetWidth,height=panel.offsetHeight;
    panel.style.left=`${Math.max(padding,Math.min(box.left,innerWidth-width-padding))}px`;
    panel.style.top=`${Math.max(padding,Math.min(box.bottom+8,innerHeight-height-padding))}px`;
  }
  function configure(){
    close();floating=presentation==='popover'&&!compact.matches&&typeof panel.showPopover==='function';
    panel.classList.toggle('recall-floating',floating);
    panel.hidden=!floating;
    if(floating)panel.setAttribute('popover','auto');else panel.removeAttribute('popover');
    if(!floating){panel.style.left='';panel.style.top='';}
  }
  trigger.addEventListener('click',()=>{
    if(opened){close();return;}
    activeRecall?.();activeRecall=close;reflect(true);
    if(floating)panel.showPopover();else panel.hidden=false;
    position();
  });
  panel.addEventListener('toggle',()=>{if(floating)reflect(panel.matches(':popover-open'));});
  closeButton.addEventListener('click',()=>close(true));
  link.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&opened){event.preventDefault();close(true);}
  },true);
  // Native light dismissal covers desktop; inline mode needs its own handler.
  document.addEventListener('click',event=>{if(opened&&!floating&&!wrapper.contains(event.target))close();});
  document.addEventListener('stat709:reading-change',()=>close());
  document.addEventListener('toggle',event=>{
    if(event.target instanceof HTMLDetailsElement&&!event.target.open&&event.target.contains(wrapper))close();
  },true);
  window.addEventListener('beforeprint',()=>close());
  window.addEventListener('hashchange',()=>close());
  window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});
  if(typeof ResizeObserver==='function')new ResizeObserver(position).observe(panel);
  compact.addEventListener('change',configure);configure();
  return {wrapper,panel};
}

export function createRecall(options) { return createReadingAid({...options,kind:'recall'}); }
export function createExplanation(options) { return createReadingAid({...options,kind:'explanation'}); }
