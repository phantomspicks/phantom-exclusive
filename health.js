const {json,redisReady}=require('./_lib');
module.exports=(req,res)=>json(res,200,{redis:redisReady(),whop:!!(process.env.WHOP_API_KEY&&process.env.WHOP_COMPANY_ID),session:!!process.env.SESSION_SECRET,product:!!process.env.WHOP_PRODUCT_ID});
