// Purpose: Opt-in local persistence for Entry, 50% SL and Exit.
// Public API: None. Key dependencies: index.html controls, localStorage, input events.
(() => {
 'use strict';
 const key='orbit.priceMemory';
 const ids=['entry','sl','exit'];
 const fields=ids.map(id=>document.getElementById(id));
 const button=document.getElementById('remember-prices');
 const note=document.getElementById('remember-prices-note');
 let enabled=false;
 const clean=value=>typeof value==='string'&&(value===''||(value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>0));
 function status(){
  button.setAttribute('aria-pressed',String(enabled));
  button.textContent='Remember prices: '+(enabled?'On':'Off');
  note.textContent=enabled?'Entry, 50% SL and Exit are saved on this device.':'Entry, 50% SL and Exit clear on reload.';
 }
 function save(){
  const prices=Object.fromEntries(fields.map((field,i)=>[ids[i],clean(field.value)?field.value:'']));
  // One atomic write removes stored prices when switching off.
  localStorage.setItem(key,JSON.stringify(enabled?{enabled:true,prices}:{enabled:false}));
 }
 function restore(){
  let state=null;
  let unavailable=false;
  try{state=JSON.parse(localStorage.getItem(key));}catch{unavailable=true;}
  enabled=state?.enabled===true;
  fields.forEach((field,i)=>{
   const value=state?.prices?.[ids[i]];
   field.value=enabled&&clean(value)?value:'';
   field.dispatchEvent(new Event('input',{bubbles:true}));
  });
  status();
  if(unavailable) note.textContent='Saved prices unavailable. Prices have not been restored.';
 }
 restore();
 button.addEventListener('click',()=>{
  enabled=!enabled;
  try{save();status();}catch{
   enabled=!enabled;
   status();
   note.textContent='Could not save this change. The previous saved setting may still apply on reload.';
  }
 });
 fields.forEach(field=>field.addEventListener('input',()=>{
  if(!enabled)return;
  try{save();status();}catch{note.textContent='Could not save these prices. Older saved prices may return on reload.';}
 }));
 // Clear any browser-restored values on normal reload when memory is off.
 window.addEventListener('pageshow',event=>{
  if(!event.persisted&&!enabled){
   fields.forEach(field=>{field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));});
  }
 });
})();