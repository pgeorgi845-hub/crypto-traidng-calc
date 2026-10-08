// Purpose: Persist Trade details expansion and position its sticky header below Direction.
// Public API: None. Key dependencies: trade-input-details DOM element, optional localStorage.
(() => {
 'use strict';
 const menu=document.getElementById('trade-input-details');
 const key='orbit.tradeDetailsOpen';
 const result=document.querySelector('.result');
 function updateHeaderOffset(){
  const height=result?result.getBoundingClientRect().height:0;
  menu.style.setProperty('--result-height',height+'px');
 }
 updateHeaderOffset();
 if(result&&typeof ResizeObserver!=='undefined'){
  const observer=new ResizeObserver(updateHeaderOffset);
  observer.observe(result);
 }else window.addEventListener('resize',updateHeaderOffset);
 const note=document.createElement('p');
 note.className='help';note.hidden=true;note.setAttribute('role','status');
 menu.append(note);
 function unavailable(){note.textContent='Could not remember the menu state on this device.';note.hidden=false;}
 try{menu.open=localStorage.getItem(key)==='true';}catch{unavailable();}
 menu.addEventListener('toggle',event=>{
  if(event.target!==menu)return;
  try{localStorage.setItem(key,String(menu.open));note.hidden=true;}catch{unavailable();}
 });
})();