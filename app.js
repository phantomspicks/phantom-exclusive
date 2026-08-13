const UNIT_VALUE=2000;
const FALLBACK_HISTORY=[
 {id:2,date:'2026-08-12',play:'Rockies vs Diamondbacks',detail:'Over 9.5 Runs',odds:-116,units:5,result:'WIN',profit:8620.69},
 {id:3,date:'2026-08-11',play:'Cubs vs Nationals',detail:'Over 9.5 Runs',odds:-117,units:5,result:'WIN',profit:8547.01},
 {id:4,date:'2026-08-10',play:'Braves vs Mets',detail:'Over 8.5 Runs',odds:-108,units:5,result:'WIN',profit:9259.26}
];
let currentState={
  active:false,
  unlocked:false,
  activeDrop:null,
  history:FALLBACK_HISTORY,
  record:{w:3,l:0,p:0},
  profit:FALLBACK_HISTORY.reduce((a,x)=>a+(Number(x.profit)||0),0),
  risk:FALLBACK_HISTORY.reduce((a,x)=>a+(Number(x.units)||5)*UNIT_VALUE,0)
};
let currentFilter='ALL';
function money(n){if(n==null)return '—';const v=Number(n);return `${v>0?'+':v<0?'-':''}$${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function oddsText(o){if(o==null||o==='')return '—';const n=Number(o);return n>0?`+${n}`:`${n}`}
function dateParts(date){const d=new Date(`${date}T12:00:00`);return {m:d.toLocaleString('en-US',{month:'short'}).toUpperCase(),day:String(d.getDate()).padStart(2,'0'),y:d.getFullYear()}}
function setMessage(text){let el=document.getElementById('checkoutMessage');if(!el){el=document.createElement('div');el.id='checkoutMessage';el.className='checkout-message';unlockBtn.insertAdjacentElement('afterend',el)}el.textContent=text||''}
function render(state,filter=currentFilter){currentState=state;currentFilter=filter;const pending=state.active;const status=document.getElementById('playStatus');
 if(pending){status.className='play-status active';status.innerHTML="<span></span><div><b>ACTIVE PLAY LIVE</b><small>Today's Exclusive Play is posted &amp; locked below.</small></div>";}else{status.className='play-status inactive';status.innerHTML="<span></span><div><b>NO ACTIVE PLAY</b><small>The next Exclusive Play has not been posted yet.</small></div>";}
 const unlocked=!!state.unlocked&&!!state.activeDrop;lockedView.hidden=unlocked;revealedPlay.hidden=!unlocked;
 if(unlocked){const x=state.activeDrop;revealedMain.textContent=x.play||'Exclusive Play';revealedDetail.textContent=x.detail||'';revealedOdds.textContent=`ODDS: ${oddsText(x.odds)}`;revealedUnits.textContent=`${x.units||5}U`;unlockBtn.disabled=true;unlockBtn.innerHTML='✓ &nbsp; PLAY UNLOCKED';setMessage(state.accessMessage||'Payment verified. Your active Exclusive Play is visible above.');}
 else if(pending){unlockBtn.disabled=false;unlockBtn.classList.remove('verifying');unlockBtn.innerHTML='🔒 &nbsp; UNLOCK ACTIVE PLAY — $20';}
 else{unlockBtn.disabled=true;unlockBtn.innerHTML='NO ACTIVE PLAY RIGHT NOW';setMessage('');}
 const drops=(Array.isArray(state.history)&&state.history.length?state.history:FALLBACK_HISTORY);const show=filter==='ALL'?drops:drops.filter(x=>x.result===filter);historyRows.innerHTML=show.length?show.map(x=>{const d=dateParts(x.date);return `<article class="history-row ${x.result.toLowerCase()}-row"><div class="datebox"><small>${d.m}</small><strong>${d.day}</strong><small>${d.y}</small></div><div class="pick"><strong>${x.play}</strong><b>${x.detail||''}</b><small>ODDS: ${oddsText(x.odds)} &nbsp; | &nbsp; UNITS: ${x.units}U</small></div><div class="result"><span class="badge ${x.result.toLowerCase()}">${x.result}</span><span class="profit ${x.profit>0?'positive':x.profit<0?'negative':''}">${money(x.profit)}</span></div></article>`}).join(''):`<p style="color:#777;text-align:center;padding:30px 0;font-size:11px">No ${filter.toLowerCase()} results yet.</p>`;
 const r=state.record||{w:0,l:0,p:0};record.textContent=`${r.w}-${r.l}-${r.p}`;netProfit.textContent=money(state.profit||0);roi.textContent=`${state.risk?((state.profit||0)/state.risk*100).toFixed(1):'0.0'}%`;
}
async function loadState(){const r=await fetch('/api/public-state',{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not load plays');render(data,currentFilter);return data}
async function beginCheckout(){try{unlockBtn.disabled=true;unlockBtn.classList.add('verifying');unlockBtn.textContent='CREATING SECURE CHECKOUT…';setMessage('Opening Whop checkout…');const r=await fetch('/api/create-checkout',{method:'POST'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Checkout could not be created');location.href=data.purchaseUrl;}catch(e){unlockBtn.disabled=false;unlockBtn.classList.remove('verifying');unlockBtn.innerHTML='🔒 &nbsp; UNLOCK ACTIVE PLAY — $20';setMessage(e.message)}}
async function verifyReturn(){unlockBtn.disabled=true;unlockBtn.classList.add('verifying');unlockBtn.textContent='VERIFYING WHOP PAYMENT…';setMessage('Payment completed? Verifying it securely with Whop…');for(let i=0;i<12;i++){try{const r=await fetch('/api/verify-access',{cache:'no-store'});const data=await r.json();if(r.ok&&data.verified){history.replaceState({},'',location.pathname);render(data,currentFilter);return}if(r.status!==202&&r.status!==401&&r.status>=400)throw new Error(data.error||'Verification failed');}catch(e){if(i===11)setMessage(e.message)}await new Promise(r=>setTimeout(r,1500));}unlockBtn.classList.remove('verifying');setMessage('Whop has not confirmed the payment yet. Refresh this page in a moment; you will not be charged again.')}
tabs.addEventListener('click',e=>{if(!e.target.dataset.filter)return;tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');render(currentState,e.target.dataset.filter)});
unlockBtn.onclick=beginCheckout;viewAll.onclick=()=>{tabs.querySelector('[data-filter="ALL"]').click();historyRows.scrollIntoView({behavior:'smooth',block:'center'})};showGuide.onclick=()=>guideDialog.showModal();closeGuide.onclick=()=>guideDialog.close();
// Draw the settled history immediately, even before the API/storage credentials are configured.
render(currentState,currentFilter);
(async()=>{try{await loadState();const q=new URLSearchParams(location.search);if(q.get('checkout')==='return'||q.get('status')==='success')await verifyReturn()}catch(e){
  // Keep the built-in settled history visible if the API is unavailable during setup.
  setMessage(e.message);
}})();
