module.exports=async(req,res)=>{res.statusCode=200;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,service:'phantom-exclusive-api'}));};
