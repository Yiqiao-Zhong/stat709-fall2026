import { validateDiscussion, discussionMode } from './primitives/discussion-config.mjs';

export function mountDiscussion() {
  const data=document.getElementById('discussion-config'),section=document.getElementById('discussion');
  if(!data||!section||section.dataset.discussionMounted==='true')return;
  const config=validateDiscussion(JSON.parse(data.textContent));
  section.dataset.discussionMounted='true';
  const status=section.querySelector('[data-discussion-status]'),controls=section.querySelector('[data-discussion-controls]');
  const mode=discussionMode(config,location.href);section.dataset.discussionMode=mode;
  if(mode==='pending')return;
  const forum=document.createElement('a');forum.href=`https://${config.shortname}.disqus.com/`;forum.textContent='Open discussion forum';
  forum.rel='noopener noreferrer';
  if(mode==='preview'){
    status.textContent='Read and join the comments on the published page.';
    const link=document.createElement('a');link.href=`${config.pageUrl}#discussion`;link.textContent='Comments on the published page';controls.append(link);return;
  }
  status.textContent='Public comments are hosted by Disqus. Sign in with Disqus or a supported social account after loading comments.';
  const button=document.createElement('button');button.type='button';button.className='action-button';button.textContent='Load comments';
  controls.append(button,forum);
  let requested=false;
  button.addEventListener('click',()=>{
    if(requested)return;requested=true;button.disabled=true;button.textContent='Loading comments…';
    status.textContent='Connecting to Disqus…';
    const thread=document.createElement('div');thread.id='disqus_thread';section.append(thread);
    let timedOut=false;
    const timer=window.setTimeout(()=>{
      timedOut=true;section.dataset.discussionState='timeout';status.textContent='Comments are taking longer than expected. Open the discussion forum or reload this page to try again.';
    },15000);
    window.disqus_config=function(){
      this.page.url=config.pageUrl;
      this.page.identifier=config.identifier;
      this.page.title=config.title;
      this.callbacks=this.callbacks||{};
      this.callbacks.onReady=[()=>{
        window.clearTimeout(timer);button.hidden=true;
        status.textContent='Public comments · Disqus';section.dataset.discussionState='ready';
      }];
    };
    const script=document.createElement('script');script.src=`https://${config.shortname}.disqus.com/embed.js`;script.async=true;
    script.dataset.timestamp=String(Date.now());section.dataset.discussionState='requested';
    script.onerror=()=>{
      window.clearTimeout(timer);status.textContent='Disqus could not load. Check your connection or open the discussion forum.';
      section.dataset.discussionState='error';button.disabled=false;button.textContent='Retry loading comments';
      script.remove();thread.remove();requested=false;
    };
    script.onload=()=>{if(!timedOut&&section.dataset.discussionState!=='ready')status.textContent='Disqus is loading the discussion. If it does not appear, open the discussion forum.';};
    document.head.append(script);
  });
}
