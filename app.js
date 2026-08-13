const KEY='phantomExclusiveDrops_v3';
const UNIT_VALUE=2000;
const WHOP_CHECKOUT_URL=''; // Paste the Whop checkout URL here when ready.
const seed=[
  {id:2,date:'2026-08-12',play:'Rockies vs Diamondbacks',detail:'Over 9.5 Runs',odds:-116,units:5,result:'WIN',profit:8620.69},
  {id:3,date:'2026-08-11',play:'Cubs vs Nationals',detail:'Over 9.5 Runs',odds:-117,units:5,result:'WIN',profit:8547.01},
  {id:4,date:'2026-08-10',play:'Braves vs Mets',detail:'Over 8.5 Runs',odds:-108,units:5,result:'WIN',profit:9259.26}
];
function getDrops(){try{return JSON.parse(localStorage.getItem(KEY)||'null')||seed}catch{return seed}}
function money(n){if(n==null)return '—';const v=Number(n);return `${v>0?'+':v<0?'-':''}$${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function oddsText(o){if(o==null||o==='')return '—';const n=Number(o);return n>0?`+${n}`:`${n}`}
function dateParts(date){const d=new Date(`${date}T12:00:00`);return {m:d.toLocaleString('en-US',{month:'short'}).toUpperCase(),day:String(d.getDate()).padStart(2,'0'),y:d.getFullYear()}}
function render(filter='ALL'){
 const drops=getDrops().filter(x=>x.result!=='PENDING');
 const show=filter==='ALL'?drops:drops.filter(x=>x.result===filter);
 historyRows.innerHTML=show.length?show.map(x=>{const d=dateParts(x.date);return `<article class="history-row ${x.result.toLowerCase()}-row"><div class="datebox"><small>${d.m}</small><strong>${d.day}</strong><small>${d.y}</small></div><div class="pick"><strong>${x.play}</strong><b>${x.detail||''}</b><small>ODDS: ${oddsText(x.odds)} &nbsp; | &nbsp; UNITS: ${x.units}U</small></div><div class="result"><span class="badge ${x.result.toLowerCase()}">${x.result}</span><span class="profit ${x.profit>0?'positive':x.profit<0?'negative':''}">${money(x.profit)}</span></div></article>`}).join(''):`<p style="color:#777;text-align:center;padding:30px 0;font-size:11px">No ${filter.toLowerCase()} results yet.</p>`;
 const w=drops.filter(x=>x.result==='WIN').length,l=drops.filter(x=>x.result==='LOSS').length,p=drops.filter(x=>x.result==='PUSH').length;
 const profit=drops.reduce((a,x)=>a+(Number(x.profit)||0),0);
 const risk=drops.filter(x=>x.result!=='PUSH').reduce((a,x)=>a+(Number(x.units)||5)*UNIT_VALUE,0);
 record.textContent=`${w}-${l}-${p}`;netProfit.textContent=money(profit);roi.textContent=`${risk?(profit/risk*100).toFixed(1):0.0}%`;
}
tabs.addEventListener('click',e=>{if(!e.target.dataset.filter)return;tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');render(e.target.dataset.filter)});
unlockBtn.onclick=()=>{if(WHOP_CHECKOUT_URL){location.href=WHOP_CHECKOUT_URL}else{alert('Whop checkout link is not connected yet. Add it to WHOP_CHECKOUT_URL in app.js.')}};
viewAll.onclick=()=>{tabs.querySelector('[data-filter="ALL"]').click();historyRows.scrollIntoView({behavior:'smooth',block:'center'})};
showGuide.onclick=()=>guideDialog.showModal();closeGuide.onclick=()=>guideDialog.close();
render();
