// Purpose: Fetch EUR/USD reference and compare Binance/Bybit EUR/USDT spot snapshots.
// Public API: None. Dependencies: public HTTPS APIs, balance-format.js, EUR/USD and balance DOM.
(() => {
 'use strict';
 const fx=document.getElementById('eur-usd');
 const fxNote=document.getElementById('fx-note');
 const balance=document.getElementById('balance-before');
 const panel=document.createElement('details');
 panel.className='rates-panel';panel.open=true;
 panel.innerHTML=`<summary>Exchange rates</summary>
 <div class="rate-line"><span>EUR / USD <small>Daily reference · Frankfurter</small></span><output id="rate-reference">Loading…</output></div>
 <div class="rate-line"><span>EUR / USDT <small>Binance · last trade</small></span><output id="rate-binance">Loading…</output></div>
 <div class="rate-line"><span>EUR / USDT <small>Bybit · inverse USDTEUR last trade</small></span><output id="rate-bybit">Loading…</output></div>
 <p class="help" id="rate-comparison"></p>
 <p class="help" id="rate-totals"></p>
 <p class="help">USDT comparisons do not replace the USD rate used for position sizing. Last-trade quotes exclude fees and spread. USD estimates use the daily reference.</p>

 <p class="help" id="rate-status" role="status"></p>`;
 const fxField=document.getElementById('fx-field');
 fxField.before(panel);
 panel.append(fxField);
 const output=id=>panel.querySelector('#'+id);

 const state={reference:null,binance:null,bybit:null};
 let automatic=fx.value==='';
 let internal=false;
 let appliedDate='';
 const numeric=value=>{const n=Number(value);if(!Number.isFinite(n)||n<=0)throw Error('Invalid rate');return n;};
 const format=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(n);
 const amount=n=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 fx.addEventListener('input',()=>{
  if(internal)return;
  automatic=fx.value==='';
  fxNote.textContent=automatic?'The next automatic check will load the daily reference.':'Manual EUR/USD rate. Market refresh will not overwrite it.';
 });
 async function json(url){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   return await response.json();
  }finally{clearTimeout(timeout);}
 }
 function totals(){
  const quotes=['binance','bybit'].filter(name=>state[name]);
  output('rate-comparison').textContent=state.binance&&state.bybit?
   'Bybit vs Binance: '+((state.bybit/state.binance-1)*100).toFixed(3)+'% in USDT per EUR.':'';
  if(state.reference&&quotes.length){
   output('rate-comparison').textContent+=' Implied USD per USDT: '+quotes.map(name=>name==='binance'?'Binance '+format(state.reference.rate/state[name]):'Bybit '+format(state.reference.rate/state[name])).join(' · ')+'.';
  }
  const value=window.OrbitBalance.parse(balance.value);
  if(!Number.isFinite(value)||value<0){output('rate-totals').textContent='';return;}
  const eur=balance.dataset.currency==='EUR'?value:state.reference?value/state.reference.rate:null;
  output('rate-totals').textContent=eur!==null&&quotes.length?'Your balance, estimated in USDT: '+quotes.map(name=>(name==='binance'?'Binance ':'Bybit ')+amount(eur*state[name])).join(' · '):'';
 }
 async function load(){


  for(const name of Object.keys(state)){state[name]=null;output('rate-'+name).textContent='Loading…';}
  totals();
  const jobs=[
   ['reference',async()=>{
    const data=await json('https://api.frankfurter.dev/v2/rate/EUR/USD');
    if(data.base!=='EUR'||data.quote!=='USD'||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))throw Error('Invalid reference');
    const rate=numeric(data.rate);state.reference={rate,date:data.date};
    output('rate-reference').textContent=format(rate)+' USD · '+data.date;
    if(automatic){
     fx.value=String(rate);appliedDate=data.date;internal=true;
     try{fx.dispatchEvent(new Event('input',{bubbles:true}));}finally{internal=false;}
     fxNote.textContent='Frankfurter daily reference · '+data.date+'. Edit to override.';
    }
   }],
   ['binance',async()=>{
    const data=await json('https://data-api.binance.vision/api/v3/ticker/price?symbol=EURUSDT');
    if(data.symbol!=='EURUSDT')throw Error('Unexpected pair');
    state.binance=numeric(data.price);output('rate-binance').textContent=format(state.binance)+' USDT';
   }],
   ['bybit',async()=>{
    const data=await json('https://api.bybit.com/v5/market/tickers?category=spot&symbol=USDTEUR');
    const ticker=data.result?.list?.find(item=>item.symbol==='USDTEUR');
    if(data.retCode!==0||!ticker)throw Error('Pair unavailable');
    state.bybit=numeric(1/numeric(ticker.lastPrice));output('rate-bybit').textContent=format(state.bybit)+' USDT';
   }]
  ];
  const results=await Promise.allSettled(jobs.map(async([name,job])=>{
   try{await job();}catch(error){
    state[name]=null;output('rate-'+name).textContent='Unavailable';
    if(name==='reference'&&automatic)fxNote.textContent=fx.value?'Refresh failed. Reference from '+appliedDate+' retained; edit to override.':'Reference unavailable. Enter EUR/USD manually.';
    throw error;
   }
  }));
  const failed=results.filter(result=>result.status==='rejected').length;
  totals();return {failed};
 }
 balance.addEventListener('input',totals);
 document.querySelectorAll('[data-balance-currency]').forEach(button=>button.addEventListener('click',totals));

 window.OrbitRateRefresh.start(panel,load);
})();