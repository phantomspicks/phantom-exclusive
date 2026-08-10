(() => {
  const cfg = window.PHANTOM_CONFIG || {};
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
  let currentPlay = { sport:"", matchup:"", pick_text:"", odds:"" };
  let editMode = false;
  let previewUnlocked = false;

  function showLoggedOut(){ loginView.classList.remove("hidden"); adminView.classList.add("hidden"); }
  function showLoggedIn(){ loginView.classList.add("hidden"); adminView.classList.remove("hidden"); loadCurrent(); }

  async function checkSession(){
    const { data } = await db.auth.getSession();
    data.session ? showLoggedIn() : showLoggedOut();
  }

  document.getElementById("loginBtn").addEventListener("click", async () => {
    loginMsg.textContent = "Signing in...";
    const { error } = await db.auth.signInWithPassword({
      email: document.getElementById("loginEmail").value.trim(),
      password: document.getElementById("loginPassword").value
    });
    if (error) return loginMsg.textContent = error.message;
    loginMsg.textContent = "";
    showLoggedIn();
  });

  document.getElementById("loginPassword").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("loginBtn").click();
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut(); showLoggedOut();
  });

  db.auth.onAuthStateChange((_event, session) => session ? showLoggedIn() : showLoggedOut());

  function formatTime(iso){
    if(!iso) return "Not submitted yet.";
    const d = new Date(iso);
    return "Last submitted " + d.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  }

  function renderPreview(){
    document.getElementById("previewSport").textContent = currentPlay.sport || "SPORT • TODAY";
    document.getElementById("previewMatchup").textContent = currentPlay.matchup || "Matchup Hidden";
    document.getElementById("previewPick").textContent = currentPlay.pick_text || "Exclusive Pick Hidden";
    document.getElementById("previewOdds").textContent = currentPlay.odds || "Odds Hidden";

    const card = document.getElementById("previewCard");
    card.classList.toggle("unlocked", previewUnlocked);
    document.getElementById("previewLockLabel").textContent = previewUnlocked ? "UNLOCKED" : "LOCKED";
    document.getElementById("showLocked").classList.toggle("btn-primary", !previewUnlocked);
    document.getElementById("showUnlocked").classList.toggle("btn-primary", previewUnlocked);
  }

  function render(){
    const submitted = !!(currentPlay.sport || currentPlay.matchup || currentPlay.pick_text || currentPlay.odds);
    document.getElementById("submissionTitle").textContent = submitted ? (state.is_live ? "PLAY SUBMITTED • LIVE" : "PLAY SAVED • NOT LIVE") : "NO PLAY SUBMITTED";
    document.getElementById("submissionTime").textContent = submitted ? formatTime(state.updated_at) : "Save a play to publish it.";
    document.getElementById("submissionDot").classList.toggle("sent", submitted);

    document.getElementById("livePill").textContent = state.is_live ? "LIVE" : "NOT LIVE";
    document.getElementById("lockPill").textContent = state.is_locked ? "LOCKED" : "UNLOCKED";
    document.getElementById("settledPill").textContent = state.is_settled ? "SETTLED" : "NOT SETTLED";
    document.getElementById("livePill").classList.toggle("on", state.is_live);
    document.getElementById("lockPill").classList.toggle("on", state.is_locked);
    document.getElementById("settledPill").classList.toggle("on", state.is_settled);

    const freeze = state.is_locked && !editMode;
    ["sport","matchup","pickText","odds","isLive"].forEach(id => document.getElementById(id).disabled = freeze);

    document.getElementById("savePlay").disabled = freeze;
    document.getElementById("editPlay").disabled = !submitted;
    document.getElementById("editPlay").textContent = editMode ? "CANCEL EDIT" : "EDIT PLAY";
    document.getElementById("lockPlay").textContent = state.is_locked ? "UNLOCK PLAY" : "LOCK PLAY";
    document.getElementById("settledCheck").checked = state.is_settled;
    document.querySelectorAll(".grade").forEach(b => b.disabled = !state.is_settled);

    renderPreview();
  }

  async function loadCurrent(){
    const { data, error } = await db.from("exclusive_current").select("*").eq("id",1).maybeSingle();
    if(error){ saveMsg.textContent=error.message; return; }
    if(!data) return;

    currentPlay = {
      sport:data.sport || "",
      matchup:data.matchup || "",
      pick_text:data.pick_text || "",
      odds:data.odds || ""
    };

    document.getElementById("sport").value=currentPlay.sport;
    document.getElementById("matchup").value=currentPlay.matchup;
    document.getElementById("pickText").value=currentPlay.pick_text;
    document.getElementById("odds").value=currentPlay.odds;
    document.getElementById("isLive").value=String(!!data.is_live);

    state = {
      is_live:!!data.is_live,
      is_locked:!!data.is_locked,
      is_settled:!!data.is_settled,
      updated_at:data.updated_at || null
    };
    editMode = false;
    render();
  }

  document.getElementById("editPlay").addEventListener("click", () => {
    editMode = !editMode;
    if (!editMode) {
      document.getElementById("sport").value=currentPlay.sport;
      document.getElementById("matchup").value=currentPlay.matchup;
      document.getElementById("pickText").value=currentPlay.pick_text;
      document.getElementById("odds").value=currentPlay.odds;
      document.getElementById("isLive").value=String(state.is_live);
      saveMsg.textContent = "Edit cancelled.";
    } else {
      saveMsg.textContent = "Edit mode enabled. Make changes, then press SUBMIT PLAY.";
    }
    render();
  });

  document.getElementById("savePlay").addEventListener("click", async () => {
    saveMsg.textContent = "Submitting...";
    const now = new Date().toISOString();
    const payload = {
      id:1,
      sport:document.getElementById("sport").value.trim(),
      matchup:document.getElementById("matchup").value.trim(),
      pick_text:document.getElementById("pickText").value.trim(),
      odds:document.getElementById("odds").value.trim(),
      is_live:document.getElementById("isLive").value==="true",
      is_settled:false,
      updated_at:now
    };
    const { error } = await db.from("exclusive_current").upsert(payload);
    if(error){ saveMsg.textContent=error.message; return; }

    currentPlay = { sport:payload.sport, matchup:payload.matchup, pick_text:payload.pick_text, odds:payload.odds };
    state.is_live = payload.is_live;
    state.is_settled = false;
    state.updated_at = now;
    editMode = false;
    saveMsg.textContent = payload.is_live ? "Submitted. Customer page is now showing this play." : "Saved, but not live to customers.";
    render();
  });

  document.getElementById("lockPlay").addEventListener("click", async () => {
    const next=!state.is_locked;
    const { error }=await db.from("exclusive_current").update({is_locked:next,updated_at:new Date().toISOString()}).eq("id",1);
    if(!error) state.is_locked=next;
    editMode = false;
    saveMsg.textContent=error?error.message:(next?"Play locked.":"Play unlocked for editing.");
    render();
  });

  document.getElementById("refreshPreview").addEventListener("click", async () => {
    saveMsg.textContent = "Refreshing preview...";
    await loadCurrent();
    saveMsg.textContent = "Preview refreshed.";
  });

  document.getElementById("showLocked").addEventListener("click", () => {
    previewUnlocked = false;
    renderPreview();
  });

  document.getElementById("showUnlocked").addEventListener("click", () => {
    previewUnlocked = true;
    renderPreview();
  });

  document.getElementById("settledCheck").addEventListener("change", async e => {
    const next=e.target.checked;
    const { error }=await db.from("exclusive_current").update({is_settled:next,updated_at:new Date().toISOString()}).eq("id",1);
    if(!error) state.is_settled=next;
    gradeMsg.textContent=error?error.message:(next?"Bet settled. Grading enabled.":"Settlement removed. Grading disabled.");
    render();
  });

  document.querySelectorAll(".grade").forEach(btn => btn.addEventListener("click", async () => {
    if(!state.is_settled){ gradeMsg.textContent="Mark the bet settled first."; return; }
    const result=btn.dataset.result;
    gradeMsg.textContent="Grading...";
    const { error }=await db.from("exclusive_results").insert({
      result,
      sport:currentPlay.sport,
      matchup:currentPlay.matchup,
      pick_text:currentPlay.pick_text,
      odds:currentPlay.odds
    });
    if(error){ gradeMsg.textContent=error.message; return; }

    await db.from("exclusive_current").update({
      is_live:false,is_locked:true,is_settled:true,updated_at:new Date().toISOString()
    }).eq("id",1);

    state.is_live=false; state.is_locked=true; state.is_settled=true;
    gradeMsg.textContent=`${result} recorded. Tracker updated.`;
    render();
  }));

  checkSession();
})();