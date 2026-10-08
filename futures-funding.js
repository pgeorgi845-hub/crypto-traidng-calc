// Purpose: Estimate futures funding from worksheet sizing, leverage and safety factor.
// Public API: leverage input. Dependencies: OrbitBalance.parse, portfolio/risk/price inputs, localStorage.
(() => {
 'use strict';
 const get=id=>document.getElementById(id);
 const card=document.createElement('section');card.className='card';
 card.setAttribute('aria-labelledby','funding-title');
 card.innerHTML=`<div class="heading"><h2 id="funding-title">Futures funding</h2><span class="step">CROSS</span></div>
 <div class="fields">
 <div><label for="exchange-balance">Total on exchange (including futures)</label><div class="input"><input id="exchange-balance" type="number" step="any" inputmode="decimal"><span class="unit" data-funding-unit></span></div></div>
 <div><label for="futures-available">Futures available balance</label><div class="input"><input id="futures-available" type="number" step="any" inputmode="decimal"><span class="unit" data-funding-unit></span></div></div>
 <div><label for="leverage">Leverage</label><div class="input"><input id="leverage" type="number" min="1" step="any" inputmode="decimal" value="100"><span class="unit">x</span></div><p class="help" id="leverage-note">Remembered on this device.</p></div></div>
 <p class="help">Use the selected portfolio currency for both balances. Futures available means free funds after existing positions and orders. Exchange total includes futures; do not add them together.</p>
 <div class="row"><span>Estimated initial margin</span><output id="initial-margin"></output></div>
 <div class="row"><span>Target futures funds (with safety factor)</span><output id="funding-target"></output></div>
 <div class="row"><span>Target / total portfolio</span><output id="funding-percent"></output></div>
 <div class="row"><span>Additional free funds needed</span><output id="funding-shortfall"></output></div>
 <p class="help" id="funding-rule" role="status"></p>
 <p class="help" id="funding-availability"></p>
 <p class="help">Worksheet estimate: position value / leverage × safety factor. Fees are not added separately. Cross liquidation, maintenance margin and other positions are not modeled. Below the limit does not mean safe.</p>`;
 get('trade-details-label').closest('section').after(card);
 const settings=get('trade-input-details').querySelector('.fields');
 for(const id of ['exchange-balance','leverage']){
  settings.append(get(id).closest('.input').parentElement);
 }
 const exchangeInput=get('exchange-balance');
 const exchangeNote=document.createElement('p');exchangeNote.className='help';exchangeNote.setAttribute('role','status');
 exchangeInput.closest('.input').after(exchangeNote);
 const exchangeKey='orbit.exchangeBalance';
 const validExchange=value=>value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0;
 try{
  const saved=localStorage.getItem(exchangeKey);
  if(saved!==null&&validExchange(saved))exchangeInput.value=saved;
  exchangeNote.textContent='Remembered on this device in the selected portfolio currency.';
 }catch{exchangeNote.textContent='Exchange balance saving unavailable.';}
 exchangeInput.addEventListener('input',()=>{
  try{
   if(exchangeInput.value===''&&!exchangeInput.validity.badInput){localStorage.removeItem(exchangeKey);exchangeNote.textContent='Saved exchange balance cleared.';}
   else if(!exchangeInput.validity.badInput&&validExchange(exchangeInput.value)){localStorage.setItem(exchangeKey,exchangeInput.value);exchangeNote.textContent='Exchange balance saved on this device.';}
   else exchangeNote.textContent='Invalid balance not saved; previous saved value retained.';
  }catch{exchangeNote.textContent='Could not save exchange balance.';}
 });
 const futuresInput=get('futures-available');
 const futuresNote=document.createElement('p');futuresNote.className='help';futuresNote.setAttribute('role','status');
 futuresInput.closest('.input').after(futuresNote);
 const futuresKey='orbit.futuresAvailable';
 try{
  const saved=localStorage.getItem(futuresKey);
  if(saved!==null&&validExchange(saved))futuresInput.value=saved;
  futuresNote.textContent='Remembered on this device. Update this balance when your available funds change.';
 }catch{futuresNote.textContent='Futures balance saving unavailable.';}
 futuresInput.addEventListener('input',()=>{
  try{
   if(futuresInput.value===''&&!futuresInput.validity.badInput){localStorage.removeItem(futuresKey);futuresNote.textContent='Saved futures balance cleared.';}
   else if(!futuresInput.validity.badInput&&validExchange(futuresInput.value)){localStorage.setItem(futuresKey,futuresInput.value);futuresNote.textContent='Futures balance saved on this device.';}
   else futuresNote.textContent='Invalid balance not saved; previous saved value retained.';
  }catch{futuresNote.textContent='Could not save futures balance.';}
 });
 const lev=get('leverage'),key='orbit.leverage';
 const valid=value=>value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=1;
 try{const saved=localStorage.getItem(key);if(saved!==null&&valid(saved))lev.value=saved;}catch{get('leverage-note').textContent='Saving unavailable; default 100x.';}
 lev.addEventListener('input',()=>{
  if(!valid(lev.value)){get('leverage-note').textContent='Enter leverage of at least 1x.';return;}
  try{localStorage.setItem(key,lev.value);get('leverage-note').textContent='Saved on this device.';}catch{get('leverage-note').textContent='Could not save leverage.';}
 });
 function number(id,zero=false){const f=get(id),n=f.valueAsNumber;return f.value!==''&&Number.isFinite(n)&&(zero?n>=0:n>0)?n:null;}
 function render(){
  const currency=get('balance-before').dataset.currency==='EUR'?'EUR':'USD';
  document.querySelectorAll('[data-funding-unit]').forEach(unit=>unit.textContent=currency);
  const cash=n=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n);
  const balance=window.OrbitBalance.parse(get('balance-before').value);
  const risk=number('chosen-risk',true),entry=number('entry'),sl=number('sl'),factor=number('safety-factor'),leverage=number('leverage');
  for(const id of ['initial-margin','funding-target','funding-percent','funding-shortfall'])get(id).textContent='';
  get('funding-rule').textContent='Enter portfolio, chosen risk, Entry, 50% SL, leverage and safety factor.';
  get('funding-rule').className='help';get('funding-availability').textContent='';
  if(!Number.isFinite(balance)||balance<=0||risk===null||entry===null||sl===null||entry===sl||factor===null||leverage===null||leverage<1)return;
  // Conversion cancels when notional and portfolio are expressed in the same fiat currency.
  const notional=balance*(risk/100)*entry/Math.abs(entry-sl);
  const margin=notional/leverage,target=margin*factor,percent=target/balance*100;
  if(![margin,target,percent].every(Number.isFinite)){get('funding-rule').textContent='Values exceed the calculation range.';return;}
  get('initial-margin').textContent=cash(margin);get('funding-target').textContent=cash(target);
  get('funding-percent').textContent=percent.toFixed(4)+'%';
  const exceeds=percent>10;
  get('funding-rule').textContent=exceeds?'SKIP TRADE — exceeds your 10% portfolio funding limit.':'Within your 10% portfolio funding limit. This is not a safety assessment.';
  get('funding-rule').className=exceeds?'help negative':'help';
  const available=number('futures-available',true),exchange=number('exchange-balance',true);
  if(available===null){get('funding-availability').textContent='Enter free futures funds to calculate the shortfall.';return;}
  if(exchange!==null&&available>exchange){get('funding-availability').textContent='Futures available cannot exceed the total on exchange. Check both amounts.';return;}
  get('funding-shortfall').textContent=cash(Math.max(0,target-available));
  get('funding-availability').textContent=available>=target?'Current free futures funds cover this estimate.':exchange!==null&&exchange<target?'Total funds on the exchange are below the target.':'Additional free funds are needed. Confirm the transferable balance on the exchange.';
 }
 for(const id of ['balance-before','chosen-risk','entry','sl','safety-factor','leverage','exchange-balance','futures-available'])get(id).addEventListener('input',render);
 document.querySelectorAll('[data-balance-currency]').forEach(button=>button.addEventListener('click',render));
 render();
})();