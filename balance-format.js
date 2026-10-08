// Purpose: Persist and format the balance and explain the amount in English.
// Public API: window.OrbitBalance.parse. Dependencies: balance DOM and currency buttons.
(() => {
 'use strict';
 const input=document.getElementById('balance-before');
 function parse(text){
  const value=text.trim();
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(value))return NaN;
  const n=Number(value.replaceAll(',',''));
  return Number.isFinite(n)&&n<=999999999999999?n:NaN;
 }
 window.OrbitBalance={parse};
 const storageKey='orbit.balanceBefore';
 const storageNote=document.createElement('p');
 storageNote.className='help';storageNote.setAttribute('role','status');
 input.closest('.input').after(storageNote);
 try{
  const saved=localStorage.getItem(storageKey);
  if(saved!==null&&Number.isFinite(parse(saved))){
   const [whole,fraction]=saved.replaceAll(',','').split('.');
   input.value=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction!==undefined?'.'+fraction:'');
  }
  storageNote.textContent='Balance is remembered on this device.';
 }catch{storageNote.textContent='Balance saving unavailable.';}
 input.addEventListener('input',()=>{
  try{
   if(input.value.trim()===''){
    localStorage.removeItem(storageKey);
    storageNote.textContent='Saved balance cleared.';
   }else if(Number.isFinite(parse(input.value))){
    localStorage.setItem(storageKey,input.value.replaceAll(',',''));
    storageNote.textContent='Balance saved on this device.';
   }else{
    storageNote.textContent='Invalid amount not saved. The previous saved balance is retained.';
   }
  }catch{storageNote.textContent='Could not save balance. The previous saved value may return on reload.';}
 });
 const description=document.createElement('p');
 description.id='balance-readable';description.className='amount-description';
 input.closest('.input').after(description);
 input.setAttribute('aria-describedby',input.getAttribute('aria-describedby')+' balance-readable');
 const small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
 function words(n){
  if(n<20)return small[n];
  if(n<100)return tens[Math.floor(n/10)]+(n%10?'-'+small[n%10]:'');
  if(n<1000)return small[Math.floor(n/100)]+' hundred'+(n%100?' '+words(n%100):'');
  for(const [size,name] of [[1e12,'trillion'],[1e9,'billion'],[1e6,'million'],[1e3,'thousand']]){
   if(n>=size)return words(Math.floor(n/size))+' '+name+(n%size?' '+words(n%size):'');
  }
 }
 function describe(){
  const n=parse(input.value);
  if(input.value.trim()===''){description.textContent='';input.setAttribute('aria-invalid','false');return;}
  if(!Number.isFinite(n)||n>999999999999999){description.textContent='Enter a valid amount below 1 quadrillion. Use a dot for decimals.';input.setAttribute('aria-invalid','true');return;}
  input.setAttribute('aria-invalid','false');
  const currency=input.dataset.currency==='EUR'?'EUR':'USD';
  const fraction=input.value.replaceAll(',','').split('.')[1]||'';
  const amountWords=words(Math.floor(n))+(fraction?' point '+[...fraction].map(d=>small[Number(d)]).join(' '):'');
  const name=currency==='EUR'?(n===1?'euro':'euros'):(n===1?'US dollar':'US dollars');
  const parts=input.value.replaceAll(',','').split('.');
  const digits=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+(parts[1]?'.'+parts[1]:'');
  description.textContent=digits+' '+currency+' · '+amountWords[0].toUpperCase()+amountWords.slice(1)+' '+name;
 }
 input.addEventListener('input',describe);
 input.addEventListener('focus',()=>{if(Number.isFinite(parse(input.value)))input.value=input.value.replaceAll(',','');});
 input.addEventListener('blur',()=>{
  if(Number.isFinite(parse(input.value))){
   const [whole,fraction]=input.value.replaceAll(',','').split('.');
   input.value=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction!==undefined?'.'+fraction:'');
  }
  describe();
 });
 document.querySelectorAll('[data-balance-currency]').forEach(button=>button.addEventListener('click',describe));
 describe();
})();