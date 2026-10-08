// Purpose: Verify SL fee limits, Exit projections and independent realized P&L.
// Public API: node tests/risk-fees.test.cjs. Dependencies: Node built-ins and local calculator scripts.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.js')))new vm.Script(read(name));
const ctx={window:{}};vm.runInNewContext(read('risk-math.js'),ctx);
const math=ctx.window.OrbitRisk;
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const input={balance:10000,risk:.95,entry:100,sl:90,exit:120,multiplier:.85,entryFee:.02,exitFee:.05};
let s=math.calculate(input);
approx(s.max,1/1.0065);approx(s.stopLoss,95.6175);approx(s.gross,161.5);approx(s.net,160.74);
s=math.calculate({...input,sl:110,exit:80});approx(s.stopLoss,95.7125);approx(s.net,160.93);
s=math.calculate({...input,exit:NaN});assert.ok(Number.isFinite(s.stopLoss));assert.equal(s.net,undefined);
s=math.calculate({...input,entryFee:NaN});assert.equal(s.max,null);assert.equal(s.net,undefined);assert.ok(Number.isFinite(s.gross));
s=math.calculate({...input,risk:0});assert.equal(s.stopLoss,0);assert.equal(s.net,0);
for(const [entryFee,exitFee] of [[0,0],[.05,.05],[1,2]]){
 const d={...input,entryFee,exitFee};const max=math.maximum(d);const risk=Math.floor(max*1e6)/1e6;
 assert.ok(math.calculate({...d,risk}).stopLossR<=1+1e-12);
 assert.ok(math.calculate({...d,risk:max+.0001}).stopLossR>1);
}
assert.equal(math.maximum({...input,entry:90}),null);
assert.equal(math.maximum({...input,exitFee:-1}),null);
assert.equal(math.maximum({...input,exitFee:100}),null);
console.log('PASS: pure math, long/short, missing values, fee boundary, solved risk cap.');
class Element{
 constructor(){this.value='';this.dataset={};this.validity={badInput:false};this.events={};this.attrs={};this.textContent='';this.classList={add(){}};}
 get valueAsNumber(){return this.value===''?NaN:Number(this.value);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,f,capture=false){(this.events[k]??=[]).push({f,capture});}
 dispatchEvent(e){e.target=this;for(const {f} of [...(this.events[e.type]??[])].sort((a,b)=>Number(b.capture)-Number(a.capture)))f(e);}
 append(){} focus(){}
 closest(){return {insertAdjacentElement(){},classList:{add(){}},setAttribute(){},set innerHTML(html){register(html)}};}
 querySelector(){return new Element();}
 set innerHTML(html){this.markup=html;register(html);}
 get innerHTML(){return this.markup||'';}
}
const nodes={};
function register(html){for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){if(!nodes[m[1]])nodes[m[1]]=new Element();nodes[m[1]].value=m[0].match(/\bvalue="([^"]*)"/)?.[1]??'';}}
register(read('index.html'));
for(const id of ['leverage'])nodes[id]=new Element();nodes.leverage.value='100';
const doc=new Element();doc.getElementById=id=>{assert.ok(nodes[id],`Missing ${id}`);return nodes[id];};doc.querySelectorAll=()=>[];doc.createElement=()=>new Element();
const store=new Map([['orbit.chosenRiskR','1'],['orbit.entry-fee','1'],['orbit.exit-fee','1']]);
const context=vm.createContext({document:doc,window:{OrbitBalance:{parse:s=>s.trim()===''?NaN:Number(s.replaceAll(',',''))}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},Event:class{constructor(type){this.type=type}}});
nodes['balance-before'].value='10,000';nodes['balance-before'].dataset.currency='USD';nodes['chosen-risk'].value='1';nodes.entry.value='100';nodes.sl.value='99';nodes.exit.value='';
for(const f of ['risk-math.js','risk-controls.js','returns.js','trade-details.js','trade-outcomes.js'])vm.runInContext(read(f),context);
function set(id,value){nodes[id].value=String(value);nodes[id].dispatchEvent(new context.Event('input'));}
assert.ok(Number(nodes['chosen-risk'].value)<1);assert.equal(store.get('orbit.chosenRiskR'),nodes['chosen-risk'].value);
assert.ok(context.window.OrbitRiskUI.state.stopLossR<=1);
assert.equal(nodes['expected-net'].textContent,'');assert.ok(nodes['stop-net'].textContent.includes('R'));
const cap=Number(nodes['chosen-risk'].value);set('exit',130);assert.equal(Number(nodes['chosen-risk'].value),cap);
set('chosen-risk',5);assert.equal(Number(nodes['chosen-risk'].value),cap);
set('entry-fee',0);set('exit-fee',0);set('chosen-risk',1);assert.equal(nodes['chosen-risk'].value,'1');
set('sl',90);set('exit',120);set('winning-return-multiplier',.85);assert.equal(nodes['expected-net'].textContent,'+$170.00 · 1.7 R');
set('realized-pnl','-99.67');assert.equal(nodes['balance-after'].textContent,'$9,900.33');
assert.equal(nodes['pnl-deviation'].textContent,'-$269.67 · -2.697 R');
set('exit','');assert.equal(nodes['expected-net'].textContent,'');assert.equal(nodes['pnl-deviation'].textContent,'');assert.equal(nodes['balance-after'].textContent,'$9,900.33');
set('entry-fee','');assert.equal(nodes['stop-net'].textContent,'');assert.equal(context.window.OrbitRiskUI.state.max,null);
set('entry-fee',0);set('exit-fee',.05);set('sl',110);set('chosen-risk',.9);set('exit',80);assert.ok(nodes['expected-net'].textContent.includes('$152.64'));
nodes['balance-before'].dataset.currency='EUR';set('balance-before','10,000');assert.ok(nodes['expected-net'].textContent.includes('€152.64'));assert.ok(nodes['position-fees'].innerHTML.includes('Amount (EUR)'));
set('realized-pnl',0);assert.equal(nodes['balance-after'].textContent,'€10,000.00');
console.log('PASS: fee restore, risk clamping/persistence, blank Exit, full reactive UI, shared R, independent realized result, EUR, zero.');