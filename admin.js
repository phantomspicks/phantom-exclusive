(() => {
 const cfg=window.PHANTOM_CONFIG||{}, $=id=>document.getElementById(id);
 if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_")){$("loginMsg").textContent="Add Supabase settings in config.js first.";return}
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let draftCount=1;
 function show(session){$("loginView").classList.toggle("hidden",!!session);$("adminView").classList.toggle("hidden",!session);if(session)refresh()}
 async function session(){const {data}=await db.auth.getSession();show(data.session)}
 $("loginBtn").onclick=async()=>{ $("loginMsg").textContent="Signing in..."; const {error}=await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value}); if(error)$("loginMsg").textContent=error.message; else {$("loginMsg").textContent="";show(true)}};
 $("loginPassword").onkeydown=e=>{if(e.key==="Enter")$("loginBtn").click()};
 $("logoutBtn").onclick=async()=>{await db.auth.signOut();show(false)};
 db.auth.onAuthStateChange((_e,s)=>show(s));

 function rowHtml(n){return `<div class="play-editor" data-row="${n}"><div class="play-editor-head"><b>PLAY ${n}</b>${n>1?'<button class="mini danger remove-draft" type="button">DELETE</button>':''}</div><div class="grid4"><div class="field"><label>PICK</label><input class="d-pick" placeholder="Over 9.5 runs"></div><div class="field"><label>ODDS</label><input class="d-odds" placeholder="-120"></div><div class="field"><label>UNITS</label><input class="d-units" type="number" min=".5" step=".5" value="5"></div><div class="field"><label>MATCHUP</label><input class="d-matchup" placeholder="Yankees vs Red Sox"></div></div></div>`}
 function renderDrafts(){const wrap=$("playRows"),existing=[...wrap.querySelectorAll(".play-editor")].map(r=>({p:r.querySelector(".d-pick")?.value||"",o:r.querySelector(".d-odds")?.value||"",m:r.querySelector(".d-matchup")?.value||""}));wrap.innerHTML=Array.from({length:draftCount},(_,i)=>rowHtml(i+1)).join("");[...wrap.querySelectorAll(".play-editor")].forEach((r,i)=>{if(existing[i]){r.querySelector(".d-pick").value=existing[i].p;r.querySelector(".d-odds").value=existing[i].o;r.querySelector(".d-units").value=existing[i].u||"5";r.querySelector(".d-matchup").value=existing[i].m}});wrap.querySelectorAll(".remove-draft").forEach((b,i)=>b.onclick=()=>{b.closest(".play-editor").remove();draftCount=Math.max(1,wrap.querySelectorAll(".play-editor").length);renumber()})}
 function renumber(){[...$("playRows").querySelectorAll(".play-editor")].forEach((r,i)=>{r.dataset.row=i+1;r.querySelector("b").textContent=`PLAY ${i+1}`});draftCount=$("playRows").querySelectorAll(".play-editor").length}
 $("addPlay").onclick=()=>{draftCount++;renderDrafts()}; renderDrafts();

 $("savePlay").onclick=async()=>{
   const sport=$("sport").value.trim(), live=$("isLive").value==="true";
   const plays=[...document.querySelectorAll(".play-editor")].map(r=>({sport,matchup:r.querySelector(".d-matchup").value.trim(),pick_text:r.querySelector(".d-pick").value.trim(),odds:r.querySelector(".d-odds").value.trim(),units:Number(r.querySelector(".d-units").value||5)})).filter(p=>p.pick_text||p.matchup||p.odds);
   if(!plays.length){$("saveMsg").textContent="Add at least one play.";return}
   $("saveMsg").textContent="Posting...";
   const {data:maxRows}=await db.from("exclusive_current").select("id").order("id",{ascending:false}).limit(1);
   let next=(maxRows?.[0]?.id||0)+1, now=new Date().toISOString();
   const payload=plays.map(p=>({...p,id:next++,is_live:live,is_locked:true,is_settled:false,updated_at:now}));
   const {error}=await db.from("exclusive_current").insert(payload);
   if(error){$("saveMsg").textContent=error.message;return}
   $("saveMsg").textContent=`Posted ${plays.length} Exclusive Play${plays.length>1?"s":""}.`;
   draftCount=1;renderDrafts();document.querySelectorAll(".play-editor input").forEach(i=>i.value="");refresh();
 };

 const fmt=iso=>iso?new Date(iso).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}):"";
 const UNIT_VALUE=2000;
 function unitProfit(r){
   const u=Number(r.units||5),o=Number(r.odds);
   if(r.result==="LOSS")return -u;
   if(r.result==="PUSH")return 0;
   if(r.result==="WIN" && Number.isFinite(o) && o!==0) return o<0?u*100/Math.abs(o):u*o/100;
   return 0;
 }
 function money(v){const sign=v<0?"-":"";return `${sign}$${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}`}

 async function loadActive(){
   const {data,error}=await db.from("exclusive_current").select("*").eq("is_settled",false).order("id");
   if(error){$("activeAdmin").innerHTML=`<div class="history-empty">${esc(error.message)}</div>`;return}
   $("activeAdmin").innerHTML=data?.length?data.map(r=>`<div class="history-card"><div class="history-row"><div class="history-main"><div class="history-sport">${esc(r.sport)}</div><div class="history-pick">${esc(r.pick_text)}</div><div class="history-matchup">${esc(r.matchup)}</div><div class="history-meta"><span>${esc(r.odds)}</span><span>${Number(r.units||5).toFixed(1)}U</span><span>${r.is_live?"LIVE":"HIDDEN"}</span></div></div><div class="grade-stack"><button class="mini win" data-grade="WIN" data-id="${r.id}">WIN</button><button class="mini loss" data-grade="LOSS" data-id="${r.id}">LOSS</button><button class="mini push" data-grade="PUSH" data-id="${r.id}">PUSH</button><button class="mini danger" data-delete-current="${r.id}">DELETE</button></div></div></div>`).join(""):'<div class="history-empty">No active plays.</div>';
   document.querySelectorAll("[data-grade]").forEach(b=>b.onclick=()=>grade(Number(b.dataset.id),b.dataset.grade));
   document.querySelectorAll("[data-delete-current]").forEach(b=>b.onclick=()=>deleteCurrent(Number(b.dataset.deleteCurrent)));
 }
 async function grade(id,result){
   if(!confirm(`Settle this play as ${result}?`))return;
   $("gradeMsg").textContent="Settling...";
   const {data:r,error:e}=await db.from("exclusive_current").select("*").eq("id",id).single(); if(e){$("gradeMsg").textContent=e.message;return}
   const {error:ie}=await db.from("exclusive_results").insert({result,sport:r.sport,matchup:r.matchup,pick_text:r.pick_text,odds:r.odds,units:Number(r.units||5),created_at:new Date().toISOString()});if(ie){$("gradeMsg").textContent=ie.message;return}
   const {error:de}=await db.from("exclusive_current").delete().eq("id",id);$("gradeMsg").textContent=de?de.message:`Play settled as ${result}.`;refresh()
 }
 async function deleteCurrent(id){if(!confirm("Delete this active play? This cannot be undone."))return;const {error}=await db.from("exclusive_current").delete().eq("id",id);$("gradeMsg").textContent=error?error.message:"Active play deleted.";refresh()}
 async function loadHistory(){
   const {data,error}=await db.from("exclusive_results").select("*").order("created_at",{ascending:false});
   if(error){$("adminHistory").innerHTML=`<div class="history-empty">${esc(error.message)}</div>`;return}
   const rows=data||[];
   const totalUnits=rows.reduce((s,r)=>s+Number(r.units||5),0);
   const netUnits=rows.reduce((s,r)=>s+unitProfit(r),0);
   const netDollars=netUnits*UNIT_VALUE;
   $("adminProfit").textContent=money(netDollars);
   $("adminRoi").textContent=totalUnits?`${(netUnits/totalUnits*100).toFixed(1)}%`:"0.0%";
   $("adminHistory").innerHTML=rows.length?rows.map(r=>{
     const pu=unitProfit(r),pd=pu*UNIT_VALUE;
     return `<div class="history-card"><div class="history-row"><div class="history-main"><div class="history-sport">${esc(r.sport)}</div><div class="history-pick">${esc(r.pick_text)}</div><div class="history-matchup">${esc(r.matchup)}</div><div class="history-meta"><span>${esc(r.odds)}</span><span>${Number(r.units||5).toFixed(1)}U</span><span>${fmt(r.created_at)}</span><span>${pu>=0?"+":""}${pu.toFixed(2)}U</span><span>${money(pd)}</span></div></div><div class="grade-stack"><span class="history-result ${String(r.result).toLowerCase()}">${esc(r.result)}</span><button class="mini danger" data-delete-result="${r.id}">DELETE</button></div></div></div>`
   }).join(""):'<div class="history-empty">No previous plays.</div>';
   document.querySelectorAll("[data-delete-result]").forEach(b=>b.onclick=()=>deleteResult(Number(b.dataset.deleteResult)));
 }
 async function deleteResult(id){if(!confirm("Permanently delete this settled play from Previous Exclusive Plays?"))return;const {error}=await db.from("exclusive_results").delete().eq("id",id);$("gradeMsg").textContent=error?error.message:"Settled play deleted.";refresh()}
 function refresh(){loadActive();loadHistory()}
 session();
})();