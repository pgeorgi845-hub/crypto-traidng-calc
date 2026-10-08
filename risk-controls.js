// Purpose: Collect fee rates and enforce the maximum chosen risk at the actual stop price.
// Public API: window.OrbitRiskUI.read(), .state; trade-risk-updated DOM event.
// Key dependencies: risk-math.js, OrbitBalance.parse, existing calculator inputs, localStorage.
(() => {
 'use strict';
 const get=id=>document.getElementById(id);
 const risk=get('chosen-risk'),settings=get('trade-input-details').querySelector('.fields');
 const group=document.createElement('div');group.className='fields';
 group.innerHTML=`<div><label for="entry-fee">Entry fee (%)</label><div class="input"><input id="entry-fee" type="number" min="0" max="99.999" step="any" inputmode="decimal" placeholder="e.g. 0.02"><span class="unit">%</span></div></div>
 <div><label for="exit-fee">Exit / SL fee (%)</label><div class="input"><input id="exit-fee" type="number" min="0" max="99.999" step="any" inputmode="decimal" placeholder="e.g. 0.05"><span class="unit">%</span></div></div>
 <p class="help">Enter your actual fees. Exit fee applies at Exit and at SL. 1 R = 1% of total portfolio. Limit covers these trading fees; funding, slippage and Cross liquidation are not included.</p>
 <p class="help" id="risk-limit-note" role="status"></p>`;
 settings.append(group);
 const number=id=>{const f=get(id);return f.value!==''&&!f.validity.badInput&&Number.isFinite(f.valueAsNumber)?f.valueAsNumber:NaN;};
 const feeIds=['entry-fee','exit-fee'];
 for(const id of feeIds){
  try{const saved=localStorage.getItem('orbit.'+id);if(saved!==null&&saved.trim()!==''&&Number.isFinite(Number(saved))&&Number(saved)>=0&&Number(saved)<100)get(id).value=saved;}catch{}
  get(id).addEventListener('input',()=>{
   try{const value=number(id);if(get(id).value===''&&!get(id).validity.badInput)localStorage.removeItem('orbit.'+id);else if(value>=0&&value<100)localStorage.setItem('orbit.'+id,get(id).value);}catch{get('risk-limit-note').textContent+=' Fee saving unavailable.';}
  });
 }
 function read(){return {balance:window.OrbitBalance.parse(get('balance-before').value),risk:number('chosen-risk'),entry:number('entry'),sl:number('sl'),exit:number('exit'),multiplier:number('winning-return-multiplier'),entryFee:number('entry-fee'),exitFee:number('exit-fee')};}
 const api={read,state:{}};window.OrbitRiskUI=api;
 let dispatching=false;
 function update(){
  const data=read(),max=window.OrbitRisk.maximum(data);
  const limit=max===null?null:Math.floor(max*1e6)/1e6;
  if(limit===null)risk.removeAttribute('max');else risk.max=String(limit);
  let changed=false;
  if(limit!==null&&Number.isFinite(data.risk)&&data.risk>limit){
   risk.value=String(limit);data.risk=limit;changed=true;
   try{localStorage.setItem('orbit.chosenRiskR',risk.value);}catch{}
  }
  api.state=window.OrbitRisk.calculate(data);
  get('risk-limit-note').textContent=limit===null?'Enter Entry, 50% SL and both fee rates to determine the maximum risk.':'Maximum chosen risk: '+limit+' R. '+(changed?'Risk reduced to keep the modeled SL loss within 1 R.':'SL loss including entry and closing fees must not exceed 1 R.');
  if(changed&&!dispatching){dispatching=true;try{risk.dispatchEvent(new Event('input',{bubbles:true}));}finally{dispatching=false;}}
  if(changed)get('risk-limit-note').textContent='Risk reduced to '+limit+' R to keep the modeled SL loss within 1 R.';
  document.dispatchEvent(new Event('trade-risk-updated'));
 }
 // Capture runs before existing persistence and calculation input handlers.
 for(const id of ['balance-before','chosen-risk','entry','sl','exit','winning-return-multiplier',...feeIds])get(id).addEventListener('input',update,true);
 update();
})();