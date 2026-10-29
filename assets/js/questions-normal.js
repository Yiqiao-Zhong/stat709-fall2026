// Native disclosures remain usable without scripting.
(() => {
 const navigation=document.getElementById('topic-navigation');
 const narrow=matchMedia('(max-width:950px)');
 const sync=()=>{navigation.open=!narrow.matches;};
 sync();narrow.addEventListener('change',sync);
 function revealTarget(){
  const id=decodeURIComponent(location.hash.slice(1));
  const target=document.getElementById(id);if(!target)return;
  for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
  if(id==='qenormal-summary')document.querySelector('.normal-reference').open=true;
  requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
 }
 addEventListener('hashchange',revealTarget);
 document.addEventListener('stat709:math-ready',()=>{if(location.hash)revealTarget();});
 if(location.hash)revealTarget();
 let beforePrint=[];
 addEventListener('beforeprint',()=>{beforePrint=[...document.querySelectorAll('details')].map(e=>[e,e.open]);for(const[e]of beforePrint)e.open=true;});
 addEventListener('afterprint',()=>{for(const[e,open]of beforePrint)e.open=open;});
})();
