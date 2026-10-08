module.exports = async function handler(req,res){
  const url=String((req.query&&req.query.url)||'').trim();
  if(!/^https?:\/\//i.test(url)){
    return res.status(400).json({error:'A valid http:// or https:// recipe URL is required.'});
  }
  const sources=[];
  const addSource=async target=>{
    try{
      const response=await fetch(target,{
        headers:{
          'user-agent':'Mozilla/5.0 (compatible; MetroEatsRecipeImporter/1.0)',
          'accept':'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8'
        },
        redirect:'follow'
      });
      if(response.ok){
        const text=await response.text();
        if(text&&text.length>100)sources.push(text);
      }
    }catch{}
  };
  await addSource(url);
  if(sources.length===0||sources.every(x=>!/<(?:script|html|h[1-6]|section|article)\b/i.test(x))){
    await addSource('https://r.jina.ai/'+url);
  }
  return res.status(200).json({sources:sources.slice(0,2)});
};
