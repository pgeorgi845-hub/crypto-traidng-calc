// Purpose: Schedule rate checks and persist panel/countdown presentation preferences.
// Public API: window.OrbitRateRefresh.start(panel, load). Dependencies: DOM, timers, optional localStorage.
window.OrbitRateRefresh={start(panel,load){
 'use strict';
 const period=30000;
 function read(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:value==='true';}catch{return fallback;}}
 const openKey='orbit.ratesOpen',countKey='orbit.ratesCountdown';
 panel.open=read(openKey,true);
 let showCountdown=read(countKey,true),busy=false,next=0,feedbackUntil=0,timer=null,stopped=false;
 const summary=panel.querySelector('summary');
 const feedback=document.createElement('span');feedback.className='rate-feedback';feedback.setAttribute('role','status');
 const countdown=document.createElement('span');countdown.className='rate-countdown';
 summary.append(feedback,countdown);
 const controls=document.createElement('div');controls.className='switch';
 const toggle=document.createElement('button');toggle.type='button';controls.append(toggle);
 const preferenceNote=document.createElement('p');preferenceNote.className='help';preferenceNote.setAttribute('role','status');
 panel.append(controls,preferenceNote);
 const status=panel.querySelector('#rate-status');
 function save(key,value){try{localStorage.setItem(key,String(value));preferenceNote.textContent='';}catch{preferenceNote.textContent='Could not save this display preference.';}}
 panel.addEventListener('toggle',()=>save(openKey,panel.open));
 function display(){
  toggle.textContent='Countdown: '+(showCountdown?'On':'Off');
  toggle.setAttribute('aria-pressed',String(showCountdown));
  countdown.hidden=!showCountdown;
  countdown.textContent=busy?'Checking...':'Next check in '+Math.max(0,Math.ceil((next-Date.now())/1000))+'s';
  if(!busy&&Date.now()>=feedbackUntil)feedback.textContent='';
 }
 toggle.addEventListener('click',()=>{showCountdown=!showCountdown;save(countKey,showCountdown);display();});
 async function check(){
  if(busy||stopped)return;
  busy=true;next=Date.now()+period;feedback.textContent='Checking...';display();
  try{
   const result=await load();
   const failed=result?.failed??0;
   const stamp=new Date().toISOString().replace('T',' ').slice(0,19)+' UTC';
   feedback.textContent=failed?'Check incomplete':'Rates checked';
   status.textContent=failed?'Checked '+stamp+'. '+failed+' source(s) unavailable. Automatic retry continues.':'Last checked: '+stamp+'. Auto-check every 30 seconds.';
  }catch{
   feedback.textContent='Check failed';
   status.textContent='Rates could not be checked. Automatic retry continues.';
  }finally{busy=false;feedbackUntil=Date.now()+5000;display();}
 }
 function tick(){if(!busy&&Date.now()>=next)void check();display();}
 function resume(){stopped=false;if(timer===null)timer=setInterval(tick,1000);tick();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 window.addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);timer=null;});
 window.addEventListener('pageshow',resume);
 resume();
}};