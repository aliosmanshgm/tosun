/* v0.15.0: Service issue/case workflow. Keeps legacy service rows by ID. */
(function(){
'use strict';
const M=window.T10XService,app=window.T10XApp;
if(!M||!app)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const date=()=>{const x=new Date();return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-')};
const fmt=d=>d?d.split('-').reverse().join('.'):'—';
const newid=()=>crypto.randomUUID?crypto.randomUUID():`svc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let selected='';
const svc=()=>M.normalize(app.getData().service);
const fields={interaction:['svInteractionId','svInteractionIssue','svInteractionDate','svInteractionChannel','svInteractionType','svInteractionContact','svInteractionAppointment','svInteractionAppointmentType','svInteractionDescription','svInteractionDoc'],part:['svPartId','svPartIssue','svPartDate','svPartStatus','svPartComponent','svPartNumber','svPartExpected','svPartReady','svPartOrderNo','svPartDescription'],follow:['svFollowId','svFollowIssue','svFollowDate','svFollowStatus','svFollowDescription','svFollowDoneDate','svFollowNotes']};
const types={interaction:'interactions',part:'partOrders',follow:'followUps'};
function choose(sel,rows,label){const element=$(sel);if(!element)return;const old=element.value;const html=`<option value="">${esc(label)}</option>`+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');if(element.innerHTML!==html){element.innerHTML=html;element.value=old;if(!element.value&&selected&&rows.some(x=>x.id===selected))element.value=selected;}}
function feedback(kind,text){$(kind==='interaction'?'svInteractionFeedback':kind==='part'?'svPartFeedback':'svFollowFeedback').textContent=text;}
function clear(kind){const form=$(kind==='interaction'?'svInteractionForm':kind==='part'?'svPartForm':'svFollowForm');form.reset();$(fields[kind][0]).value='';$(fields[kind][2]).value=date();if(kind==='follow')$('svFollowDoneDate').value='';if(selected)$(fields[kind][1]).value=selected;feedback(kind,'');}
function update(mutator){app.updateData(d=>{d.service=M.normalize(d.service);mutator(d.service);});}
function render(){if(!$('svFlowCases'))return;
 const d=svc(),stats=M.workflowStats(d,{today:date()});
 $('svFlowStats').innerHTML=[['Servis dosyaları',stats.cases],['Açık dosya',stats.openCases],['Parça bekleyen',stats.waitingPartCases],['Geciken takip',stats.overdueFollowUps]].map(([label,n])=>`<div class="service-stat"><span>${label}</span><strong>${n}</strong></div>`).join('');
 const issues=d.issues.map(i=>({id:i.id,title:`${i.title} · ${fmt(i.reportDate)}`})).sort((a,b)=>b.title.localeCompare(a.title,'tr'));
 for(const id of ['svInteractionIssue','svPartIssue','svFollowIssue'])choose(id,issues,'Servis dosyası seçin');
 choose('svPartComponent',d.components.map(c=>({id:c.id,title:c.name+(c.partNo?' · '+c.partNo:'')})),'Bileşen belirtilmedi');
 const filter=$('svFlowFilter').value;
 const list=[...d.issues].filter(i=>filter==='all'||(filter==='closed'?i.status==='resolved':i.status!=='resolved')).sort((a,b)=>String(b.reportDate).localeCompare(String(a.reportDate)));
 $('svFlowCases').innerHTML=list.map(i=>{
 const pending=d.followUps.filter(f=>f.issueId===i.id&&f.status==='open');const next=[...pending].sort((a,b)=>a.dueDate.localeCompare(b.dueDate))[0];const parts=d.partOrders.filter(p=>p.issueId===i.id&&!['ready','installed','cancelled'].includes(p.status));
 const legacy=!i.stage;const stage=i.stage|| (i.status==='resolved'?'closed':i.status==='monitoring'?'monitoring':'reported');
 return `<div class="svc-case ${selected===i.id?'is-selected':''}"><div class="svc-case-head"><div><strong>${esc(i.title)}</strong><small>Başlangıç: ${fmt(i.reportDate)} · ${i.firstVisitId?'Servis ziyareti bağlantılı':'Randevu/ziyaret henüz yok'}</small></div><span class="service-pill ${i.status==='resolved'?'ok':'warn'}">${esc(M.STAGES[stage]||M.ISSUE_STATUS[i.status]||'Açık')}</span></div>
 <div class="svc-case-meta"><span>${pending.length} bekleyen takip</span><span>${parts.length} parça tedarik kaydı</span>${legacy?'<span>Eski kayıt · aşama henüz seçilmedi</span>':''}${next?`<span class="${next.dueDate<date()?'svc-overdue':''}">Sonraki takip: ${fmt(next.dueDate)}</span>`:''}</div>
 <div class="svc-case-buttons"><button type="button" class="secondary" data-svc-open="${esc(i.id)}">${selected===i.id?'Zaman çizelgesi':'Dosyayı Aç / Gelişme Ekle'}</button><button type="button" class="secondary" data-svc-editcase="${esc(i.id)}">Dosyayı Düzenle</button></div></div>`;}).join('')||'<p class="muted">Bu filtrede servis dosyası yok. Randevu almadan da yeni şikâyet dosyası açabilirsiniz.</p>';
 const box=$('svFlowDetail');const issue=d.issues.find(i=>i.id===selected);if(!issue){box.hidden=true;return;}box.hidden=false;
 const timeline=M.timeline(d,selected);const items=timeline.map(x=>{
 const edit=['interaction','part','follow'].includes(x.type)?`<button class="link-btn" data-svc-edit="${x.type}" data-svc-id="${esc(x.id)}">Düzenle</button><button class="link-btn maintenance-delete" data-svc-del="${x.type}" data-svc-id="${esc(x.id)}">Sil</button>`:'';
 return `<div class="svc-timeline-row"><div><small>${fmt(x.date)} · ${esc(x.label)}</small><p>${esc(x.description||'Açıklama bulunmuyor')}</p></div><div class="svc-time-actions">${edit}</div></div>`;
 }).join('');
 const upcoming=d.followUps.filter(x=>x.issueId===selected&&x.status==='open').sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 box.innerHTML=`<div class="card-head"><div><h3>${esc(issue.title)} · Süreç geçmişi</h3><p class="muted">Bu dosyaya ait görüşmeler, ziyaretler, parçalar ve takip görevleri.</p></div><button type="button" class="secondary" id="svcCloseDetail">Kapat</button></div>`+
 (upcoming.length?`<div class="info-box"><strong>Bekleyen işler:</strong> ${upcoming.map(x=>`${fmt(x.dueDate)}: ${esc(x.description)}`).join(' · ')}</div>`:'')+
 `<div id="svFlowTimeline" class="svc-timeline">${items||'<p>Henüz gelişme kaydı bulunmuyor.</p>'}</div>`+
 `<div class="svc-case-buttons"><button class="secondary" data-svc-jump="svInteractionForm">Görüşme Ekle</button><button class="secondary" data-svc-jump="svPartForm">Parça Takibi Ekle</button><button class="secondary" data-svc-jump="svFollowForm">Takip Ekle</button></div>`;
}
function record(kind){const d=svc();let r;
 if(kind==='interaction')r={id:$('svInteractionId').value||newid(),issueId:$('svInteractionIssue').value,date:$('svInteractionDate').value,channel:$('svInteractionChannel').value,type:$('svInteractionType').value,contactName:$('svInteractionContact').value.trim(),appointmentDate:$('svInteractionAppointment').value,appointmentType:$('svInteractionAppointmentType').value,description:$('svInteractionDescription').value.trim(),documentUrl:$('svInteractionDoc').value.trim()};
 else if(kind==='part')r={id:$('svPartId').value||newid(),issueId:$('svPartIssue').value,requestDate:$('svPartDate').value,status:$('svPartStatus').value,componentId:$('svPartComponent').value,partNo:$('svPartNumber').value.trim(),expectedDate:$('svPartExpected').value,readyDate:$('svPartReady').value,orderNo:$('svPartOrderNo').value.trim(),description:$('svPartDescription').value.trim()};
 else r={id:$('svFollowId').value||newid(),issueId:$('svFollowIssue').value,dueDate:$('svFollowDate').value,status:$('svFollowStatus').value,description:$('svFollowDescription').value.trim(),doneDate:$('svFollowDoneDate').value,notes:$('svFollowNotes').value.trim()};
 const errors=(kind==='interaction'?M.validateInteraction:kind==='part'?M.validatePartOrder:M.validateFollowUp)(r,d);if(errors.length){feedback(kind,errors.join(' '));return;}
 selected=r.issueId;update(s=>{const a=s[types[kind]],idx=a.findIndex(x=>x.id===r.id);if(idx<0)a.push(r);else a[idx]={...a[idx],...r};});clear(kind);feedback(kind,'Kayıt kaydedildi ve servis dosyasının zaman çizelgesine eklendi.');
}
function edit(kind,id){const obj=svc()[types[kind]].find(x=>x.id===id);if(!obj)return;selected=obj.issueId;clear(kind);
 const vals=kind==='interaction'?{svInteractionId:obj.id,svInteractionIssue:obj.issueId,svInteractionDate:obj.date,svInteractionChannel:obj.channel,svInteractionType:obj.type,svInteractionContact:obj.contactName,svInteractionAppointment:obj.appointmentDate,svInteractionAppointmentType:obj.appointmentType,svInteractionDescription:obj.description,svInteractionDoc:obj.documentUrl}:kind==='part'?{svPartId:obj.id,svPartIssue:obj.issueId,svPartDate:obj.requestDate,svPartStatus:obj.status,svPartComponent:obj.componentId,svPartNumber:obj.partNo,svPartExpected:obj.expectedDate,svPartReady:obj.readyDate,svPartOrderNo:obj.orderNo,svPartDescription:obj.description}:{svFollowId:obj.id,svFollowIssue:obj.issueId,svFollowDate:obj.dueDate,svFollowStatus:obj.status,svFollowDescription:obj.description,svFollowDoneDate:obj.doneDate,svFollowNotes:obj.notes};
 for(const [field,value]of Object.entries(vals))$(field).value=value??'';const panel=$(kind==='interaction'?'svInteractionPanel':kind==='part'?'svPartPanel':'svFollowPanel');if(panel)panel.open=true;
 $(kind==='interaction'?'svInteractionForm':kind==='part'?'svPartForm':'svFollowForm').scrollIntoView({behavior:'smooth',block:'start'});
}
function init(){if(!$('svFlowCases'))return;
 for(const kind of ['interaction','part','follow']){$(kind==='interaction'?'svInteractionForm':kind==='part'?'svPartForm':'svFollowForm').addEventListener('submit',ev=>{ev.preventDefault();record(kind);});$(kind==='interaction'?'svInteractionClear':kind==='part'?'svPartClear':'svFollowClear').addEventListener('click',()=>clear(kind));clear(kind);}
 $('svFlowFilter').addEventListener('change',render);
 $('svFlowBoard')?.addEventListener('click',()=>{});
 $('service').addEventListener('click',ev=>{const b=ev.target.closest('[data-svc-open],[data-svc-editcase],[data-svc-edit],[data-svc-del],[data-svc-jump],#svcCloseDetail');if(!b)return;
 if(b.id==='svcCloseDetail'){selected='';render();return;}
 if(b.dataset.svcOpen){selected=b.dataset.svcOpen;render();$('svFlowDetail').scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(b.dataset.svcEditcase){const btn=$(`serviceIssueHistory`)?.querySelector(`[data-sv-edit="issue"][data-sv-id="${CSS.escape(b.dataset.svcEditcase)}"]`);if(btn)btn.click();return;}
 if(b.dataset.svcJump){const k=b.dataset.svcJump==='svInteractionForm'?'interaction':b.dataset.svcJump==='svPartForm'?'part':'follow';clear(k);const panel=$(k==='interaction'?'svInteractionPanel':k==='part'?'svPartPanel':'svFollowPanel');if(panel)panel.open=true;$(b.dataset.svcJump).scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(b.dataset.svcEdit){edit(b.dataset.svcEdit,b.dataset.svcId);return;}
 if(b.dataset.svcDel){const k=b.dataset.svcDel,id=b.dataset.svcId;if(!confirm('Bu gelişme kaydı silinsin mi? Servis dosyası ve diğer kayıtlar korunur.'))return;update(s=>{s[types[k]]=s[types[k]].filter(x=>x.id!==id);});return;}
 });render();
}
window.T10XServiceWorkflowUI={render};init();
})();
