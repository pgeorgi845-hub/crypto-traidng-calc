// Purpose: Calculate returns in R using the worksheet stop-distance formula.
// Public API: None. Key dependencies: Entry, SL, Exit and multiplier DOM inputs.
(() => {
 'use strict';
 const fields=['entry','sl','exit','winning-return-multiplier'].map(id=>document.getElementById(id));
 const output=document.getElementById('returns');
 const note=document.getElementById('returns-note');
 function renderReturns(){
  output.textContent='';
  output.dataset.value='';
  output.className='amount';
  const values=fields.map(field=>field.valueAsNumber);
  if(fields.some(field=>field.validity.badInput)){
   note.textContent='Enter valid numbers.';return;
  }
  if(fields.slice(0,3).some(field=>field.value==='')){
   note.textContent='Enter Entry, 50% SL and Exit.';return;
  }
  const [entry,sl,exit,multiplier]=values;
  if(values.slice(0,3).some(value=>!Number.isFinite(value)||value<=0)){
   note.textContent='Prices must be greater than 0.';return;
  }
  if(entry===sl){note.textContent='Entry and 50% SL must differ.';return;}
  const raw=(exit-entry)/(entry-sl);
  if(raw>0&&(!Number.isFinite(multiplier)||multiplier<0||fields[3].value==='')){
   note.textContent='Enter a winning return multiplier of 0 or more.';return;
  }
  const result=raw>0?raw*multiplier:raw;
  if(!Number.isFinite(result)){note.textContent='These values exceed the calculation range.';return;}
  output.dataset.value=String(result);
  const chosen=document.getElementById('chosen-risk');
  const portfolioR=result*chosen.valueAsNumber;
  if(chosen.value===''||!Number.isFinite(portfolioR)||chosen.valueAsNumber<0){note.textContent='Enter chosen risk to express the result in portfolio R.';return;}
  output.textContent=(portfolioR>0?'+':'')+Number(portfolioR.toFixed(3))+' R';
  output.className='amount'+(portfolioR>0?' positive':portfolioR<0?' negative':'');
  note.textContent='1 R = 1% of total portfolio. '+(raw>0?'Positive return multiplied by '+multiplier+'x. Before fees.':'Before fees. Winning multiplier does not apply.');
 }
 fields.forEach(field=>field.addEventListener('input',renderReturns));
 document.getElementById('chosen-risk').addEventListener('input',renderReturns);
 document.addEventListener('trade-risk-updated',renderReturns);
 renderReturns();
})();