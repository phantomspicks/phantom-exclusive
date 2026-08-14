(() => {
 const cfg=window.PHANTOM_CONFIG||{}; if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_"))return;
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);

 function fmtDate(iso){
   if(!iso) return "";
   const d=new Date(iso);
   return d.toLocaleDateString([], {month:"short",day:"numeric",year:"numeric"});
 }

 function historyCard(r){
   return `<div class="history-card">
     <div class="history-row">
       <div class="history-main">
         <div class="history-sport">${r.sport || "EXCLUSIVE PLAY"}</div>
         <div class="history-pick">${r.pick_text || "Previous Exclusive Play"}</div>
         <div class="history-matchup">${r.matchup || ""}</div>
         <div class="history-meta">
           <span>${r.odds || ""}</span>
           <span>${fmtDate(r.created_at)}</span>
         </div>
       </div>
       <span class="history-result">${r.result}</span>
     </div>
   </div>`;
 }

 async function load(){
  const {data:play}=await db.from("exclusive_current").select("*").eq("id",1).maybeSingle();
  if(play){
   document.getElementById("sport").textContent=play.sport||"SPORT • TODAY";
   document.getElementById("matchup").textContent=play.matchup||"Matchup Hidden";
   document.getElementById("pick").textContent=play.pick_text||"Exclusive Pick Hidden";
   document.getElementById("odds").textContent=play.odds||"";
   let s="NO EXCLUSIVE PLAY POSTED";
   if(play.is_live && play.is_locked) s="EXCLUSIVE PLAY LOCKED IN";
   else if(play.is_live) s="EXCLUSIVE PLAY IS LIVE";
   else if(play.is_settled) s="EXCLUSIVE PLAY SETTLED";
   document.getElementById("playStatus").textContent=s;
  }

  const {data:rows}=await db.from("exclusive_results")
    .select("result,sport,matchup,pick_text,odds,created_at")
    .order("created_at",{ascending:false});

  let w=0,l=0,p=0;
  (rows||[]).forEach(r=>{if(r.result==="WIN")w++;if(r.result==="LOSS")l++;if(r.result==="PUSH")p++;});
  document.getElementById("wins").textContent=w;
  document.getElementById("losses").textContent=l;
  document.getElementById("pushes").textContent=p;
  const graded=w+l;
  document.getElementById("winRate").textContent=graded?Math.round((w/graded)*100)+"%":"0%";

  const history=document.getElementById("publicHistory");
  history.innerHTML = rows && rows.length
    ? rows.slice(0,10).map(historyCard).join("")
    : '<div class="history-empty">No previous Exclusive Plays yet.</div>';
 }
 load();
})();