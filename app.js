const KEY='phantomExclusiveDrops';
const seed=[
 {id:1,date:'AUG 13',play:'Exclusive Play',units:5,result:'PENDING',profit:null},
 {id:2,date:'AUG 12',play:'Exclusive Play',units:5,result:'WIN',profit:10000},
 {id:3,date:'AUG 11',play:'Exclusive Play',units:5,result:'WIN',profit:10000},
 {id:4,date:'AUG 10',play:'Exclusive Play',units:5,result:'LOSS',profit:-10000},
 {id:5,date:'AUG 09',play:'Exclusive Play',units:5,result:'PUSH',profit:0}
];
function getDrops(){try{return JSON.parse(localStorage.getItem(KEY))||seed}catch{return seed}}
function money(n){if(n===null||n===undefined)return '—'; return `${n>0?'+':''}$${Math.abs(n).toLocaleString()}`.replace('$-','-$')}
function render(){const drops=getDrops(); const graded=drops.filter(x=>x.result!=='PENDING'); const w=graded.filter(x=>x.result==='WIN').length,l=graded.filter(x=>x.result==='LOSS').length,p=graded.filter(x=>x.result==='PUSH').length; const profit=graded.reduce((a,x)=>a+(Number(x.profit)||0),0); const risk=graded.filter(x=>x.result!=='PUSH').reduce((a,x)=>a+(Number(x.units)||5)*2000,0); document.querySelector('#record').textContent=`${w}-${l}-${p}`;document.querySelector('#winrate').textContent=`WIN RATE: ${w+l?Math.round(w/(w+l)*100):0}%`;document.querySelector('#profit').textContent=money(profit);document.querySelector('#roi').textContent=`${risk?(profit/risk*100).toFixed(1):0}%`;document.querySelector('#ledgerRows').innerHTML=drops.slice(0,5).map(x=>`<tr><td>${x.date}</td><td>${x.result==='PENDING'?'Exclusive Play':x.play}</td><td>${x.units}U</td><td><span class="badge ${x.result.toLowerCase()}">${x.result}</span></td><td class="money ${x.profit>0?'pos':x.profit<0?'neg':''}">${money(x.profit)}</td></tr>`).join('')}
document.querySelector('#unlock').onclick=()=>alert('Connect this button to your Whop checkout/access URL before launch.');document.querySelector('#viewAll').onclick=()=>document.querySelector('.ledger').scrollIntoView({behavior:'smooth'});render();
