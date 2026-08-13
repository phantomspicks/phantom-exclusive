(() => {
 const cfg=window.PHANTOM_CONFIG||{};
 if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_"))return;
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY),$=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const UNIT=2000;
 const date=iso=>iso?new Date(iso).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}):"";
 function pUnits(r){const u=Number(r.units||5),o=Number(r.odds);if(r.result==="LOSS")return-u;if(r.result==="PUSH")return 0;if(r.result==="WIN"&&Number.isFinite(o)&&o!==0)return o<0?u*100/Math.abs(o):u*o/100;return 0}
 function money(v){return`${v<0?"-":v>0?"+":""}$${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`}
 function locked(r,i){return `<article class="locked-play">
  <div class="locked-label"><span>PLAY ${i+1} · ${Number(r.units||5).toFixed(1)}U</span><b>LOCKED</b></div>
  <div class="locked-secret"><b>${esc(r.pick_text)}</b><span>${esc(r.matchup)}</span><em>${esc(r.odds)}</em></div>
  <div class="locked-cover"><div class="lockcircle">🔒</div><strong>LOCKED</strong><span>UNLOCK TO VIEW TODAY’S DROP</span></div>
 </article>`}
 function receipt(r){const u=pUnits(r),d=u*UNIT,res=String(r.result||"").toLowerCase();return `<article class="receipt">
  <div class="receipt-main"><small>${esc(r.sport||"EXCLUSIVE")}</small><b>${esc(r.pick_text)}</b><span>${esc(r.matchup)}</span><i>${esc(r.odds)} · ${date(r.created_at)} · ${Number(r.units||5).toFixed(1)}U</i></div>
  <span class="result ${res}">${esc(r.result)}</span>
  <div class="profit ${u>0?"green":u<0?"red":""}">${u>0?"+":""}${u.toFixed(2)}U<small>${money(d)}</small></div>
 </article>`}
 async function load(){
  const [{data:cur,error:ce},{data:rows,error:re}]=await Promise.all([
   db.from("exclusive_current").select("*").eq("is_live",true).eq("is_settled",false).order("id"),
   db.from("exclusive_results").select("*").order("created_at",{ascending:false})
  ]);
  if(ce)$("currentPlays").innerHTML=`<div class="empty">${esc(ce.message)}</div>`;
  else if(cur?.length){$("emptyState").classList.add("hidden");$("liveBadge").textContent=cur.length>1?`${cur.length} LIVE`:"LIVE";$("currentPlays").innerHTML=cur.map(locked).join("")}
  else{$("currentPlays").innerHTML="";$("emptyState").classList.remove("hidden");$("liveBadge").textContent="OFFLINE"}
  const a=rows||[],w=a.filter(x=>x.result==="WIN").length,l=a.filter(x=>x.result==="LOSS").length,p=a.filter(x=>x.result==="PUSH").length,total=a.reduce((s,r)=>s+Number(r.units||5),0),net=a.reduce((s,r)=>s+pUnits(r),0);
  $("wins").textContent=w;$("losses").textContent=l;$("pushes").textContent=p;$("winRate").textContent=w+l?`${(w/(w+l)*100).toFixed(1)}%`:"0%";$("netProfit").textContent=money(net*UNIT);$("roi").textContent=total?`${(net/total*100).toFixed(1)}%`:"0.0%";
  $("publicHistory").innerHTML=re?`<div class="empty">${esc(re.message)}</div>`:a.length?a.map(receipt).join(""):`<div class="empty">No previous drops yet.</div>`;
 }
 load();
})();