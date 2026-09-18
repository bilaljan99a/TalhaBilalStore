import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, PATCH, OPTIONS","Content-Type":"application/json"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:cors});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try{
    const auth=req.headers.get("Authorization")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const client=createClient(Deno.env.get("SUPABASE_URL")!,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:ae}=await client.auth.getUser();
    if(ae||!user||user.email?.toLowerCase()!=="bilaljan99a@gmail.com") return out({error:"Unauthorized"},401);
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if(req.method==="GET"){
      const {data,error}=await db.from("orders").select("*").order("created_at",{ascending:false});
      if(error) return out({error:error.message},500);
      const {data:daily,error:de}=await db.from("daily_finance").select("*").order("finance_date",{ascending:false});
      if(de) return out({error:de.message},500);
      const {data:settings,error:se}=await db.from("finance_settings").select("lifetime_ads_cost").eq("id",true).maybeSingle();
      if(se) return out({error:se.message},500);
      return out({orders:data,daily_finance:daily||[],lifetime_ads_cost:Number(settings?.lifetime_ads_cost||0)});
    }
    if(req.method==="PATCH"){
      const b=await req.json();
      if(b.lifetime_ads_cost!==undefined){
        const ads=Number(b.lifetime_ads_cost);
        if(!Number.isFinite(ads)||ads<0)return out({error:"Invalid lifetime ads cost"},400);
        const {error}=await db.from("finance_settings").upsert({id:true,lifetime_ads_cost:ads,updated_at:new Date().toISOString()},{onConflict:"id"});
        if(error)return out({error:error.message},500);
        return out({success:true});
      }
      if(b.finance_date!==undefined && b.daily_ads_cost!==undefined){
        const financeDate=String(b.finance_date).slice(0,10);
        const ads=Number(b.daily_ads_cost);
        if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(financeDate)||!Number.isFinite(ads)||ads<0) return out({error:"Invalid daily ads cost"},400);
        const {error}=await db.from("daily_finance").upsert({finance_date:financeDate,ads_cost:ads,updated_at:new Date().toISOString()},{onConflict:"finance_date"});
        if(error) return out({error:error.message},500);
        return out({success:true});
      }
      if(!b.id) return out({error:"Missing order id"},400);
      const patch:any={};
      if(b.status!==undefined) patch.status=String(b.status);
      if(b.tracking_number!==undefined) patch.tracking_number=String(b.tracking_number||"").trim();
      for(const k of ["product_cost","shipping_cost","return_shipping_cost","ads_cost","packaging_cost","other_cost"]){
        if(b[k]!==undefined){const n=Number(b[k]);if(!Number.isFinite(n)||n<0)return out({error:"Invalid value for "+k},400);patch[k]=n;}
      }
      if(b.finance_note!==undefined) patch.finance_note=String(b.finance_note||"").trim();
      if(!Object.keys(patch).length) return out({error:"Nothing to update"},400);
      const {error}=await db.from("orders").update(patch).eq("id",b.id);
      if(error) return out({error:error.message},500);
      return out({success:true});
    }
    return out({error:"Method not allowed"},405);
  }catch(e){return out({error:e instanceof Error?e.message:String(e)},500)}
});