const KEY='phantomExclusiveDrops_v2';
const UNIT_VALUE=2000;
const seed=[
 {id:1,date:'AUG 13',play:'Exclusive Play',odds:null,units:5,result:'PENDING',profit:null},
 {id:2,date:'AUG 12',play:'Rockies vs Diamondbacks — Over 9.5 Runs',odds:-116,units:5,result:'WIN',profit:8620.69},
 {id:3,date:'AUG 11',play:'Cubs vs Nationals — Over 9.5 Runs',odds:-117,units:5,result:'WIN',profit:8547.01},
 {id:4,date:'AUG 10',play:'Braves vs Mets — Over 8.5 Runs',odds:-108,units:5,result:'WIN',profit:9259.26}
];
function getDrops(){try{return JSON.parse(localStorage.getItem(KEY))||seed}catch{return seed}}
function money(n){if(n===null||n===undefined)return '—';const v=Number(n);const sign=v>0?'+':v<0?'-':'';return `${sign}$${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function fmtOdds(o){if(o===null||o===undefined||o==='')return '—';const n=Number(o);return n>0?`+${n}`:`${n}`}
function render(){
 const drops=getDrops();
 const graded=drops.filter(x=>x.result!=='PENDING');
 const w=graded.filter(x=>x.result==='WIN').length,l=graded.filter(x=>x.result==='LOSS').length,p=graded.filter(x=>x.result==='PUSH').length;
 const profit=graded.reduce((a,x)=>a+(Number(x.profit)||0),0);
 const risk=graded.filter(x=>x.result!=='PUSH').reduce((a,x)=>a+(Number(x.units)||5)*UNIT_VALUE,0);
 document.querySelector('#record').textContent=`${w}-${l}-${p}`;
 document.querySelector('#winrate').textContent=`WIN RATE: ${w+l?Math.round(w/(w+l)*100):0}%`;
 document.querySelector('#profit').textContent=money(profit);
 document.querySelector('#roi').textContent=`${risk?(profit/risk*100).toFixed(1):0}%`;
 document.querySelector('#ledgerRows').innerHTML=drops.slice(0,8).map(x=>`<tr><td>${x.date}</td><td>${x.result==='PENDING'?'Exclusive Play':x.play}</td><td>${x.result==='PENDING'?'—':fmtOdds(x.odds)}</td><td>${x.units}U</td><td><span class="badge ${x.result.toLowerCase()}">${x.result}</span></td><td class="money ${x.profit>0?'pos':x.profit<0?'neg':''}">${money(x.profit)}</td></tr>`).join('')
}
document.querySelector('#unlock').onclick=()=>alert('Connect this button to your Whop checkout/access URL before launch.');
document.querySelector('#viewAll').onclick=()=>document.querySelector('.ledger').scrollIntoView({behavior:'smooth'});
render();
