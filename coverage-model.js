/* T10X v0.12.0 - warranty, extensions, insurance. Local civil dates; no implied manufacturer coverage from optional products. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.T10XCoverage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&(()=>{const t=new Date(s+'T12:00:00Z');return !Number.isNaN(t.getTime())&&t.toISOString().slice(0,10)===s;})();
 const ordinal=s=>validDate(s)?Date.parse(s+'T12:00:00Z'):NaN;
 const days=(a,b)=>validDate(a)&&validDate(b)?Math.round((ordinal(b)-ordinal(a))/86400000):null;
 function addMonths(date,num){if(!validDate(date)||!Number.isInteger(num))return null;const [y,m,d]=date.split('-').map(Number);const x=new Date(Date.UTC(y,m-1+num,1));const max=new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate();return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(d,max)).padStart(2,'0')}`;}
 const warrantyDefault=Object.freeze({vehicle:{startDate:'',durationMonths:36,maxOdo:100000,provider:'Togg',reference:'',documentUrl:'',notes:''},battery:{startDate:'',durationMonths:96,maxOdo:160000,provider:'Togg',reference:'',documentUrl:'',notes:''}});
 const warningDefaults=Object.freeze({days:90,km:5000,policyDays:30});
 const defaultData=()=>({warranties:{vehicle:{...warrantyDefault.vehicle},battery:{...warrantyDefault.battery}},extensions:[],policies:[],warnings:{...warningDefaults}});
 const optText=(v,max=5000)=>String(v??'').trim().slice(0,max);
 const nullableNum=v=>v===null||v===undefined||v===''?null:Number(v);
 function normalize(raw){const data=defaultData();if(!raw||typeof raw!=='object')return data;
  for(const type of ['vehicle','battery']){const w=raw.warranties?.[type];if(w&&typeof w==='object')data.warranties[type]={...data.warranties[type],...w};}
  data.extensions=Array.isArray(raw.extensions)?raw.extensions.filter(x=>x&&typeof x==='object').map(x=>({...x})):[];
  data.policies=Array.isArray(raw.policies)?raw.policies.filter(x=>x&&typeof x==='object').map(x=>({...x})):[];
  data.warnings={...warningDefaults,...(raw.warnings||{})};return data;
 }
 function warrantyErrors(w){const err=[];
  if(!validDate(w.startDate))err.push('Garanti başlangıç tarihi gerekli.');
  if(!Number.isInteger(Number(w.durationMonths))||Number(w.durationMonths)<1||Number(w.durationMonths)>240)err.push('Garanti süresi 1–240 ay arasında olmalı.');
  if(!Number.isInteger(Number(w.maxOdo))||Number(w.maxOdo)<1||Number(w.maxOdo)>2000000)err.push('Kilometre sınırını kontrol edin.');return err;}
 function status({startDate,endDate,maxOdo=null,currentOdo=null,today=null,warnDays=90,warnKm=5000}={}){
  const ref=today||(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})();
  if(!validDate(startDate)||!validDate(endDate)||days(startDate,endDate)<0)return{state:'unknown',remainingDays:null,remainingKm:null,reason:'Tarih bilgisi yok veya geçersiz'};
  const left=days(ref,endDate),startLeft=days(ref,startDate);
  const cap=nullableNum(maxOdo),odo=nullableNum(currentOdo);
  const kmLeft=cap!==null&&Number.isFinite(cap)&&odo!==null&&Number.isFinite(odo)&&odo>=0?cap-odo:null;
  const kmExpired=kmLeft!==null&&kmLeft<=0;
  // A mileage cap can terminate coverage even before the proposed start date: status should not promise it will activate.
  let state=startLeft>0?(kmExpired?'expired':'future'):(left<0||kmExpired?'expired':left<=Number(warnDays)||kmLeft!==null&&kmLeft<=Number(warnKm)?'soon':'active');
  return{state,remainingDays:left,remainingKm:kmLeft,reason:state==='expired'?'Tarih veya km sınırı dolmuş':state==='future'?'Henüz başlamadı':state==='soon'?'Sınır yaklaşıyor':'Kayıtlara göre devam ediyor'};
 }
 function warrantySummary(w,currentOdo,today,warns){const cfg=w||{};const endDate=addMonths(cfg.startDate,Number(cfg.durationMonths));return{...status({startDate:cfg.startDate,endDate,maxOdo:cfg.maxOdo,currentOdo,today,warnDays:warns.days,warnKm:warns.km}),endDate,maxOdo:nullableNum(cfg.maxOdo),startDate:cfg.startDate||''};}
 function warrantyList(data,currentOdo,today){const d=normalize(data);return ['vehicle','battery'].map(type=>({type,config:d.warranties[type],...warrantySummary(d.warranties[type],currentOdo,today,d.warnings)}));}
 function extensionErrors(r){const err=[];if(!['vehicle','battery','other','service_plan','casco_addon'].includes(r.type))err.push('Teminat türünü seçin.');if(!optText(r.provider,150))err.push('Sağlayıcı/kuruluş gerekli.');if(!validDate(r.startDate))err.push('Başlangıç tarihi gerekli.');if(r.endDate&&!validDate(r.endDate))err.push('Bitiş tarihi geçersiz.');if(r.endDate&&validDate(r.endDate)&&days(r.startDate,r.endDate)<0)err.push('Bitiş başlangıçtan önce olamaz.');if(!r.endDate&&nullableNum(r.maxOdo)===null)err.push('En az bir tarih veya km bitiş sınırı belirtin.');if(nullableNum(r.maxOdo)!==null&&(!Number.isInteger(Number(r.maxOdo))||Number(r.maxOdo)<1))err.push('Kilometre sınırı geçersiz.');if(nullableNum(r.premium)!==null&&(!Number.isFinite(Number(r.premium))||Number(r.premium)<0))err.push('Tutar geçersiz.');return err;}
 function extensionSummary(r,currentOdo,today,warns){if(!r.endDate){const cap=nullableNum(r.maxOdo),odo=nullableNum(currentOdo);const ref=today||new Date().toISOString().slice(0,10);if(!validDate(r.startDate))return{state:'unknown',remainingDays:null,remainingKm:null};const left=cap!==null&&odo!==null?cap-odo:null;const upcoming=days(ref,r.startDate)>0;return{state:left===null?'unknown':left<=0?'expired':upcoming?'future':left<=warns.km?'soon':'active',remainingDays:null,remainingKm:left};}
 return status({startDate:r.startDate,endDate:r.endDate,maxOdo:r.maxOdo,currentOdo,today,warnDays:warns.days,warnKm:warns.km});}
 function policyErrors(p){const err=[];if(!['traffic','casco'].includes(p.type))err.push('Poliçe türü geçersiz.');if(!optText(p.company,160))err.push('Sigorta şirketi gerekli.');if(!validDate(p.startDate)||!validDate(p.endDate)||days(p.startDate,p.endDate)<=0)err.push('Geçerli başlangıç/bitiş tarihleri gerekli.');if(nullableNum(p.premium)===null||!Number.isFinite(Number(p.premium))||Number(p.premium)<0)err.push('Toplam poliçe primini girin.');const paid=nullableNum(p.paidAmount);if(paid!==null&&(paid<0||!Number.isFinite(paid)))err.push('Ödenen tutarı kontrol edin.');if(paid!==null&&Number.isFinite(Number(p.premium))&&paid>Number(p.premium))err.push('Ödenen tutar toplam primi aşamaz.');if(p.paymentDate&&!validDate(p.paymentDate))err.push('Ödeme tarihi geçersiz.');if(!Number.isInteger(Number(p.installments))||Number(p.installments)<1||Number(p.installments)>60)err.push('Taksit adedini kontrol edin.');return err;}
 function insuranceSummary(data,today){const d=normalize(data);const groups={};for(const type of ['traffic','casco']){
  const rows=d.policies.filter(p=>p.type===type&&validDate(p.startDate)&&validDate(p.endDate)).map(p=>({...p,...status({startDate:p.startDate,endDate:p.endDate,today,warnDays:d.warnings.policyDays})})).sort((a,b)=>b.startDate.localeCompare(a.startDate)||b.endDate.localeCompare(a.endDate));
  const current=rows.find(p=>p.state==='active'||p.state==='soon')||null;const future=rows.find(p=>p.state==='future')||null;
  const last=rows[0]||null;const highlighted=current||future||last;
  groups[type]={current,future,last,highlighted,count:rows.length,rows};
 }return groups;}
 function renewalComparisons(policies,type){const rows=(policies||[]).filter(p=>p.type===type&&validDate(p.startDate)&&Number.isFinite(Number(p.premium))).sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
  return rows.map((p,i)=>({id:p.id,startDate:p.startDate,company:p.company,premium:Number(p.premium),changePct:i>0&&Number(rows[i-1].premium)>0?(Number(p.premium)/Number(rows[i-1].premium)-1)*100:null}));}
 function validHttps(url){if(!url)return true;try{const u=new URL(url);return u.protocol==='https:';}catch{return false;}}
 return{validDate,days,addMonths,defaultData,normalize,warrantyErrors,warrantySummary,warrantyList,status,extensionErrors,extensionSummary,policyErrors,insuranceSummary,renewalComparisons,validHttps,optText,nullableNum};
});
