(() => {
 const cfg=window.PHANTOM_CONFIG||{}, saveMsg=document.getElementById("saveMsg"), gradeMsg=document.getElementById("gradeMsg");
 if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_")){saveMsg.textContent="Add your Supabase URL and anon key in config.js first.";return;}
 const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 let state={is_live:false,is_locked:false,is_settled:false};

 function render(){
  document.getElementById("livePill").textContent=state.is_live?"LIVE":"NOT LIVE";
  document.getElementById("lockPill").textContent=state.is_locked?"LOCKED":"UNLOCKED";
  document.getElementById("settledPill").textContent=state.is_settled?"SETTLED":"NOT SETTLED";
  document.getElementById("livePill").classList.toggle("on",state.is_live);
  document.getElementById("lockPill").classList.toggle("on",state.is_locked);
  document.getElementById("settledPill").classList.toggle("on",state.is_settled);
  ["sport","matchup","pickText","odds","isLive","savePlay"].forEach(id=>document.getElementById(id).disabled=state.is_locked);
  document.getElementById("lockPlay").textContent=state.is_locked?"UNLOCK PLAY":"LOCK PLAY";
  document.getElementById("settledCheck").checked=state.is_settled;
  document.querySelectorAll(".grade").forEach(b=>b.disabled=!state.is_settled);
 }

 async function loadCurrent(){
  const {data}=await db.from("exclusive_current").select("*").eq("id",1).maybeSingle(); if(!data)return;
  document.getElementById("sport").value=data.sport||"";document.getElementById("matchup").value=data.matchup||"";document.getElementById("pickText").value=data.pick_text||"";document.getElementById("odds").value=data.odds||"";document.getElementById("isLive").value=String(!!data.is_live);
  state={is_live:!!data.is_live,is_locked:!!data.is_locked,is_settled:!!data.is_settled}; render();
 }

 document.getElementById("savePlay").addEventListener("click",async()=>{
  saveMsg.textContent="Saving...";
  const payload={id:1,sport:document.getElementById("sport").value.trim(),matchup:document.getElementById("matchup").value.trim(),pick_text:document.getElementById("pickText").value.trim(),odds:document.getElementById("odds").value.trim(),is_live:document.getElementById("isLive").value==="true",is_settled:false,updated_at:new Date().toISOString()};
  const {error}=await db.from("exclusive_current").upsert(payload); if(!error){state.is_live=payload.is_live;state.is_settled=false;} saveMsg.textContent=error?error.message:"Exclusive Play saved.";render();
 });

 document.getElementById("lockPlay").addEventListener("click",async()=>{
  const next=!state.is_locked; saveMsg.textContent=next?"Locking play...":"Unlocking play...";
  const {error}=await db.from("exclusive_current").update({is_locked:next,updated_at:new Date().toISOString()}).eq("id",1);
  if(!error)state.is_locked=next; saveMsg.textContent=error?error.message:(next?"Play locked. Fields are frozen.":"Play unlocked for editing.");render();
 });

 document.getElementById("settledCheck").addEventListener("change",async(e)=>{
  const next=e.target.checked; gradeMsg.textContent=next?"Marking settled...":"Reopening settlement...";
  const {error}=await db.from("exclusive_current").update({is_settled:next,updated_at:new Date().toISOString()}).eq("id",1);
  if(!error)state.is_settled=next; gradeMsg.textContent=error?error.message:(next?"Bet settled. Grading is now enabled.":"Settlement removed. Grading disabled.");render();
 });

 document.querySelectorAll(".grade").forEach(btn=>btn.addEventListener("click",async()=>{
  if(!state.is_settled){gradeMsg.textContent="You must mark the bet settled first.";return;}
  const result=btn.dataset.result; gradeMsg.textContent="Grading...";
  const {data:play}=await db.from("exclusive_current").select("*").eq("id",1).maybeSingle();
  const {error}=await db.from("exclusive_results").insert({result,sport:play?.sport||"",matchup:play?.matchup||"",pick_text:play?.pick_text||"",odds:play?.odds||""});
  if(error){gradeMsg.textContent=error.message;return;}
  await db.from("exclusive_current").update({is_live:false,is_locked:true,is_settled:true,updated_at:new Date().toISOString()}).eq("id",1);
  state={is_live:false,is_locked:true,is_settled:true}; gradeMsg.textContent=`${result} recorded. Tracker updated.`;render();
 }));
 loadCurrent();
})();