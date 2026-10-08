// Purpose: Show position sizing and fees on the shared portfolio R basis.
// Public API: None. Key dependencies: OrbitRisk, OrbitRiskUI, balance currency, leverage inputs.
(() => {
 'use strict';
 const get=id=>document.getElementById(id);
 const ids=['position-size-btc','dollar-amount','position-fees','risk-fiat','bybit-cost-r'];
 const out=Object.fromEntries(ids.map(id=>[id,get(id)]));
 out['position-fees'].closest('.row').classList.add('fees-row');
 const cash=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
 const r=n=>Number(n.toFixed(3))+' R';
 function render(){
  Object.values(out).forEach(o=>o.textContent='');
  const data=window.OrbitRiskUI.read(),s=window.OrbitRisk.calculate(data);
  const currency=get('balance-before').dataset.currency==='EUR'?'EUR':'USD';
  const rate=currency==='EUR'?get('eur-usd').valueAsNumber:1;
  get('fx-field').hidden=currency!=='EUR';
  get('dollar-amount-label').textContent='Position value ('+currency+')';
  if(Number.isFinite(s.riskCash))out['risk-fiat'].textContent=cash(s.riskCash,currency);
  if(Number.isFinite(s.notional)){
   out['dollar-amount'].textContent=cash(s.notional,currency);
   if(Number.isFinite(rate)&&rate>0){const quantity=s.units*rate;if(Number.isFinite(quantity))out['position-size-btc'].textContent=quantity.toFixed(8)+' BTC';}
   const leverage=get('leverage').valueAsNumber,factor=get('safety-factor').valueAsNumber;
   if(s.oneR&&Number.isFinite(leverage)&&leverage>=1&&Number.isFinite(factor)&&factor>0)out['bybit-cost-r'].textContent=r(s.notional/leverage*factor/s.oneR);
  }
  if(Number.isFinite(s.stopFees)){
   const row=(label,fee)=>`<span class="fee-grid" role="row"><span role="cell">${label}</span><strong role="cell">${cash(fee,currency)}</strong><strong role="cell">${r(fee/s.oneR)}</strong></span>`;
   out['position-fees'].innerHTML=`<span class="fee-table" role="table" aria-label="Entry and closing fees"><span class="fee-grid fee-head" role="row"><span role="columnheader">Fee</span><span role="columnheader">Amount (${currency})</span><span role="columnheader">Risk (R)</span></span>${row('Entry · '+data.entryFee+'%',s.openingFee)}${row('Close at SL · '+data.exitFee+'%',s.stopFee)}${row('Total at SL',s.stopFees)}${Number.isFinite(s.fees)?row('Total at Exit',s.fees):''}</span><span class="fee-help">1 R = ${cash(s.oneR,currency)} (1% of portfolio). Closing fee uses the actual SL or Exit price.</span>`;
  }
  const missing=[];
  if(!Number.isFinite(s.riskCash))missing.push('Enter balance, chosen risk, Entry and 50% SL.');
  if(s.max===null)missing.push('Enter both fee rates to check the 1 R loss limit.');
  if(currency==='EUR'&&(!Number.isFinite(rate)||rate<=0))missing.push('EUR/USD is needed for BTC quantity.');
  get('trade-details-note').textContent=missing.length?missing.join(' '):'All R amounts use 1% of the total portfolio. SL risk is checked independently of Exit.';
 }
 for(const id of ['balance-before','chosen-risk','entry','sl','exit','entry-fee','exit-fee','eur-usd','safety-factor','leverage'])get(id).addEventListener('input',render);
 document.querySelectorAll('[data-balance-currency]').forEach(b=>b.addEventListener('click',render));
 document.addEventListener('trade-risk-updated',render);
 render();
})();