// Purpose: Select and remember the balance currency without converting its amount.
// Public API: balance-before.dataset.currency. Key dependencies: index.html controls, optional localStorage.
(() => {
 'use strict';
 const balance=document.getElementById('balance-before');
 const unit=document.getElementById('balance-currency-unit');
 const note=document.getElementById('balance-currency-note');
 const buttons=document.querySelectorAll('[data-balance-currency]');
 const key='orbit.balanceCurrency';
 const explanation='Switching currency does not convert the amount. Entry, 50% SL and Exit remain in USD.';
 function selectCurrency(currency){
  balance.dataset.currency=currency;
  unit.textContent=currency;
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.balanceCurrency===currency)));
 }
 let initial='USD';
 try{
  const saved=localStorage.getItem(key);
  if(saved==='EUR'||saved==='USD')initial=saved;
  note.textContent='Currency choice is remembered on this device. '+explanation;
 }catch{
  note.textContent='Currency saving unavailable. '+explanation;
 }
 selectCurrency(initial);
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const currency=button.dataset.balanceCurrency;
  selectCurrency(currency);
  try{
   localStorage.setItem(key,currency);
   note.textContent='Currency choice saved on this device. '+explanation;
  }catch{
   note.textContent='Currency changed for this session but could not be saved. '+explanation;
  }
 }));
})();