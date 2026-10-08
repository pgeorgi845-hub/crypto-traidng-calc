// Purpose: Separate SL loss, Exit estimates after fees and independently entered realized results.
// Public API: None. Key dependencies: OrbitRisk, OrbitRiskUI, OrbitBalance.parse, existing DOM.
(() => {
 'use strict';
 const get=id=>document.getElementById(id);
 const section=get('balance-after').closest('section');
 section.setAttribute('aria-labelledby','outcomes-title');
 section.innerHTML=`<div class="heading"><h2 id="outcomes-title">Risk at SL</h2></div>
 <div class="row"><span>Loss at SL (before fees)</span><output id="stop-gross"></output></div>
 <div class="row"><span>Total fees at SL</span><output id="stop-fees"></output></div>
 <div class="row"><span>Loss at SL (including fees)</span><output id="stop-net"></output></div>
 <p class="help" id="stop-note" role="status"></p>
 <div class="heading"><h2>Expected at Exit</h2></div>
 <div class="row"><span>Expected P&amp;L (before fees)</span><output id="expected-pnl"></output></div>
 <div class="row"><span>Total fees at Exit</span><output id="expected-fees"></output></div>
 <div class="row"><span>Expected P&amp;L (after fees)</span><output id="expected-net"></output></div>
 <div class="row"><span>Expected balance after (after fees)</span><output id="expected-balance"></output></div>
 <p class="help" id="expected-note"></p>
 <div class="heading"><h2>Realized result</h2></div>
 <label for="realized-pnl">Realized P&amp;L (all fees included)</label>
 <div class="input"><input id="realized-pnl" type="text" inputmode="decimal" placeholder="e.g. -99.67" aria-describedby="realized-note"><span class="unit" id="realized-unit">USD</span></div>
 <div class="switch"><button type="button" id="realized-sign">Change sign (+ / &minus;)</button></div>
 <p class="help" id="realized-note">Negative = loss. Positive = profit. Enter the final net result. Fees are not deducted again.</p>
 <div class="row"><span>Realized balance after</span><output id="balance-after"></output></div>
 <div class="row"><span>Realized − expected (after fees)</span><output id="pnl-deviation"></output></div>
 <p class="help" id="balance-after-note" role="status"></p>`;
 get('chosen-risk').closest('.input').insertAdjacentElement('afterend',get('stop-net').closest('.row'));
 const cash=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
 function render(){
  const data=window.OrbitRiskUI.read(),s=window.OrbitRisk.calculate(data);
  const c=get('balance-before').dataset.currency==='EUR'?'EUR':'USD';
  get('realized-unit').textContent=c;
  const r=n=>Number(n.toFixed(3))+' R';
  const show=(id,value)=>{get(id).textContent=Number.isFinite(value)&&s.oneR?(value>0?'+':'')+cash(value,c)+' · '+(id==='stop-net'?Number((value/s.oneR).toFixed(2))+' R':r(value/s.oneR)):'';};
  show('stop-gross',-s.riskCash);show('stop-fees',s.stopFees);show('stop-net',-s.stopLoss);
  get('stop-note').textContent=Number.isFinite(s.stopLoss)?'Modeled loss at SL: '+r(s.stopLossR)+'. Limit: 1 R. Funding, slippage and liquidation are excluded.':'Enter balance, chosen risk, Entry, 50% SL and both fee rates. Exit is not required.';
  show('expected-pnl',s.gross);show('expected-fees',s.fees);show('expected-net',s.net);
  get('expected-balance').textContent=Number.isFinite(s.net)&&Number.isFinite(data.balance+s.net)?cash(data.balance+s.net,c):'';
  get('expected-note').textContent=Number.isFinite(s.net)?'Uses Exit. Positive gross P&L uses your winning multiplier; fees use the full position.':'Enter Exit and both fee rates for the net estimate. This does not change the SL limit.';
  const field=get('realized-pnl'),raw=field.value.trim();
  const actual=window.OrbitBalance.parse(raw.replace(/^[+-]/,''))*(raw.startsWith('-')?-1:1);
  const validActual=raw!==''&&Number.isFinite(actual),validBalance=Number.isFinite(data.balance)&&data.balance>=0;
  field.setAttribute('aria-invalid',String(raw!==''&&!validActual));
  get('balance-after').textContent=validBalance&&validActual&&Number.isFinite(data.balance+actual)?cash(data.balance+actual,c):'';
  show('pnl-deviation',validActual&&Number.isFinite(s.net)?actual-s.net:NaN);
  get('balance-after-note').textContent=raw!==''&&!validActual?'Enter a signed net amount.':!validBalance?'Enter Balance before.':!validActual?'Enter the actual net result after closing.':'Actual net P&L is added once. Positive deviation = better than expected; negative = worse.';
 }
 get('realized-sign').addEventListener('click',()=>{const f=get('realized-pnl'),v=f.value.trim();f.value=v.startsWith('-')?v.slice(1):'-'+v.replace(/^\+/,'');f.dispatchEvent(new Event('input',{bubbles:true}));f.focus();});
 for(const id of ['balance-before','chosen-risk','entry','sl','exit','winning-return-multiplier','entry-fee','exit-fee','realized-pnl'])get(id).addEventListener('input',render);
 document.querySelectorAll('[data-balance-currency]').forEach(b=>b.addEventListener('click',render));
 document.addEventListener('trade-risk-updated',render);
 render();
})();