(() => {
 const cfg=window.PHANTOM_CONFIG||{}; if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_"))return;
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
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
  const {data:rows}=await db.from("exclusive_results").select("result");
  let w=0,l=0,p=0;(rows||[]).forEach(r=>{if(r.result==="WIN")w++;if(r.result==="LOSS")l++;if(r.result==="PUSH")p++;});
  document.getElementById("wins").textContent=w;document.getElementById("losses").textContent=l;document.getElementById("pushes").textContent=p;
  const graded=w+l;document.getElementById("winRate").textContent=graded?Math.round((w/graded)*100)+"%":"0%";
 } load();
})();