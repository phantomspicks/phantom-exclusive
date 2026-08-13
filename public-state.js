const {getDrops,parseCookies,verifyPayload,sanitizeState,json,redisReady}=require('./_lib');
module.exports=async (req,res)=>{try{const drops=await getDrops();const access=verifyPayload(parseCookies(req).phantom_access);json(res,200,{...sanitizeState(drops,access),serverStorage:redisReady()});}catch(e){json(res,500,{error:e.message})}};
