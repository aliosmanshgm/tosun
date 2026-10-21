/* T10X v0.11.0 - deterministic, manufacturer-schedule-compatible maintenance tracking.
   Milestones do not reset when maintenance is performed early. No invented first-registration date. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.T10XMaintenance=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DEFAULT_CONFIG=Object.freeze({startDate:'',startOdo:0,intervalMonths:24,intervalKm:40000,warnDays:90,warnKm:3000});
 const validDate=s=>{if(typeof s!=='string'||!/^(\d{4})-(\d{2})-(\d{2})$/.test(s))return false;const y=+s.slice(0,4),m=+s.slice(5,7),d=+s.slice(8,10);const x=new Date(Date.UTC(y,m-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d;};
 const utc=s=>validDate(s)?Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10)):NaN;
 const daysBetween=(from,to)=>validDate(from)&&validDate(to)?Math.round((utc(to)-utc(from))/86400000):null;
 const addMonths=(date,months)=>{if(!validDate(date)||!Number.isInteger(months))return null;const y=+date.slice(0,4),m=+date.slice(5,7)-1,d=+date.slice(8,10);const target=new Date(Date.UTC(y,m+months,1));const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();return `${target.getUTCFullYear()}-${String(target.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;};
 function normalizeConfig(input){const c={...DEFAULT_CONFIG,...(input&&typeof input==='object'?input:{})};c.startDate=validDate(c.startDate)?c.startDate:'';for(const k of ['startOdo','intervalMonths','intervalKm','warnDays','warnKm'])c[k]=Number(c[k]);return c;}
 function validateConfig(config){const c=normalizeConfig(config),err=[];if(!validDate(c.startDate))err.push('İlk tescil / bakım başlangıç tarihi eksik veya geçersiz.');if(!Number.isInteger(c.startOdo)||c.startOdo<0||c.startOdo>1000000)err.push('Başlangıç kilometresi 0–1.000.000 arasında olmalı.');if(!Number.isInteger(c.intervalMonths)||c.intervalMonths<1||c.intervalMonths>120)err.push('Bakım süresi 1–120 ay arasında olmalı.');if(!Number.isInteger(c.intervalKm)||c.intervalKm<1000||c.intervalKm>200000)err.push('Bakım kilometresi 1.000–200.000 arasında olmalı.');if(!Number.isInteger(c.warnDays)||c.warnDays<0||c.warnDays>365)err.push('Gün uyarı eşiği 0–365 arasında olmalı.');if(!Number.isInteger(c.warnKm)||c.warnKm<0||c.warnKm>20000)err.push('Kilometre uyarı eşiği 0–20.000 arasında olmalı.');return err;}
 function completedIndices(records){const set=new Set();for(const r of records||[]){if(r?.type==='periodic'&&Number.isInteger(Number(r.milestone))&&Number(r.milestone)>=1&&Number(r.milestone)<100)set.add(Number(r.milestone));}return set;}
 function compute({config={},records=[],currentOdo=null,today=null}={}){
  const c=normalizeConfig(config),errors=validateConfig(c);if(errors.length)return{ready:false,status:'setup',errors,completed:0,recordsCount:records.length};
  const done=completedIndices(records);let milestone=1;while(done.has(milestone)&&milestone<100)milestone++;
  const dueDate=addMonths(c.startDate,c.intervalMonths*milestone),dueOdo=c.startOdo+c.intervalKm*milestone;
  const currentKm=(currentOdo!==null&&currentOdo!==undefined&&currentOdo!==''&&Number.isFinite(Number(currentOdo))&&Number(currentOdo)>=0)?Number(currentOdo):null;
  const localToday=today??(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})();
  const remainingDays=daysBetween(localToday,dueDate),remainingKm=currentKm===null?null:dueOdo-currentKm;
  const overdueDate=remainingDays!==null&&remainingDays<=0,overdueKm=remainingKm!==null&&remainingKm<=0;
  const dueSoonDate=remainingDays!==null&&remainingDays<=c.warnDays,dueSoonKm=remainingKm!==null&&remainingKm<=c.warnKm;
  const status=overdueDate||overdueKm?'due':dueSoonDate||dueSoonKm?'soon':'ok';
  const latestPeriodic=[...(records||[])].filter(x=>x?.type==='periodic').sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
  const serviceAdvice=latestPeriodic&&(validDate(latestPeriodic.nextAdviceDate)||Number(latestPeriodic.nextAdviceOdo)>0)?{date:validDate(latestPeriodic.nextAdviceDate)?latestPeriodic.nextAdviceDate:null,odo:Number(latestPeriodic.nextAdviceOdo)>0?Number(latestPeriodic.nextAdviceOdo):null,source:latestPeriodic.serviceCenter||'Servis kaydı'}:null;
  const missingMilestones=[...done].filter(x=>x>milestone);
  return{ready:true,config:c,status,milestone,dueDate,dueOdo,currentOdo:currentKm,remainingDays,remainingKm,completed:done.size,completedIndices:[...done].sort((a,b)=>a-b),missingMilestones,latestPeriodic,serviceAdvice,trigger:overdueDate||overdueKm?(overdueDate&&overdueKm?'both':overdueDate?'date':'km'):dueSoonDate||dueSoonKm?(dueSoonDate&&dueSoonKm?'both':dueSoonDate?'date':'km'):'none',errors:[]};
 }
 function availableMilestones(config,currentOdo,records=[]){const done=completedIndices(records),c=normalizeConfig(config),suggest=compute({config:c,records,currentOdo}).milestone||1,limit=Math.max(4,suggest+3);return Array.from({length:Math.min(20,limit)},(_,i)=>({value:i+1,label:`${i+1}. periyodik bakım · ${i+1} × ${c.intervalKm||40000} km / ${i+1} × ${c.intervalMonths||24} ay${done.has(i+1)?' (tamamlandı)':''}`}));}
 return{DEFAULT_CONFIG,validDate,daysBetween,addMonths,normalizeConfig,validateConfig,completedIndices,compute,availableMilestones};
});
