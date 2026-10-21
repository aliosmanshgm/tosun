/* v0.10.0 - Observation-aware summer/winter range analysis.
   Calendar seasons and measured ambient-temperature bands are separate views.
   SOH, usable pack capacity and ambient battery temperature are never inferred. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./range-model.js'):root?.T10XRange);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.T10XSeasonalRange=api;
})(typeof window!=='undefined'?window:undefined,function(R){
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const validCons=v=>num(v)!==null&&num(v)>=5&&num(v)<=60;
  function localCalendarDate(date){
    if(typeof date!=='string'||!date.trim())return null;
    const only=date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(only){
      const year=+only[1],month=+only[2],day=+only[3];
      if(year<2020||year>2100||month<1||month>12||day<1||day>31)return null;
      const checked=new Date(Date.UTC(year,month-1,day));
      return checked.getUTCFullYear()===year&&checked.getUTCMonth()===month-1&&checked.getUTCDate()===day?only[0]:null;
    }
    const time=Date.parse(date);
    if(!Number.isFinite(time))return null;
    const p=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
    const v=Object.fromEntries(p.map(x=>[x.type,x.value]));
    return `${v.year}-${v.month}-${v.day}`;
  }
  function category(sample,view){
    if(view==='temperature'){
      // A point-in-time weather reading cannot represent a week-long trip window.
      if(sample.source==='observation'){
        if(!(num(sample.windowHours)>0 && Number(sample.windowHours)<=24))return null;
        const begin=num(sample.tempStart),finish=num(sample.tempEnd);
        if(begin===null||finish===null)return null;
        const band=t=>t<=10?'winter':t>=25?'summer':null;
        if(!band(begin)||band(begin)!==band(finish))return null;
      }
      const t=num(sample.temp);
      if(t===null||t< -50||t>60)return null;
      if(t<=10)return 'winter';
      if(t>=25)return 'summer';
      return null;
    }
    const d=localCalendarDate(sample.date);
    if(!d)return null;
    if(sample.source==='observation' && sample.startAt){
      const startDate=localCalendarDate(sample.startAt);
      if(!startDate)return null;
      const seasons=m=>[12,1,2].includes(m)?'winter':[6,7,8].includes(m)?'summer':null;
      if(seasons(+startDate.slice(5,7))!==seasons(+d.slice(5,7)))return null;
    }
    const month=+d.slice(5,7);
    if([12,1,2].includes(month))return 'winter';
    if([6,7,8].includes(month))return 'summer';
    return null;
  }
  function chargingOverlaps(start,end,charges){
    return charges.some(c=>{
      const t=Date.parse(c.date||'');
      if(!Number.isFinite(t))return false;
      const minutes=num(c.durationMin);
      const finish=t+(minutes!==null&&minutes>0?Math.min(minutes,1440)*60000:0);
      return t<=end&&finish>=start;
    });
  }
  function allObservations({driveSessions=[],trips=[],charges=[],socSnapshots=[]}={}){
    const socDrives=R.observedDriveSegments(driveSessions,charges).map(x=>({
      ...x,kind:'soc',source:'drive',date:x.observedAt,temp:x.temp??null
    }));
    const socManual=R.observedManualSegments(trips).map(x=>({
      ...x,kind:'soc',source:'manual',date:x.observedAt,temp:x.temp??null
    }));
    // Do not double count a manual trip resembling an already tracked drive.
    const socObserved=R.observedSnapshotSegments(socSnapshots,charges)
      .filter(x=>!socDrives.some(d=>Number.isFinite(Date.parse(d.startAt||''))&&
        Date.parse(d.startAt)<Date.parse(x.observedAt)&&Date.parse(x.startAt)<Date.parse(d.observedAt)))
      .map(x=>({...x,kind:'soc',source:'observation',date:x.observedAt}));
    const soc=[...socDrives,...socObserved];
    for(const m of socManual){
      const duplicate=soc.some(d=>localCalendarDate(d.date)===localCalendarDate(m.date)&&
        Math.abs(d.km-m.km)<=Math.max(2,d.km*.02)&&Math.abs(d.drop-m.drop)<=2);
      if(!duplicate)soc.push(m);
    }
    const cons=[];
    const linkedIds=new Set(trips.filter(t=>t.linkedDriveId).map(t=>String(t.linkedDriveId)));
    for(const t of trips){
      const km=num(t.distance),average=num(t.consumption);
      if(!(km>=5)||!validCons(average)||!localCalendarDate(t.date))continue;
      cons.push({kind:'consumption',source:t.linkedDriveId?'linked-trip':'manual-trip',id:t.id,
        km,average,temp:t.temp??null,date:t.date,driveId:t.linkedDriveId||null});
    }
    for(const d of driveSessions){
      if(!d.complete||linkedIds.has(String(d.id))||!d.startAt||!d.endAt)continue;
      const start=Date.parse(d.startAt),end=Date.parse(d.endAt);
      const km=num(d.distance),average=num(d.consumption);
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>48*3600000||
        !(km>=5)||!validCons(average)||chargingOverlaps(start,end,charges))continue;
      cons.push({kind:'consumption',source:'drive',id:d.id,km,average,date:d.endAt,temp:d.temp??null,driveId:d.id});
    }
    // One record per linked drive; otherwise intentionally keep individual dated trips.
    return {soc,cons};
  }
  function summarize(observations,group,view,{nominalCapacity=88.5,usableCapacity=null}={}){
    const soc=observations.soc.filter(x=>category(x,view)===group&&localCalendarDate(x.date));
    const cons=observations.cons.filter(x=>category(x,view)===group&&localCalendarDate(x.date));
    const socKm=soc.reduce((n,x)=>n+x.km,0),drop=soc.reduce((n,x)=>n+x.drop,0);
    const consKm=cons.reduce((n,x)=>n+x.km,0);
    const energy=cons.reduce((n,x)=>n+x.km*x.average/100,0);
    const avgConsumption=consKm>0?100*energy/consKm:null;
    const c=num(usableCapacity),n=num(nominalCapacity);
    const cap=c!==null&&c>0?c:n;
    const consumptionRange=avgConsumption!==null&&cap!==null&&cap>0?100*cap/avgConsumption:null;
    const socRange=drop>0?100*socKm/drop:null;
    const uniqueTemps=new Map();
    for(const x of [...soc,...cons]){
      const temp=num(x.temp);
      if(temp===null||temp< -50||temp>60)continue;
      const key=x.driveId||((x.source==='drive'&&x.id)?x.id:null)||`${localCalendarDate(x.date)}|${x.km}|${x.drop??''}`;
      if(!uniqueTemps.has(key))uniqueTemps.set(key,x);
    }
    const temps=[...uniqueTemps.values()];
    // Trip-end ambient samples only; never cell temperature and never historical weather reconstruction.
    const tempWeight=temps.reduce((n,x)=>n+x.km,0);
    const avgTemp=tempWeight>0?temps.reduce((n,x)=>n+x.km*Number(x.temp),0)/tempWeight:null;
    const socAdequate=soc.length>=2&&socKm>=100&&drop>=20;
    const consAdequate=cons.length>=2&&consKm>=100;
    const primary=socRange!==null?'soc':consumptionRange!==null?'consumption':'none';
    const dates=[...soc,...cons].map(x=>localCalendarDate(x.date)).filter(Boolean).sort();
    return {group,view,primary,
      range:primary==='soc'?socRange:consumptionRange,socRange,consumptionRange,
      socCount:soc.length,socKm,socDrop:drop,socAdequate,
      consumptionCount:cons.length,consumptionKm:consKm,consumptionAverage:avgConsumption,consAdequate,
      avgTemp,temperatureRecordCount:temps.length,firstDate:dates[0]||null,lastDate:dates.at(-1)||null,
      capacityBasis:c!==null&&c>0?'user-usable':'nominal-assumption',
      manualSocCount:soc.filter(x=>x.source==='manual').length,
      observationSocCount:soc.filter(x=>x.source==='observation').length
    };
  }
  function analyze({driveSessions=[],trips=[],charges=[],socSnapshots=[],nominalCapacity=88.5,usableCapacity=null,view='calendar'}={}){
    const mode=view==='temperature'?'temperature':'calendar';
    const samples=allObservations({driveSessions,trips,charges,socSnapshots});
    const opts={nominalCapacity,usableCapacity};
    const summer=summarize(samples,'summer',mode,opts),winter=summarize(samples,'winter',mode,opts);
    let method=null,summerRange=null,winterRange=null;
    if(summer.socAdequate&&winter.socAdequate){
      method='soc';summerRange=summer.socRange;winterRange=winter.socRange;
    }else if(summer.consAdequate&&winter.consAdequate){
      // Consumption comparison is sound on relative terms, but absolute range depends on capacity assumption.
      method='consumption';summerRange=summer.consumptionRange;winterRange=winter.consumptionRange;
    }
    const differenceKm=method?summerRange-winterRange:null;
    const differencePct=method&&summerRange>0?(summerRange-winterRange)/summerRange*100:null;
    return {view:mode,summer,winter,comparison:{ready:!!method,method,summerRange,winterRange,
      differenceKm,differencePct,nominalAssumption:method==='consumption'&&summer.capacityBasis==='nominal-assumption'},
      classified:{soc:samples.soc.filter(x=>category(x,mode)!==null).length,consumption:samples.cons.filter(x=>category(x,mode)!==null).length},
      excluded:{soc:samples.soc.filter(x=>category(x,mode)===null).length,consumption:samples.cons.filter(x=>category(x,mode)===null).length},
      note:mode==='calendar'?'Meteorolojik takvim: yaz Haziran–Ağustos, kış Aralık–Şubat. Mart–Mayıs ve Eylül–Kasım karşılaştırmaya girmez.':'Yalnızca sıcaklığı kayıtlı ölçümler: soğuk ≤10°C, sıcak ≥25°C. Gözlem aralığında iki uçta da aynı sıcaklık grubunun ölçülmüş olması ve aralığın ≤24 saat sürmesi gerekir. Dış hava batarya sıcaklığı değildir.'
    };
  }
  return {analyze,localCalendarDate,category,allObservations,summarize};
});
