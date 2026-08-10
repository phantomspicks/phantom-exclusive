(() => {
  const cfg = window.PHANTOM_CONFIG || {};
  const saveMsg = document.getElementById("saveMsg");
  const gradeMsg = document.getElementById("gradeMsg");

  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("PASTE_")) {
    saveMsg.textContent = "Add your Supabase URL and anon key in config.js first.";
    return;
  }

  const db = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  async function loadCurrent() {
    const { data } = await db.from("exclusive_current").select("*").eq("id", 1).maybeSingle();
    if (!data) return;
    document.getElementById("sport").value = data.sport || "";
    document.getElementById("matchup").value = data.matchup || "";
    document.getElementById("pickText").value = data.pick_text || "";
    document.getElementById("odds").value = data.odds || "";
    document.getElementById("isLive").value = String(!!data.is_live);
  }

  document.getElementById("savePlay").addEventListener("click", async () => {
    saveMsg.textContent = "Saving...";
    const payload = {
      id: 1,
      sport: document.getElementById("sport").value.trim(),
      matchup: document.getElementById("matchup").value.trim(),
      pick_text: document.getElementById("pickText").value.trim(),
      odds: document.getElementById("odds").value.trim(),
      is_live: document.getElementById("isLive").value === "true",
      updated_at: new Date().toISOString()
    };
    const { error } = await db.from("exclusive_current").upsert(payload);
    saveMsg.textContent = error ? error.message : "Exclusive Play saved.";
  });

  document.querySelectorAll(".grade").forEach(btn => btn.addEventListener("click", async () => {
    const result = btn.dataset.result;
    gradeMsg.textContent = "Grading...";
    const { data: play } = await db.from("exclusive_current").select("*").eq("id", 1).maybeSingle();
    const payload = {
      result,
      sport: play?.sport || "",
      matchup: play?.matchup || "",
      pick_text: play?.pick_text || "",
      odds: play?.odds || ""
    };
    const { error } = await db.from("exclusive_results").insert(payload);
    if (error) {
      gradeMsg.textContent = error.message;
      return;
    }
    await db.from("exclusive_current").update({ is_live:false, updated_at:new Date().toISOString() }).eq("id",1);
    gradeMsg.textContent = `${result} recorded. Public tracker updated.`;
  }));

  loadCurrent();
})();