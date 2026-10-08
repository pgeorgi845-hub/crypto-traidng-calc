// Purpose: Persist the ByBit safety multiplier and synchronize its output label.
// Public API: None. Key dependencies: DOM IDs in index.html, optional localStorage.
(() => {
 'use strict';
 const input=document.getElementById('safety-factor');
 const note=document.getElementById('safety-note');
 const label=document.getElementById('bybit-cost-r-label');
 const key='orbit.bybitSafetyFactor';
 const valid=value=>value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>0;
 function updateLabel(){
  label.textContent=valid(input.value)?`ByBit Cost in R (${input.value}x)`:'ByBit Cost in R';
 }
 try{
  const saved=localStorage.getItem(key);
  if(saved!==null&&valid(saved)) input.value=saved;
 }catch{
  note.textContent='Saving unavailable. You can still change the factor.';
 }
 input.addEventListener('input',()=>{
  const invalid=input.validity.badInput||(input.value!==''&&!valid(input.value));
  input.setAttribute('aria-invalid',String(invalid));
  updateLabel();
  if(invalid){note.textContent='Enter a factor greater than 0.';return;}
  try{
   if(input.value==='') localStorage.removeItem(key);
   else localStorage.setItem(key,input.value);
   note.textContent=input.value===''?'Default 2x will return on reload.':'Saved on this device.';
  }catch{
   note.textContent='Saving unavailable. You can still change the factor.';
  }
 });
 updateLabel();
})();