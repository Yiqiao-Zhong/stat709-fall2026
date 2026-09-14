import { validateDiscussion, discussionMode } from './primitives/discussion-config.mjs';

export function mountDiscussion() {
  const data=document.getElementById('discussion-config'),section=document.getElementById('discussion');
  if(!data||!section)return;
  const config=validateDiscussion(JSON.parse(data.textContent));
  const status=section.querySelector('[data-discussion-status]'),controls=section.querySelector('[data-discussion-controls]');
  const mode=discussionMode(config,location.href);section.dataset.discussionMode=mode;
  if(mode==='pending')return;
  const forum=document.createElement('a');forum.href=`https://${config.shortname}.disqus.com/`;forum.textContent='Open discussion forum';
  forum.rel='noopener noreferrer';
  if(mode==='preview'){
    status.textContent='Discussion is available with the published lecture. The offline lecture does not load comments.';
    const link=document.createElement('a');link.href=`${config.pageUrl}#discussion`;link.textContent='Discussion on the published lecture';controls.append(link);return;
  }
  status.textContent='Public comments are hosted by Disqus. Sign in through Disqus or a supported social account. Load the discussion to connect to Disqus.';
  const button=document.createElement('button');button.type='button';button.className='action-button';button.textContent='Load discussion';
  controls.append(button,document.createTextNode(' · '),forum);
  let requested=false;
  button.addEventListener('click',()=>{
    if(requested)return;requested=true;button.disabled=true;button.textContent='Loading discussion…';
    status.textContent='Connecting to Disqus…';
    const thread=document.createElement('div');thread.id='disqus_thread';section.append(thread);
    let timedOut=false;
    const timer=window.setTimeout(()=>{
      timedOut=true;status.textContent='Disqus is taking longer than expected or has been blocked. You can open the discussion forum or reload the lecture to try again.';
    },15000);
    window.disqus_config=function(){
      this.page.url=config.pageUrl;
      this.page.identifier=config.identifier;
      this.page.title=config.title;
      this.callbacks=this.callbacks||{};
      this.callbacks.onReady=[()=>{
        window.clearTimeout(timer);button.hidden=true;
        status.textContent='Public discussion · Disqus';section.dataset.discussionState='ready';
      }];
    };
    const script=document.createElement('script');script.src=`https://${config.shortname}.disqus.com/embed.js`;script.async=true;
    script.dataset.timestamp=String(Date.now());section.dataset.discussionState='requested';
    script.onerror=()=>{
      window.clearTimeout(timer);status.textContent='Disqus could not load. Check your connection or open the discussion forum.';
      section.dataset.discussionState='error';button.disabled=false;button.textContent='Retry loading discussion';
      script.remove();thread.remove();requested=false;
    };
    script.onload=()=>{if(!timedOut&&section.dataset.discussionState!=='ready')status.textContent='Disqus is loading the discussion. If it does not appear, open the discussion forum.';};
    document.head.append(script);
  });
}
