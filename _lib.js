const crypto = require('crypto');

const DATA_KEY = 'phantom:drops:v4';
const UNIT_VALUE = 2000;
const seed = [
  {id:2,createdAt:'2026-08-12T12:00:00Z',settledAt:'2026-08-12T23:00:00Z',date:'2026-08-12',play:'Rockies vs Diamondbacks',detail:'Over 9.5 Runs',odds:-116,units:5,result:'WIN',profit:8620.69},
  {id:3,createdAt:'2026-08-11T12:00:00Z',settledAt:'2026-08-11T23:00:00Z',date:'2026-08-11',play:'Cubs vs Nationals',detail:'Over 9.5 Runs',odds:-117,units:5,result:'WIN',profit:8547.01},
  {id:4,createdAt:'2026-08-10T12:00:00Z',settledAt:'2026-08-10T23:00:00Z',date:'2026-08-10',play:'Braves vs Mets',detail:'Over 8.5 Runs',odds:-108,units:5,result:'WIN',profit:9259.26}
];

function env(name, alt){ return process.env[name] || (alt ? process.env[alt] : undefined); }
function redisConfig(){
  return {url: env('UPSTASH_REDIS_REST_URL','KV_REST_API_URL'), token: env('UPSTASH_REDIS_REST_TOKEN','KV_REST_API_TOKEN')};
}
function redisReady(){ const {url,token}=redisConfig(); return !!(url&&token); }
async function redis(command){
  const {url,token}=redisConfig();
  if(!url||!token) throw new Error('Redis is not configured');
  const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command)});
  const data=await r.json();
  if(!r.ok||data.error) throw new Error(data.error||`Redis ${r.status}`);
  return data.result;
}
async function getDrops(){
  if(!redisReady()) return seed.map(x=>({...x}));
  const raw=await redis(['GET',DATA_KEY]);
  if(!raw){ await saveDrops(seed); return seed.map(x=>({...x})); }
  try { return JSON.parse(raw); } catch { return seed.map(x=>({...x})); }
}
async function saveDrops(drops){
  if(!redisReady()) throw new Error('Redis is not configured');
  await redis(['SET',DATA_KEY,JSON.stringify(drops)]);
}
function hmacSecret(){ return process.env.SESSION_SECRET || process.env.ADMIN_SECRET || ''; }
function b64url(input){ return Buffer.from(input).toString('base64url'); }
function signPayload(payload){
  const secret=hmacSecret(); if(!secret) throw new Error('SESSION_SECRET is not configured');
  const body=b64url(JSON.stringify(payload));
  const sig=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verifyPayload(token){
  try{
    const secret=hmacSecret(); if(!secret||!token) return null;
    const [body,sig]=token.split('.'); if(!body||!sig) return null;
    const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
    const a=Buffer.from(sig),b=Buffer.from(expected); if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return null;
    return JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
  }catch{return null}
}
function parseCookies(req){
  const out={}; String(req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())}); return out;
}
function cookie(name,value,maxAge){
  const secure=process.env.NODE_ENV==='production'||process.env.VERCEL_ENV==='production';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure?' Secure;':''}`;
}
function clearCookie(name){ return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`; }
function baseUrl(req){
  const configured=process.env.PUBLIC_SITE_URL;
  if(configured) return configured.replace(/\/$/,'');
  const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
  const host=req.headers['x-forwarded-host']||req.headers.host;
  return `${proto}://${host}`;
}
function whopHeaders(){
  if(!process.env.WHOP_API_KEY) throw new Error('WHOP_API_KEY is not configured');
  return {Authorization:`Bearer ${process.env.WHOP_API_KEY}`,'Content-Type':'application/json','Api-Version-Date':'2026-08-12'};
}
async function whopCreateCheckout({drop,req}){
  if(!process.env.WHOP_COMPANY_ID) throw new Error('WHOP_COMPANY_ID is not configured');
  const orderId=`phantom_${crypto.randomUUID()}`;
  const redirectUrl=`${baseUrl(req)}/?checkout=return`;
  const plan={initial_price:20,plan_type:'one_time'};
  if(process.env.WHOP_PRODUCT_ID) plan.product_id=process.env.WHOP_PRODUCT_ID;
  const body={company_id:process.env.WHOP_COMPANY_ID,plan,mode:'payment',redirect_url:redirectUrl,metadata:{order_id:orderId,phantom_drop_id:String(drop.id)}};
  if(process.env.WHOP_AFFILIATE_CODE||'phantomspicks') body.affiliate_code=process.env.WHOP_AFFILIATE_CODE||'phantomspicks';
  const r=await fetch('https://api.whop.com/api/v1/checkout_configurations',{method:'POST',headers:whopHeaders(),body:JSON.stringify(body)});
  const data=await r.json(); if(!r.ok) throw new Error(data?.error?.message||data?.message||`Whop ${r.status}`);
  let purchaseUrl=data.purchase_url; if(purchaseUrl&&purchaseUrl.startsWith('/')) purchaseUrl=`https://whop.com${purchaseUrl}`;
  return {checkoutId:data.id,orderId,purchaseUrl,dropId:drop.id,startedAt:Date.now()};
}
async function whopVerifyCheckout(checkoutId,orderId){
  const u=new URL('https://api.whop.com/api/v1/payments');
  u.searchParams.append('checkout_configuration_ids',checkoutId);
  u.searchParams.append('substatuses','succeeded');
  u.searchParams.set('first','20');
  const r=await fetch(u,{headers:whopHeaders()}); const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message||data?.message||`Whop ${r.status}`);
  const payments=Array.isArray(data.data)?data.data:[];
  return payments.find(p=>{
    const succeeded=p.substatus==='succeeded'||p.status==='paid'||p.status==='succeeded';
    const notRefunded=!['refunded','auto_refunded','partially_refunded'].includes(p.substatus);
    const orderMatches=!p.metadata?.order_id||p.metadata.order_id===orderId;
    const amount=Number(p.usd_total ?? p.total ?? p.amount ?? 0);
    return succeeded&&notRefunded&&orderMatches&&amount>=19.99;
  })||null;
}
function accessStillValid(access,drops){
  if(!access||!access.purchasedAt) return false;
  const purchased=Number(access.purchasedAt);
  return !drops.some(d=>d.result==='WIN' && d.settledAt && new Date(d.settledAt).getTime()>=purchased);
}
function sanitizeState(drops,access){
  const pending=drops.find(d=>d.result==='PENDING')||null;
  const valid=accessStillValid(access,drops);
  const settled=drops.filter(d=>d.result!=='PENDING');
  const purchased=Number(access?.purchasedAt||0);
  const postPurchaseSettled=valid&&purchased
    ? settled.filter(d=>d.settledAt&&new Date(d.settledAt).getTime()>=purchased)
        .sort((a,b)=>new Date(b.settledAt)-new Date(a.settledAt))
    : [];
  const latestAccessResult=postPurchaseSettled[0]?.result||null;
  let accessMessage='';
  if(valid&&latestAccessResult==='LOSS') accessMessage='LOSS — your access rolls over until we win. Your next Exclusive Play is included.';
  else if(valid&&latestAccessResult==='PUSH') accessMessage='PUSH — your next Exclusive Play is FREE. Your access is still active.';
  else if(valid&&access) accessMessage='Payment verified. Your Exclusive Play access is active.';
  return {
    active:!!pending,
    unlocked:!!(pending&&valid),
    activeDrop: pending&&valid ? pending : null,
    accessMessage,
    accessReason: latestAccessResult,
    history:settled,
    record:{w:settled.filter(x=>x.result==='WIN').length,l:settled.filter(x=>x.result==='LOSS').length,p:settled.filter(x=>x.result==='PUSH').length},
    profit:settled.reduce((a,x)=>a+(Number(x.profit)||0),0),
    risk:settled.filter(x=>x.result!=='PUSH').reduce((a,x)=>a+(Number(x.units)||5)*UNIT_VALUE,0)
  };
}
function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
function isAdmin(req){const given=String(req.headers['x-admin-secret']||'');const expected=String(process.env.ADMIN_SECRET||'');return !!expected&&given.length===expected.length&&crypto.timingSafeEqual(Buffer.from(given),Buffer.from(expected));}
module.exports={UNIT_VALUE,seed,getDrops,saveDrops,signPayload,verifyPayload,parseCookies,cookie,clearCookie,whopCreateCheckout,whopVerifyCheckout,accessStillValid,sanitizeState,json,isAdmin,redisReady};
