(() => {
  const cfg = window.PHANTOM_CONFIG || {};
  const UNIT_VALUE=2000;
  const DEFAULT_UNITS=5;
  const loginView = document.getElementById("loginView");
  const adminView = document.getElementById("adminView");
  const loginMsg = document.getElementById("loginMsg");
  const saveMsg = document.getElementById("saveMsg");
  const gradeMsg = document.getElementById("gradeMsg");

  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("PASTE_")) {
    loginMsg.textContent = "Add your Supabase URL and publishable/anon key in config.js first.";
    return;
  }

  const db = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  let state = { is_live:false, is_locked:false, is_settled:false, updated_at:null };
  let currentPlay = { sport:"", matchup:"", pick_text:"", odds:"", american_odds:null, units:DEFAULT_UNITS };
  let editMode = false;
  let previewUnlocked = false;

  function money(n){const v=Number(n)||0;return `${v>0?'+':v<0?'-':''}$${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
  function calcProfit(result,units,odds){const risk=(Number(units)||DEFAULT_UNITS)*UNIT_VALUE;if(result==='PUSH')return 0;if(result==='LOSS')return -risk;if(result!=='WIN')return 0;const o=Number(odds);if(!o)return 0;return o<0?risk*100/Math.abs(o):risk*o/100}
  function showLoggedOut(){ loginView.classList.remove("hidden"); adminView.classList.add("hidden"); }
  function showLoggedIn(){ loginView.classList.add("hidden"); adminView.classList.remove("hidden"); loadCurrent(); }

  async function checkSession(){ const { data } = await db.auth.getSession(); data.session ? showLoggedIn() : showLoggedOut(); }

  document.getElementById("loginBtn").addEventListener("click", async () => {
    loginMsg.textContent = "Signing in...";
    const { error } = await db.auth.signInWithPassword({email: document.getElementById("loginEmail").value.trim(),password: document.getElementById("loginPassword").value});
    if (error) return loginMsg.textContent = error.message;
    loginMsg.textContent = ""; showLoggedIn();
  });
  document.getElementById("loginPassword").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginBtn").click(); });
  document.getElementById("logoutBtn").addEventListener("click", async () => { await db.auth.signOut(); showLoggedOut(); });
  db.auth.onAuthStateChange((_event, session) => session ? showLoggedIn() : showLoggedOut());

  function formatTime(iso){if(!iso) return "Not submitted yet.";const d = new Date(iso);return "Last submitted " + d.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
  function historyDate(iso){if(!iso)return"";return new Date(iso).toLocaleDateString([], {month:"short",day:"numeric",year:"numeric"});}

  async function loadHistory(){
    const { data, error } = await db.from("exclusive_results").select("result,sport,matchup,pick_text,odds,american_odds,units,profit,created_at").order("created_at",{ascending:false});
    const wrap = document.getElementById("adminHistory");
    if(error){wrap.innerHTML = `<div class="history-empty">${error.message}</div>`;return;}
    const rows=data||[];
    let w=0,l=0,p=0,totalProfit=0,totalRisk=0;
    rows.forEach(r=>{if(r.result==='WIN')w++;if(r.result==='LOSS')l++;if(r.result==='PUSH')p++;const units=Number(r.units)||DEFAULT_UNITS;const profit=r.profit!=null?Number(r.profit):calcProfit(r.result,units,r.american_odds);totalProfit+=profit||0;if(r.result==='WIN'||r.result==='LOSS')totalRisk+=units*UNIT_VALUE;});
    document.getElementById('adminRecord').textContent=`${w}-${l}-${p}`;
    document.getElementById('adminProfit').textContent=money(totalProfit);
    document.getElementById('adminRoi').textContent=totalRisk?`${((totalProfit/totalRisk)*100).toFixed(1)}%`:'0.0%';
    if(!rows.length){wrap.innerHTML = '<div class="history-empty">No previous Phantom Drops yet.</div>';return;}
    wrap.innerHTML = rows.map(r => `<div class="history-card"><div class="history-row"><div class="history-main"><div class="history-sport">${r.sport || "PHANTOM DROP"}</div><div class="history-pick">${r.pick_text || "Previous Phantom Drop"}</div><div class="history-matchup">${r.matchup || ""}</div><div class="history-meta"><span>${r.american_odds!=null?((r.american_odds>0?'+':'')+r.american_odds):(r.odds||'')}</span><span>${Number(r.units)||DEFAULT_UNITS}U</span><span>${historyDate(r.created_at)}</span><span>${money(r.profit!=null?r.profit:calcProfit(r.result,r.units,r.american_odds))}</span></div></div><span class="history-result">${r.result}</span></div></div>`).join("");
  }

  function renderPreview(){
    document.getElementById("previewSport").textContent = currentPlay.sport || "SPORT • TODAY";
    document.getElementById("previewMatchup").textContent = currentPlay.matchup || "Matchup Hidden";
    document.getElementById("previewPick").textContent = currentPlay.pick_text || "Phantom Drop Hidden";
    document.getElementById("previewOdds").textContent = currentPlay.odds || (currentPlay.american_odds!=null?String(currentPlay.american_odds):"Odds Hidden");
    const card = document.getElementById("previewCard");
    card.classList.toggle("unlocked", previewUnlocked);
    document.getElementById("previewLockLabel").textContent = previewUnlocked ? "UNLOCKED" : "LOCKED";
    document.getElementById("showLocked").classList.toggle("btn-primary", !previewUnlocked);
    document.getElementById("showUnlocked").classList.toggle("btn-primary", previewUnlocked);
  }

  function render(){
    const submitted = !!(currentPlay.sport || currentPlay.matchup || currentPlay.pick_text || currentPlay.odds || currentPlay.american_odds);
    document.getElementById("submissionTitle").textContent = submitted ? (state.is_live ? "DROP SUBMITTED • LIVE" : "DROP SAVED • NOT LIVE") : "NO DROP SUBMITTED";
    document.getElementById("submissionTime").textContent = submitted ? formatTime(state.updated_at) : "Save a drop to publish it.";
    document.getElementById("submissionDot").classList.toggle("sent", submitted);
    document.getElementById("livePill").textContent = state.is_live ? "LIVE" : "NOT LIVE";
    document.getElementById("lockPill").textContent = state.is_locked ? "LOCKED" : "UNLOCKED";
    document.getElementById("settledPill").textContent = state.is_settled ? "SETTLED" : "NOT SETTLED";
    document.getElementById("livePill").classList.toggle("on", state.is_live);
    document.getElementById("lockPill").classList.toggle("on", state.is_locked);
    document.getElementById("settledPill").classList.toggle("on", state.is_settled);
    const freeze = state.is_locked && !editMode;
    ["sport","matchup","pickText","odds","americanOdds","units","isLive"].forEach(id => document.getElementById(id).disabled = freeze);
    document.getElementById("savePlay").disabled = freeze;
    document.getElementById("editPlay").disabled = !submitted;
    document.getElementById("editPlay").textContent = editMode ? "CANCEL EDIT" : "EDIT DROP";
    document.getElementById("lockPlay").textContent = state.is_locked ? "UNLOCK DROP" : "LOCK DROP";
    document.getElementById("settledCheck").checked = state.is_settled;
    document.querySelectorAll(".grade").forEach(b => b.disabled = !state.is_settled);
    renderPreview();
  }

  async function loadCurrent(){
    const { data, error } = await db.from("exclusive_current").select("*").eq("id",1).maybeSingle();
    if(error){ saveMsg.textContent=error.message; return; }
    if(data){
      currentPlay = {sport:data.sport || "",matchup:data.matchup || "",pick_text:data.pick_text || "",odds:data.odds || "",american_odds:data.american_odds,units:Number(data.units)||DEFAULT_UNITS};
      document.getElementById("sport").value=currentPlay.sport;
      document.getElementById("matchup").value=currentPlay.matchup;
      document.getElementById("pickText").value=currentPlay.pick_text;
      document.getElementById("odds").value=currentPlay.odds;
      document.getElementById("americanOdds").value=currentPlay.american_odds??"";
      document.getElementById("units").value=currentPlay.units;
      document.getElementById("isLive").value=String(!!data.is_live);
      state = {is_live:!!data.is_live,is_locked:!!data.is_locked,is_settled:!!data.is_settled,updated_at:data.updated_at || null};
    }
    editMode = false; render(); loadHistory();
  }

  document.getElementById("editPlay").addEventListener("click", () => {editMode = !editMode;if (!editMode) loadCurrent(); else {saveMsg.textContent = "Edit mode enabled. Make changes, then press SUBMIT DROP.";render();}});

  document.getElementById("savePlay").addEventListener("click", async () => {
    saveMsg.textContent = "Submitting..."; const now = new Date().toISOString();
    const payload = {id:1,sport:document.getElementById("sport").value.trim(),matchup:document.getElementById("matchup").value.trim(),pick_text:document.getElementById("pickText").value.trim(),odds:document.getElementById("odds").value.trim(),american_odds:document.getElementById("americanOdds").value===''?null:Number(document.getElementById("americanOdds").value),units:Number(document.getElementById("units").value)||DEFAULT_UNITS,is_live:document.getElementById("isLive").value==="true",is_settled:false,updated_at:now};
    const { error } = await db.from("exclusive_current").upsert(payload); if(error){ saveMsg.textContent=error.message; return; }
    currentPlay = {...payload}; state.is_live=payload.is_live;state.is_settled=false;state.updated_at=now;editMode=false;saveMsg.textContent=payload.is_live?"Submitted. Customer page is now showing this Phantom Drop.":"Saved, but not live to customers.";render();
  });

  document.getElementById("lockPlay").addEventListener("click", async () => {const next=!state.is_locked;const { error }=await db.from("exclusive_current").update({is_locked:next,updated_at:new Date().toISOString()}).eq("id",1);if(!error)state.is_locked=next;editMode=false;saveMsg.textContent=error?error.message:(next?"Drop locked.":"Drop unlocked for editing.");render();});
  document.getElementById("refreshPreview").addEventListener("click", async () => {saveMsg.textContent = "Refreshing preview...";await loadCurrent();saveMsg.textContent = "Preview refreshed.";});
  document.getElementById("showLocked").addEventListener("click", () => {previewUnlocked = false;renderPreview();});
  document.getElementById("showUnlocked").addEventListener("click", () => {previewUnlocked = true;renderPreview();});
  document.getElementById("settledCheck").addEventListener("change", async e => {const next=e.target.checked;const { error }=await db.from("exclusive_current").update({is_settled:next,updated_at:new Date().toISOString()}).eq("id",1);if(!error)state.is_settled=next;gradeMsg.textContent=error?error.message:(next?"Bet settled. Grading enabled.":"Settlement removed. Grading disabled.");render();});

  document.querySelectorAll(".grade").forEach(btn => btn.addEventListener("click", async () => {
    if(!state.is_settled){ gradeMsg.textContent="Mark the bet settled first."; return; }
    const result=btn.dataset.result; gradeMsg.textContent="Grading...";
    const profit=calcProfit(result,currentPlay.units,currentPlay.american_odds);
    const { error }=await db.from("exclusive_results").insert({result,sport:currentPlay.sport,matchup:currentPlay.matchup,pick_text:currentPlay.pick_text,odds:currentPlay.odds,american_odds:currentPlay.american_odds,units:currentPlay.units,profit});
    if(error){ gradeMsg.textContent=error.message; return; }
    await db.from("exclusive_current").update({is_live:false,is_locked:true,is_settled:true,updated_at:new Date().toISOString()}).eq("id",1);
    state.is_live=false;state.is_locked=true;state.is_settled=true;gradeMsg.textContent=`${result} recorded. Phantom Performance updated.`;render();loadHistory();
  }));

  checkSession();
})();
