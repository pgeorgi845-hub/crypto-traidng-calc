// Purpose: Calculate stop risk and separate Exit estimates using one portfolio R basis.
// Public API: window.OrbitRisk.calculate(inputs), window.OrbitRisk.maximum(inputs).
// Key dependencies: None. Inputs are numeric; fee percentages are divided by 100 here.
window.OrbitRisk=(()=>{
 'use strict';
 const positive=n=>Number.isFinite(n)&&n>0;
 const nonnegative=n=>Number.isFinite(n)&&n>=0;
 function maximum({entry,sl,entryFee,exitFee}){
  if(!positive(entry)||!positive(sl)||entry===sl||!nonnegative(entryFee)||entryFee>=100||!nonnegative(exitFee)||exitFee>=100)return null;
  const cost=(entry*(entryFee/100)+sl*(exitFee/100))/Math.abs(entry-sl);
  const value=1/(1+cost);
  return positive(value)?value:null;
 }
 function calculate(input){
  const {balance,risk,entry,sl,exit,multiplier,entryFee,exitFee}=input;
  const max=maximum(input);
  const result={max,oneR:positive(balance)?balance/100:null};
  if(!positive(balance)||!nonnegative(risk)||!positive(entry)||!positive(sl)||entry===sl)return result;
  const distance=Math.abs(entry-sl),oneR=balance/100,riskCash=oneR*risk;
  const units=riskCash/distance; // Quantity expressed per USD price, before FX.
  const notional=units*entry;
  if(!Number.isFinite(units)||!Number.isFinite(notional))return result;
  Object.assign(result,{riskCash,notional,units});
  if(max!==null){
   const openingFee=units*entry*(entryFee/100);
   const stopFee=units*sl*(exitFee/100);
   const stopFees=openingFee+stopFee;
   const loss=riskCash+stopFees;
   if([openingFee,stopFee,loss].every(Number.isFinite))Object.assign(result,{openingFee,stopFee,stopFees,stopLoss:loss,stopLossR:loss/oneR});
  }
  if(!positive(exit))return result;
  const raw=(exit-entry)/(entry-sl);
  if(raw>0&&!nonnegative(multiplier))return result;
  const gross=riskCash*(raw>0?raw*multiplier:raw);
  if(!Number.isFinite(gross))return result;
  Object.assign(result,{gross,grossR:gross/oneR});
  if(max!==null){
   const closingFee=units*exit*(exitFee/100),fees=result.openingFee+closingFee,net=gross-fees;
   if([closingFee,fees,net].every(Number.isFinite))Object.assign(result,{closingFee,fees,net,netR:net/oneR});
  }
  return result;
 }
 return {maximum,calculate};
})();