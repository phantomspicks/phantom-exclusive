(() => {
 const cfg=window.PHANTOM_CONFIG||{};
 if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_")) return;
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=iso=>iso?new Date(iso).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}):"";
 const UNIT_VALUE=2000;
 function unitProfit(r){
   const u=Number(r.units||5),o=Number(r.odds);
   if(r.result==="LOSS")return -u;
   if(r.result==="PUSH")return 0;
   if(r.result==="WIN" && Number.isFinite(o) && o!==0)return o<0?u*100/Math.abs(o):u*o/100;
   return 0;
 }
 function money(v){const sign=v<0?"-":"";return `${sign}$${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`}

 function lockedCard(r,i){
   return `<div class="play-card"><div class="card-top"><span>PLAY ${String(i+1).padStart(2,"0")} • ${Number(r.units||5).toFixed(1)}U</span><span class="lock">LOCKED</span></div>
   <div class="blurred-content"><div class="sport">${esc(r.sport)}</div><div class="matchup">${esc(r.matchup)}</div><div class="pick">${esc(r.pick_text)}</div><div class="details">${esc(r.odds)}</div></div>
   <div class="lock-overlay"><div class="lock-icon">🔒</div><strong>EXCLUSIVE PLAY LOCKED</strong><span>Unlock to reveal the full pick.</span></div></div>`;
 }
 function historyCard(r){
   const pu=unitProfit(r),pd=pu*UNIT_VALUE;
   return `<div class="history-card"><div class="history-row"><div class="history-main"><div class="history-sport">${esc(r.sport||"EXCLUSIVE PLAY")}</div><div class="history-pick">${esc(r.pick_text||"Previous Exclusive Play")}</div><div class="history-matchup">${esc(r.matchup||"")}</div><div class="history-meta"><span>${esc(r.odds||"")}</span><span>${Number(r.units||5).toFixed(1)}U</span><span>${date(r.created_at)}</span><span>${pu>=0?"+":""}${pu.toFixed(2)}U</span><span>${money(pd)}</span></div></div><span class="history-result ${String(r.result).toLowerCase()}">${esc(r.result)}</span></div></div>`}
 async function load(){
   const [{data:current,error:ce},{data:rows,error:re}]=await Promise.all([
     db.from("exclusive_current").select("*").eq("is_live",true).eq("is_settled",false).order("id"),
     db.from("exclusive_results").select("*").order("created_at",{ascending:false})
   ]);
   const cp=document.getElementById("currentPlays");
   if(ce) cp.innerHTML=`<div class="history-empty">${esc(ce.message)}</div>`;
   else if(current?.length){cp.innerHTML=current.map(lockedCard).join("");document.getElementById("playStatus").textContent=current.length>1?`${current.length} EXCLUSIVE PLAYS ARE LIVE`:"EXCLUSIVE PLAY IS LIVE";}
   else {cp.innerHTML='<div class="no-live">NO EXCLUSIVE PLAY IS LIVE RIGHT NOW</div>';document.getElementById("playStatus").textContent="NO LIVE PLAY";}
   const safe=rows||[],w=safe.filter(x=>x.result==="WIN").length,l=safe.filter(x=>x.result==="LOSS").length,p=safe.filter(x=>x.result==="PUSH").length;
   wins.textContent=w;losses.textContent=l;pushes.textContent=p;winRate.textContent=(w+l)?Math.round(w/(w+l)*100)+"%":"0%";
   const totalUnits=safe.reduce((s,r)=>s+Number(r.units||5),0);
   const netUnits=safe.reduce((s,r)=>s+unitProfit(r),0);
   netProfit.textContent=money(netUnits*UNIT_VALUE);
   roi.textContent=totalUnits?`${(netUnits/totalUnits*100).toFixed(1)}%`:"0.0%";
   publicHistory.innerHTML=re?`<div class="history-empty">${esc(re.message)}</div>`:(safe.length?safe.slice(0,20).map(historyCard).join(""):'<div class="history-empty">No previous Exclusive Plays yet.</div>');
 }
 load();
})();