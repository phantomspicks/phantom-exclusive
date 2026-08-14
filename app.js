(() => {
 const cfg=window.PHANTOM_CONFIG||{};
 const UNIT_VALUE=2000;
 const DEFAULT_UNITS=5;
 let allRows=[];
 let currentFilter="ALL";
 let expanded=false;

 function fmtDate(iso){
   if(!iso) return {month:"",day:"",year:""};
   const d=new Date(iso);
   return {
     month:d.toLocaleDateString([], {month:"short"}).toUpperCase(),
     day:d.toLocaleDateString([], {day:"numeric"}),
     year:d.toLocaleDateString([], {year:"numeric"})
   };
 }
 function money(n){
   const v=Number(n)||0;
   const sign=v>0?"+":v<0?"-":"";
   return `${sign}$${Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
 }
 function calcProfit(result, units, americanOdds){
   const risk=(Number(units)||DEFAULT_UNITS)*UNIT_VALUE;
   if(result==="PUSH") return 0;
   if(result==="LOSS") return -risk;
   if(result!=="WIN") return 0;
   const o=Number(americanOdds);
   if(!o) return 0;
   return o<0 ? risk*100/Math.abs(o) : risk*o/100;
 }
 function parseOdds(raw){
   const m=String(raw||"").match(/[+-]?\d{3,4}/);
   return m?Number(m[0]):null;
 }
 function normalizedRow(r){
   const units=Number(r.units)||DEFAULT_UNITS;
   const americanOdds=r.american_odds!=null?Number(r.american_odds):parseOdds(r.odds);
   const profit=r.profit!=null?Number(r.profit):calcProfit(r.result,units,americanOdds);
   return {...r,units,americanOdds,profit};
 }
 function historyCard(raw){
   const r=normalizedRow(raw);
   const d=fmtDate(r.created_at);
   return `<article class="history-card result-${String(r.result||"").toLowerCase()}">
     <div class="history-date"><span>${d.month}</span><strong>${d.day}</strong><small>${d.year}</small></div>
     <div class="history-main">
       <div class="history-matchup">${r.matchup || "Phantom Drop"}</div>
       <div class="history-pick">${r.pick_text || "Previous Phantom Drop"}</div>
       <div class="history-meta"><span>ODDS: ${r.americanOdds!=null?(r.americanOdds>0?"+":"")+r.americanOdds:(r.odds||"—")}</span><i></i><span>UNITS: ${r.units}U</span></div>
     </div>
     <div class="history-outcome"><span>${r.result}</span><strong>${money(r.profit)}</strong></div>
   </article>`;
 }
 function renderHistory(){
   const history=document.getElementById("publicHistory");
   if(!history) return;
   const filtered=currentFilter==="ALL"?allRows:allRows.filter(r=>r.result===currentFilter);
   const rows=expanded?filtered:filtered.slice(0,3);
   history.innerHTML=rows.length?rows.map(historyCard).join(""):'<div class="history-empty">No Phantom Drops in this category yet.</div>';
   const btn=document.getElementById("viewAllResults");
   if(btn){
     btn.style.display=filtered.length>3?"inline-flex":"none";
     btn.innerHTML=expanded?'SHOW LESS <span>⌃</span>':'VIEW ALL RESULTS <span>›</span>';
   }
 }
 function renderPerformance(){
   const rows=allRows.map(normalizedRow);
   let w=0,l=0,p=0,totalProfit=0,totalRisk=0;
   rows.forEach(r=>{
     if(r.result==="WIN")w++;
     if(r.result==="LOSS")l++;
     if(r.result==="PUSH")p++;
     totalProfit+=Number(r.profit)||0;
     if(r.result==="WIN"||r.result==="LOSS") totalRisk+=(Number(r.units)||DEFAULT_UNITS)*UNIT_VALUE;
   });
   document.getElementById("recordFull").textContent=`${w}-${l}-${p}`;
   document.getElementById("totalProfit").textContent=money(totalProfit);
   document.getElementById("roi").textContent=totalRisk?`${((totalProfit/totalRisk)*100).toFixed(1)}%`:"0.0%";
 }
 function setupUi(){
   const tabs=document.getElementById("historyTabs");
   if(tabs) tabs.addEventListener("click",e=>{
     const b=e.target.closest("button[data-filter]"); if(!b)return;
     currentFilter=b.dataset.filter; expanded=false;
     tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));
     renderHistory();
   });
   document.getElementById("viewAllResults")?.addEventListener("click",()=>{expanded=!expanded;renderHistory();});
   document.getElementById("profitExamples")?.addEventListener("click",()=>{
     document.getElementById("profitExamplesBox")?.classList.toggle("hidden");
   });
 }
 async function load(){
   setupUi();
   if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("PASTE_")){
     renderPerformance();renderHistory();return;
   }
   const db=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
   const {data:play}=await db.from("exclusive_current").select("*").eq("id",1).maybeSingle();
   if(play){
     document.getElementById("sport").textContent=play.sport||"SPORT • TODAY";
     document.getElementById("matchup").textContent=play.matchup||"Matchup Hidden";
     document.getElementById("pick").textContent=play.pick_text||"Phantom Drop Hidden";
     document.getElementById("odds").textContent=play.odds||"";
     let s="NO PHANTOM DROP POSTED";
     if(play.is_live && play.is_locked) s="PHANTOM DROP LOCKED IN";
     else if(play.is_live) s="PHANTOM DROP IS LIVE";
     else if(play.is_settled) s="PHANTOM DROP SETTLED";
     document.getElementById("playStatus").textContent=s;
   }
   const {data:rows}=await db.from("exclusive_results")
     .select("result,sport,matchup,pick_text,odds,american_odds,units,profit,created_at")
     .order("created_at",{ascending:false});
   allRows=rows||[];
   renderPerformance();
   renderHistory();
 }
 load();
})();
